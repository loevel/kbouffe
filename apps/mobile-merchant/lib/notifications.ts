import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

/**
 * Enregistre l'appareil pour les notifications push
 * Récupère le token Expo et l'enregistre dans Supabase push_tokens table
 */
export async function registerForPushNotifications() {
  try {
    // Demander la permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission pour les notifications refusée');
      return;
    }

    // Récupérer le token Expo
    const token = await Notifications.getExpoPushTokenAsync();

    // Récupérer l'utilisateur authentifié
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('Utilisateur non authentifié');
      return;
    }

    // Enregistrer le token dans Supabase (upsert si existe déjà)
    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: user.id,
        token: token.data,
        platform: 'expo',
        device_id: token.data.substring(0, 20), // Utiliser une partie du token comme device_id
        is_active: true,
      },
      { onConflict: 'user_id,token' }
    );

    if (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error);
      return;
    }

    console.log('Token enregistré:', token.data);
    // Sauvegarder le token dans SecureStore pour la récupération plus tard
    await SecureStore.setItemAsync('expo_push_token', token.data);
  } catch (error) {
    console.error('Erreur lors de registerForPushNotifications:', error);
  }
}

/**
 * Configure le handler pour les notifications reçues
 */
export function setupNotificationListeners() {
  // Notification reçue en premier plan
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification reçue (foreground):', notification);
      // Les notifications reçues en premier plan ne déclenchent pas d'alert native
      // Il faut les traiter manuellement si nécessaire
    }
  );

  // Notification touchée par l'utilisateur
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification touchée:', response.notification.request.content.data);
      handleNotificationPress(response.notification.request.content.data);
    }
  );

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Gère la navigation quand une notification est touchée
 */
function handleNotificationPress(data: Record<string, any>) {
  // Navigue vers l'écran approprié basé sur le type de notification
  // Cette fonction sera disponible depuis les écrans après setup
  console.log('Handling notification press with data:', data);

  // Exemples de types de notification:
  // - new_order: navigue vers /orders
  // - new_message: navigue vers /messages/[id]
  // - new_review: navigue vers /reviews
  // - new_reservation: navigue vers /reservations

  if (data.type === 'new_order' && data.order_id) {
    // Navigation sera gérée via deeplink ou context
  }
}

/**
 * Récupère et valide le token sauvegardé
 */
export async function getSavedPushToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync('expo_push_token');
    return token || null;
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
}

/**
 * Supprime le token enregistré (pour la déconnexion)
 */
export async function unregisterPushToken() {
  try {
    const token = await getSavedPushToken();

    if (token) {
      const { error } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('token', token);

      if (error) {
        console.error('Erreur lors de la désinscription:', error);
      } else {
        await SecureStore.deleteItemAsync('expo_push_token');
        console.log('Token supprimé');
      }
    }
  } catch (error) {
    console.error('Erreur lors de unregisterPushToken:', error);
  }
}

// Configure le handler pour les notifications en arrière-plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
