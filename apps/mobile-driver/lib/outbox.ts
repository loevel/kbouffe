import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApiFetch } from '@/lib/api';

/**
 * File d'attente des écritures, persistée sur l'appareil.
 *
 * Un livreur travaille dans la rue, en sous-sol, dans une cour d'immeuble : le
 * réseau tombe précisément au moment où il valide une remise. Sans file, ce
 * geste est perdu et il doit le refaire — ou pire, il croit avoir livré alors
 * que la commande est restée « en cours ».
 *
 * Toute écriture passe donc par ici : on tente immédiatement, et si le réseau
 * refuse, l'action est mise de côté et rejouée plus tard. Seules les erreurs
 * réseau sont mises en file. Un refus du serveur (code de remise faux, course
 * déjà traitée) est une réponse, pas une panne : le rejouer indéfiniment
 * masquerait l'erreur au livreur.
 */

const CLE = 'driver_outbox_v1';
/** Au-delà, l'action est trop vieille pour être rejouée sans mentir. */
const AGE_MAX_MS = 24 * 60 * 60 * 1000;

export interface ActionEnAttente {
    id: string;
    path: string;
    method: 'POST' | 'PATCH';
    body: unknown;
    creeA: number;
    /** Rejouée en silence : une position périmée n'intéresse personne. */
    silencieuse?: boolean;
}

async function lire(): Promise<ActionEnAttente[]> {
    try {
        const brut = await AsyncStorage.getItem(CLE);
        return brut ? (JSON.parse(brut) as ActionEnAttente[]) : [];
    } catch {
        return [];
    }
}

async function ecrire(actions: ActionEnAttente[]) {
    try {
        await AsyncStorage.setItem(CLE, JSON.stringify(actions));
    } catch (error) {
        console.error('Outbox: écriture impossible', error);
    }
}

/** Vrai si l'échec vient du réseau, pas d'un refus du serveur. */
function estPanneReseau(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (
        error.name === 'AbortError' ||
        error.message.includes('joindre le serveur') ||
        error.message.includes('trop de temps')
    );
}

async function envoyer(action: ActionEnAttente) {
    const response = await authApiFetch(action.path, {
        method: action.method,
        body: JSON.stringify(action.body),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
        const erreur = new Error(payload.error ?? 'La requête a échoué.');
        (erreur as any).refusServeur = true;
        throw erreur;
    }

    return payload;
}

/**
 * Envoie une action, ou la met en file si le réseau est absent.
 * `misEnFile` dit à l'appelant s'il doit afficher « enregistré » ou « en attente ».
 */
export async function envoyerOuDifferer(
    action: Omit<ActionEnAttente, 'id' | 'creeA'>
): Promise<{ misEnFile: boolean; payload?: unknown }> {
    const complete: ActionEnAttente = {
        ...action,
        // Pas de crypto.randomUUID garanti sur Hermes : l'horodatage suffit,
        // la file étant locale et strictement séquentielle.
        id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        creeA: Date.now(),
    };

    try {
        const payload = await envoyer(complete);
        return { misEnFile: false, payload };
    } catch (error) {
        if (!estPanneReseau(error)) throw error;

        const actions = await lire();
        actions.push(complete);
        await ecrire(actions);
        return { misEnFile: true };
    }
}

export interface ResultatVidage {
    envoyees: number;
    abandonnees: { action: ActionEnAttente; raison: string }[];
}

/**
 * Un seul vidage à la fois.
 *
 * La liste des courses et l'écran d'une course montent chacun le même hook, avec
 * chacun son minuteur : sans ce verrou, deux vidages se lisent la même file et
 * envoient les mêmes actions. Le second envoi se ferait refuser (« course déjà
 * traitée ») et serait présenté au livreur comme un échec, alors que sa remise
 * est bien passée.
 */
let vidageEnCours: Promise<ResultatVidage> | null = null;

export function viderLaFile(): Promise<ResultatVidage> {
    if (!vidageEnCours) {
        vidageEnCours = executerVidage().finally(() => {
            vidageEnCours = null;
        });
    }
    return vidageEnCours;
}

/**
 * Rejoue la file. Renvoie ce qui a été traité, pour que l'appelant puisse
 * rafraîchir ses écrans et prévenir le livreur de ce qui a finalement échoué.
 */
async function executerVidage(): Promise<ResultatVidage> {
    const actions = await lire();
    if (actions.length === 0) return { envoyees: 0, abandonnees: [] };

    const restantes: ActionEnAttente[] = [];
    const abandonnees: { action: ActionEnAttente; raison: string }[] = [];
    let envoyees = 0;

    for (let i = 0; i < actions.length; i += 1) {
        const action = actions[i];

        if (Date.now() - action.creeA > AGE_MAX_MS) {
            abandonnees.push({ action, raison: 'Action trop ancienne pour être rejouée.' });
            continue;
        }

        try {
            await envoyer(action);
            envoyees += 1;
        } catch (error) {
            if (estPanneReseau(error)) {
                // Toujours hors ligne : on garde celle-ci ET tout ce qui suit,
                // sans y toucher. Continuer la boucle enverrait une remise avant
                // sa prise en charge, que le serveur refuserait — et l'action
                // légitime serait alors jetée comme un refus.
                restantes.push(...actions.slice(i));
                break;
            }
            abandonnees.push({
                action,
                raison: error instanceof Error ? error.message : 'Refus du serveur.',
            });
        }
    }

    await ecrire(restantes);
    return { envoyees, abandonnees };
}

/** Nombre d'actions en attente — sert au bandeau « hors ligne ». */
export async function tailleDeLaFile(): Promise<number> {
    return (await lire()).length;
}
