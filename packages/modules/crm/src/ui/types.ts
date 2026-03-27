export interface DashboardCustomer {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: string;
    createdAt?: string;
}
