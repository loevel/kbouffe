import { NextRequest, NextResponse } from "next/server";

/**
 * Churn Risk Prediction Model
 * Identifies restaurants at risk of churning based on early warning indicators
 */

type ChurnRiskLevel = "no_risk" | "low" | "medium" | "high" | "critical";

interface ChurnPrediction {
    restaurant_id: string;
    restaurant_name: string;
    risk_level: ChurnRiskLevel;
    risk_score: number; // 0-100
    days_since_last_order: number;
    warning_indicators: string[];
    suggested_action: string;
    urgency: "none" | "routine" | "urgent" | "critical";
}

function calculateChurnRisk(metrics: {
    id: string;
    name: string;
    daysSinceLastOrder: number;
    daysSinceLastMenuUpdate: number;
    orderTrendPercentChange: number;
    supportTicketSentimentNegative: boolean;
    boostPackSpendingTrendNegative: boolean;
}): ChurnPrediction {
    let riskScore = 0;
    const warnings: string[] = [];
    let urgency: "none" | "routine" | "urgent" | "critical" = "none";
    let riskLevel: ChurnRiskLevel = "no_risk";

    // Days since last order (highest weight indicator)
    if (metrics.daysSinceLastOrder >= 30) {
        riskScore += 40;
        warnings.push("No orders for 30+ days - Win-back campaign needed");
        urgency = "critical";
        riskLevel = "critical";
    } else if (metrics.daysSinceLastOrder >= 21) {
        riskScore += 30;
        warnings.push("No orders for 21+ days - Manager outreach + support");
        urgency = "urgent";
        riskLevel = "high";
    } else if (metrics.daysSinceLastOrder >= 14) {
        riskScore += 20;
        warnings.push("No orders for 14 days - CSM phone call recommended");
        urgency = "routine";
        riskLevel = "medium";
    } else if (metrics.daysSinceLastOrder >= 7) {
        riskScore += 10;
        warnings.push("No orders for 7 days - Automated email + incentive");
        urgency = "routine";
        riskLevel = "low";
    }

    // Menu updates (engagement indicator)
    if (metrics.daysSinceLastMenuUpdate >= 30) {
        riskScore += 15;
        warnings.push("Menu not updated in 30+ days - Offer training");
    }

    // Order trend (growth indicator)
    if (metrics.orderTrendPercentChange < -20) {
        riskScore += 15;
        warnings.push("Orders declining >20% - Revenue decline alert");
    } else if (metrics.orderTrendPercentChange < -10) {
        riskScore += 10;
        warnings.push("Orders declining 10-20% - Growth attention needed");
    }

    // Negative support sentiment
    if (metrics.supportTicketSentimentNegative) {
        riskScore += 10;
        warnings.push("Negative support ticket - Dedicated CSM assignment");
    }

    // Boost pack trend
    if (metrics.boostPackSpendingTrendNegative) {
        riskScore += 5;
        warnings.push("Boost pack spending declining - Feature adoption issue");
    }

    // Update risk level if not already set
    if (riskLevel === "no_risk") {
        if (riskScore >= 70) riskLevel = "critical";
        else if (riskScore >= 50) riskLevel = "high";
        else if (riskScore >= 30) riskLevel = "medium";
        else if (riskScore > 0) riskLevel = "low";
    }

    // Suggested action based on risk level
    let suggestedAction = "";
    switch (riskLevel) {
        case "critical":
            suggestedAction = "Execute win-back campaign immediately: 30% discount + 1-month free Boost Pack + CEO outreach";
            break;
        case "high":
            suggestedAction = "Schedule CSM manager call: Understand blockers, offer custom support, discuss growth levers";
            break;
        case "medium":
            suggestedAction = "Send CSM check-in: Share success stories, benchmark vs peers, offer training";
            break;
        case "low":
            suggestedAction = "Monitor closely: Send automated email with help resources + limited-time offer";
            break;
        case "no_risk":
            suggestedAction = "Continue nurturing: Share growth opportunities, Boost Pack upsell";
            break;
    }

    return {
        restaurant_id: metrics.id,
        restaurant_name: metrics.name,
        risk_level: riskLevel,
        risk_score: Math.min(100, riskScore),
        days_since_last_order: metrics.daysSinceLastOrder,
        warning_indicators: warnings,
        suggested_action: suggestedAction,
        urgency,
    };
}

export async function GET(request: NextRequest) {
    try {
        // Mock data - in production, fetch from actual restaurant activity data
        const mockRestaurants = [
            {
                id: "rest_001",
                name: "Restaurant La Saveur",
                daysSinceLastOrder: 1,
                daysSinceLastMenuUpdate: 3,
                orderTrendPercentChange: 15,
                supportTicketSentimentNegative: false,
                boostPackSpendingTrendNegative: false,
            },
            {
                id: "rest_002",
                name: "Chez Auntie Bea",
                daysSinceLastOrder: 8,
                daysSinceLastMenuUpdate: 45,
                orderTrendPercentChange: -15,
                supportTicketSentimentNegative: false,
                boostPackSpendingTrendNegative: true,
            },
            {
                id: "rest_003",
                name: "Prestige Bistro",
                daysSinceLastOrder: 2,
                daysSinceLastMenuUpdate: 5,
                orderTrendPercentChange: 3,
                supportTicketSentimentNegative: false,
                boostPackSpendingTrendNegative: false,
            },
            {
                id: "rest_004",
                name: "Street Shack",
                daysSinceLastOrder: 28,
                daysSinceLastMenuUpdate: 60,
                orderTrendPercentChange: -45,
                supportTicketSentimentNegative: true,
                boostPackSpendingTrendNegative: true,
            },
        ];

        const predictions = mockRestaurants.map(calculateChurnRisk);

        return NextResponse.json(predictions, {
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });
    } catch (error) {
        console.error("Churn prediction error:", error);
        return NextResponse.json(
            { error: "Failed to calculate churn predictions" },
            { status: 500 }
        );
    }
}
