export interface MarketplacePack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: 'visibility' | 'advertising' | 'boost_menu' | 'sms_blast' | 'premium_analytics' | 'priority_support' | 'featured_banner' | 'extra_storage';
  price: number;
  duration_days: number;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  features: Array<{ key: string; label: string; value: string | number | boolean }>;
  limits: Record<string, number | string>;
  badge_color: string | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantPackSubscription {
  id: string;
  restaurant_id: string;
  pack_id: string;
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled' | 'refunded';
  price_paid: number;
  currency: string;
  starts_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  payment_transaction_id: string | null;
  activated_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceInitiatePurchaseRequest {
  pack_id: string;
  payer_msisdn: string;
}

export interface MarketplaceInitiatePurchaseResponse {
  subscription_id: string;
  transaction_id: string;
  reference_id: string;
  amount: number;
  currency: string;
}

export interface MarketplaceWebhookPayload {
  reference_id: string;
  external_id?: string;
  status: 'paid' | 'failed';
  timestamp: number;
}

// ============================================================
// Centrale d'Achat B2B — Types Fournisseurs Agricoles
// KBouffe = hébergeur/annuaire (Art.18 Loi 2015/018)
// Facturation directe fournisseur → restaurant
// KBouffe perçoit uniquement des frais de plateforme
// ============================================================

export type SupplierType = 'individual_farmer' | 'cooperative' | 'wholesaler';
export type SupplierKycStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type SupplierListingTier = 'free' | 'basic' | 'premium';
export type SupplierProductCategory =
  | 'legumes' | 'fruits' | 'cereales' | 'viande' | 'poisson'
  | 'produits_laitiers' | 'epices' | 'huiles' | 'condiments' | 'autres';
export type SupplierProductUnit =
  | 'kg' | 'tonne' | 'litre' | 'caisse' | 'colis' | 'sac' | 'botte' | 'piece';
export type SupplierDeliveryStatus =
  | 'pending' | 'confirmed' | 'delivered' | 'disputed' | 'cancelled';

export const CAMEROON_REGIONS = [
  'Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral',
  'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest',
] as const;

export type CameroonRegion = typeof CAMEROON_REGIONS[number];

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  contact_name: string;
  phone: string;
  email: string | null;
  description: string | null;
  logo_url: string | null;
  region: CameroonRegion;
  locality: string;
  address: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  identity_doc_url: string | null;
  rccm: string | null;
  nif: string | null;
  minader_cert_url: string | null;
  cooperative_number: string | null;
  phytosanitary_declaration: string | null;
  last_inspection_date: string | null;
  kyc_status: SupplierKycStatus;
  kyc_verified_at: string | null;
  kyc_verified_by: string | null;
  kyc_rejection_reason: string | null;
  listing_tier: SupplierListingTier;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  // Computed / joined
  products?: SupplierProduct[];
  product_count?: number;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  name: string;
  category: SupplierProductCategory;
  description: string | null;
  photos: string[];
  price_per_unit: number; // FCFA entier, TVA-exonéré (CGI Art.131)
  unit: SupplierProductUnit;
  min_order_quantity: number;
  available_quantity: number | null;
  origin_region: string | null;
  harvest_date: string | null;
  lot_number: string | null;
  allergens: string[];
  is_organic: boolean;
  is_certified_minader: boolean;
  phytosanitary_note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  supplier?: Pick<Supplier, 'id' | 'name' | 'type' | 'region' | 'kyc_status' | 'is_active'>;
}

export interface SupplierOrderTrace {
  id: string;
  supplier_id: string;
  product_id: string;
  restaurant_id: string;
  quantity: number;
  unit: SupplierProductUnit;
  unit_price: number;
  total_price: number;
  lot_number: string | null;
  harvest_date: string | null;
  platform_fee: number;      // Frais KBouffe HT
  platform_fee_tva: number;  // TVA 19.25% sur frais KBouffe uniquement
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  delivery_status: SupplierDeliveryStatus;
  dispute_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  supplier?: Pick<Supplier, 'id' | 'name' | 'phone'>;
  product?: Pick<SupplierProduct, 'id' | 'name' | 'category' | 'unit'>;
}

export interface RegisterSupplierRequest {
  name: string;
  type: SupplierType;
  contact_name: string;
  phone: string;
  email?: string;
  description?: string;
  region: CameroonRegion;
  locality: string;
  address?: string;
  identity_doc_url?: string;
  rccm?: string;
  nif?: string;
  minader_cert_url?: string;
  cooperative_number?: string;
  phytosanitary_declaration?: string;
}

export interface CreateSupplierProductRequest {
  name: string;
  category: SupplierProductCategory;
  description?: string;
  price_per_unit: number;
  unit: SupplierProductUnit;
  min_order_quantity?: number;
  available_quantity?: number;
  origin_region?: string;
  harvest_date?: string;
  allergens?: string[];
  is_organic?: boolean;
  phytosanitary_note?: string;
}

export interface CreateTraceRequest {
  supplier_id: string;
  product_id: string;
  restaurant_id: string;
  quantity: number;
  unit: SupplierProductUnit;
  unit_price: number;
  lot_number?: string;
  harvest_date?: string;
  expected_delivery_date?: string;
  notes?: string;
}

export interface SupplierFilters {
  region?: CameroonRegion;
  category?: SupplierProductCategory;
  type?: SupplierType;
  page?: number;
}
