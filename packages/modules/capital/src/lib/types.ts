/**
 * Types — KBouffe Capital (Broker/Scoring)
 *
 * Légal: KBouffe est un "Apporteur d'Affaires" et "Fournisseur de Data".
 * Il NE prête PAS d'argent (illégal sans agrément COBAC/BEAC).
 * La banque paie une "commission technologique" pour chaque prêt accordé.
 */

export type RiskGrade = "A" | "B" | "C" | "D";
export type ApplicationStatus = "draft" | "submitted" | "reviewing" | "approved" | "rejected";

export interface ScoreBreakdown {
    monthly_revenue: number;       // Revenu mensuel moyen (FCFA, 90 jours)
    payment_rate: number;          // % de commandes payées (0-100)
    orders_per_month: number;      // Nombre moyen de commandes/mois
    account_age_months: number;    // Ancienneté du compte (mois)
}

export interface CapitalScore {
    score: number;                 // Score global 0-100
    risk_grade: RiskGrade;         // A/B/C/D
    breakdown: ScoreBreakdown;
    eligible: boolean;             // Score >= 40
    max_estimated_amount: number;  // Montant indicatif (3x revenu mensuel, max 10M FCFA)
    computed_at: string;           // ISO timestamp
}

export interface CapitalApplication {
    id: string;
    restaurant_id: string;
    score: number;
    risk_grade: RiskGrade;
    score_breakdown: ScoreBreakdown;
    requested_amount: number;
    bank_partner: string;
    status: ApplicationStatus;
    bank_reference: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    reviewer_id: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateApplicationRequest {
    requested_amount: number;
    bank_partner: string;
}

export interface UpdateApplicationRequest {
    status: ApplicationStatus;
    bank_reference?: string;
    notes?: string;
}

export const BANK_PARTNERS = [
    "Advans Cameroun",
    "Express Union",
    "BICEC",
    "SCB Cameroun",
    "Afriland First Bank",
] as const;

export type BankPartner = typeof BANK_PARTNERS[number];
