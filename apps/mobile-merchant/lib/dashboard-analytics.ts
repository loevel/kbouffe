export type DashboardPeriod = '1d' | '7d' | '30d' | '90d';

export interface DashboardPeriodOption {
    id: DashboardPeriod;
    label: string;
}

export interface RevenuePoint {
    label: string;
    value: number;
    date?: string;
}

export interface CountBreakdown {
    key: string;
    label: string;
    count: number;
    percentage: number;
}

export interface RevenueBreakdown {
    key: string;
    label: string;
    count: number;
    revenue: number;
    percentage: number;
}

export interface DashboardStatsResponse {
    stats: {
        revenue: {
            today: number;
            week: number;
            month: number;
        };
        orders: {
            today: number;
            pending: number;
            active?: number;
            completed?: number;
            cancelled?: number;
            total: number;
        };
        averageOrderValue: number;
        totalCustomers: number;
        completionRate?: number;
        cancellationRate?: number;
    };
    revenueChart: RevenuePoint[];
    statusBreakdown?: CountBreakdown[];
    deliveryBreakdown?: RevenueBreakdown[];
}

export interface ReportTimeSeriesPoint {
    date: string;
    label: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
    cancelled: number;
}

export interface ReportTopProduct {
    name: string;
    quantity: number;
    revenue: number;
    avgUnitPrice: number;
}

export interface ReportPeakHour {
    hour: number;
    label: string;
    orders: number;
    revenue: number;
}

export interface DashboardReportsResponse {
    period: DashboardPeriod | string;
    generatedAt: string;
    summary: {
        revenue: number;
        ordersTotal: number;
        ordersCompleted: number;
        ordersActive: number;
        ordersCancelled: number;
        averageOrderValue: number;
        completionRate: number;
        cancellationRate: number;
        uniqueCustomers: number;
    };
    timeSeries: ReportTimeSeriesPoint[];
    statusBreakdown: CountBreakdown[];
    deliveryBreakdown: RevenueBreakdown[];
    paymentBreakdown: RevenueBreakdown[];
    topProducts: ReportTopProduct[];
    peakHours: ReportPeakHour[];
}

export const PERIOD_OPTIONS: DashboardPeriodOption[] = [
    { id: '1d', label: "Aujourd'hui" },
    { id: '7d', label: '7j' },
    { id: '30d', label: '30j' },
    { id: '90d', label: '90j' },
];

export function toDashboardPeriod(value: string | undefined): DashboardPeriod {
    if (value === '1d' || value === '7d' || value === '30d' || value === '90d') return value;
    return '30d';
}

export function toApiPeriod(period: DashboardPeriod): string {
    return period === '90d' ? '3m' : period;
}

export function formatFcfa(value: number): string {
    return `${Math.round(value || 0).toLocaleString('fr-FR')} FCFA`;
}

export function formatPercent(value: number): string {
    return `${Math.round(value || 0)}%`;
}

