export type SupplierType = 'individual_farmer' | 'cooperative' | 'wholesaler';
export type SupplierKycStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type SupplierProductCategory =
    | 'legumes'
    | 'fruits'
    | 'cereales'
    | 'viande'
    | 'poisson'
    | 'produits_laitiers'
    | 'epices'
    | 'huiles'
    | 'condiments'
    | 'autres';
export type SupplierProductUnit =
    | 'kg'
    | 'tonne'
    | 'litre'
    | 'caisse'
    | 'colis'
    | 'sac'
    | 'botte'
    | 'piece';
export type SupplierDeliveryStatus =
    | 'pending'
    | 'confirmed'
    | 'delivered'
    | 'disputed'
    | 'cancelled';
export type MessageStatus = 'unread' | 'read' | 'replied' | 'archived';
export type MessageType = 'rfq' | 'inquiry' | 'order_note' | 'complaint';

export const CAMEROON_REGIONS = [
    'Adamaoua',
    'Centre',
    'Est',
    'Extrême-Nord',
    'Littoral',
    'Nord',
    'Nord-Ouest',
    'Ouest',
    'Sud',
    'Sud-Ouest',
] as const;

export interface SupplierProduct {
    id: string;
    supplier_id: string;
    name: string;
    category: SupplierProductCategory;
    description: string | null;
    photos: string[];
    price_per_unit: number;
    unit: SupplierProductUnit;
    min_order_quantity: number;
    available_quantity: number | null;
    origin_region: string | null;
    harvest_date: string | null;
    allergens: string[];
    is_organic: boolean;
    is_active: boolean;
    phytosanitary_note: string | null;
    created_at: string;
    updated_at: string;
}

export interface SupplierProfile {
    id: string;
    user_id: string;
    name: string;
    type: SupplierType;
    contact_name: string;
    phone: string;
    email: string | null;
    description: string | null;
    logo_url: string | null;
    cover_url?: string | null;
    region: (typeof CAMEROON_REGIONS)[number];
    locality: string;
    address: string | null;
    identity_doc_url: string | null;
    rccm: string | null;
    nif: string | null;
    minader_cert_url: string | null;
    cooperative_number: string | null;
    phytosanitary_declaration: string | null;
    kyc_status: SupplierKycStatus;
    kyc_rejection_reason: string | null;
    is_active: boolean;
    supplier_products?: SupplierProduct[];
}

export interface SupplierOrder {
    id: string;
    supplier_id: string;
    product_id: string;
    restaurant_id: string;
    quantity: number;
    unit: SupplierProductUnit;
    unit_price: number;
    total_price: number;
    expected_delivery_date: string | null;
    actual_delivery_date: string | null;
    delivery_status: SupplierDeliveryStatus;
    notes: string | null;
    created_at: string;
    updated_at?: string;
    supplier_products?: {
        name: string;
        unit: SupplierProductUnit;
        category: SupplierProductCategory;
    } | null;
}

export interface SupplierMessage {
    id: string;
    restaurant_id: string;
    supplier_id: string;
    product_id: string | null;
    message_type: MessageType;
    subject: string | null;
    body: string;
    quantity: number | null;
    unit: string | null;
    requested_date: string | null;
    status: MessageStatus;
    reply_body: string | null;
    replied_at: string | null;
    created_at: string;
    restaurants?: {
        id: string;
        name: string;
        city: string | null;
        logo_url: string | null;
    } | null;
}
