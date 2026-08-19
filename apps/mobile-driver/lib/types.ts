/** Types partagés de l'app livreur — miroir de apps/api/src/modules/driver. */

/** Statuts qu'une course peut porter côté livreur. */
export type StatutCourse =
    | 'ready'
    | 'out_for_delivery'
    | 'delivering'
    | 'delivered'
    | 'completed';

export interface LigneCommande {
    name?: string;
    quantity?: number;
    price?: number;
    notes?: string;
}

export interface RestaurantCourse {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    lat: number | null;
    lng: number | null;
}

export interface Course {
    id: string;
    customerName: string | null;
    customerPhone: string | null;
    deliveryAddress: string | null;
    customerLat: number | null;
    customerLng: number | null;
    items: LigneCommande[];
    total: number;
    deliveryFee: number;
    status: StatutCourse;
    notes: string | null;
    createdAt: string;
    deliveredAt: string | null;
    /** Repli de datation quand `deliveredAt` manque — voir l'API livreur. */
    updatedAt: string | null;
    restaurant: RestaurantCourse;
    /** Vrai si la remise exige le code dicté par le client. */
    requiresCode: boolean;
}

export interface ProfilLivreur {
    id: string;
    fullName: string | null;
    phone: string | null;
    email: string | null;
    avatarUrl: string | null;
    available: boolean;
}

export interface Gains {
    jour: number;
    semaine: number;
    mois: number;
    coursesJour: number;
    coursesSemaine: number;
    coursesMois: number;
}
