/**
 * Algorithme de scoring crédit — KBouffe Capital
 *
 * Données sources: table `orders` (90 derniers jours)
 * Aucune donnée externe, aucune consultation COBAC.
 * Score = indicateur purement interne fourni à la banque partenaire.
 */

import type { RiskGrade, CapitalScore, ScoreBreakdown } from "./types";

const SCORE_WEIGHTS = {
    revenue: 40,    // 40% — revenu mensuel
    payment: 30,    // 30% — taux de paiement
    frequency: 20,  // 20% — fréquence des commandes
    age: 10,        // 10% — ancienneté du compte
} as const;

/** Montant max estimé = 3x revenu mensuel, plafonné à 10M FCFA */
const MAX_LOAN_CAP = 10_000_000;
const REVENUE_TARGET = 2_000_000; // Score max à 2M FCFA/mois
const ORDERS_TARGET = 90;         // Score max à 90 commandes/mois

export function computeScore(breakdown: ScoreBreakdown): CapitalScore {
    const { monthly_revenue, payment_rate, orders_per_month, account_age_months } = breakdown;

    const revenue_score = Math.min(SCORE_WEIGHTS.revenue, (monthly_revenue / REVENUE_TARGET) * SCORE_WEIGHTS.revenue);
    const payment_score = (payment_rate / 100) * SCORE_WEIGHTS.payment;
    const frequency_score = Math.min(SCORE_WEIGHTS.frequency, (orders_per_month / ORDERS_TARGET) * SCORE_WEIGHTS.frequency);
    const age_score = Math.min(SCORE_WEIGHTS.age, (account_age_months / 12) * SCORE_WEIGHTS.age);

    const score = Math.round(revenue_score + payment_score + frequency_score + age_score);

    const risk_grade: RiskGrade =
        score >= 80 ? "A"
        : score >= 60 ? "B"
        : score >= 40 ? "C"
        : "D";

    const eligible = score >= 40;
    const max_estimated_amount = Math.min(MAX_LOAN_CAP, monthly_revenue * 3);

    return {
        score,
        risk_grade,
        breakdown,
        eligible,
        max_estimated_amount,
        computed_at: new Date().toISOString(),
    };
}

export function riskGradeLabel(grade: RiskGrade): string {
    switch (grade) {
        case "A": return "Excellent — Très faible risque";
        case "B": return "Bon — Risque modéré";
        case "C": return "Acceptable — Risque élevé";
        case "D": return "Insuffisant — Non éligible";
    }
}
