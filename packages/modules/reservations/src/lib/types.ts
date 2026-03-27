export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "no_show"
  | "cancelled";

export type ReservationOccasion =
  | "birthday"
  | "dinner"
  | "surprise"
  | "business"
  | "anniversary"
  | "date"
  | "family"
  | "other";

export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  party_size: number;
  date: string;
  time: string;
  table_id: string | null;
  zone_id: string | null;
  status: ReservationStatus;
  occasion: ReservationOccasion | null;
  special_requests: string | null;
  confirmed_at: string | null;
  seated_at: string | null;
  pre_order_id: string | null;
  deposit_amount: number | null;
  deposit_paid: boolean | null;
  duration: number | null;
  zone_preference: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  restaurant_tables?: RestaurantTable;
  table_zones?: TableZone;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  number: string;
  capacity: number;
  status: string;
  is_active: boolean;
  qr_code: string | null;
  sort_order: number | null;
  zone_id: string | null;
  created_at: string;
  updated_at: string;
  table_zones?: TableZone;
}

export interface TableZone {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  type: string | null;
  is_active: boolean;
  sort_order: number | null;
  image_url: string | null;
  color: string | null;
  capacity: number;
  min_party_size: number;
  amenities: string[];
  pricing_note: string | null;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reserved_until?: string | null;
}

export interface ZoneAvailability {
  zone: TableZone;
  tables: RestaurantTable[];
  total_capacity: number;
  available_tables: number;
  slots: TimeSlot[];
}
