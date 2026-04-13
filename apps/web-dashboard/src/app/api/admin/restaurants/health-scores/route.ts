import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase configuration");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Health Score Calculator
 * Calculates 0-100 health score based on multiple components
 */
function scoreActivity(ordersPerWeek: number): number {
    if (ordersPerWeek >= 10) return 100;
    if (ordersPerWeek >= 3) return 70 - (10 - ordersPerWeek) * 5;
    return 30;
}

function scoreGrowth(momGmvChangePercent: number): number {
    if (momGmvChangePercent >= 5) return 100;
    if (momGmvChangePercent >= -5) return 70 - momGmvChangePercent * 5;
    return 30;
}

function scoreEngagement(menuUpdatesPerMonth: number): number {
    if (menuUpdatesPerMonth >= 2) return 100;
    if (menuUpdatesPerMonth === 1) return 50;
    return 20;
}

function scoreSupport(csaResponseHours: number): number {
    if (csaResponseHours <= 24) return 100;
    if (csaResponseHours <= 48) return 60;
    return 30;
}

function scoreBoostAdoption(boostPackSpendingFcfa: number): number {
    if (boostPackSpendingFcfa >= 200000) return 100;
    if (boostPackSpendingFcfa > 0) return 50;
    return 20;
}

function calculateHealthScore(metrics: {
    id: string;
    name: string;
    ordersPerWeek: number;
    momGmvChangePercent: number;
    menuUpdatesPerMonth: number;
    csaResponseHours: number;
    boostPackSpendingFcfa: number;
}) {
    const components = [
        {
            component: "Activity",
            weight: 0.25,
            score: scoreActivity(metrics.ordersPerWeek),
        },
        {
            component: "Growth",
            weight: 0.25,
            score: scoreGrowth(metrics.momGmvChangePercent),
        },
        {
            component: "Engagement",
            weight: 0.2,
            score: scoreEngagement(metrics.menuUpdatesPerMonth),
        },
        {
            component: "Support",
            weight: 0.15,
            score: scoreSupport(metrics.csaResponseHours),
        },
        {
            component: "Boost Adoption",
            weight: 0.15,
            score: scoreBoostAdoption(metrics.boostPackSpendingFcfa),
        },
    ];

    const totalScore = Math.round(
        components.reduce((sum, c) => sum + c.score * c.weight, 0)
    );

    let tier: "Healthy" | "At-Risk" | "Churning";
    if (totalScore >= 75) tier = "Healthy";
    else if (totalScore >= 40) tier = "At-Risk";
    else tier = "Churning";

    const recommendations: string[] = [];
    if (tier === "Healthy") {
        recommendations.push("🟢 Nurture for expansion: Offer Boost Pack upgrade or premium features");
        if (metrics.boostPackSpendingFcfa === 0) {
            recommendations.push("Consider promoting Boost Packs (case studies show 4x ROI)");
        }
    } else if (tier === "At-Risk") {
        recommendations.push("🟡 Proactive outreach required: Schedule CSM check-in this week");
        if (metrics.ordersPerWeek < 5) {
            recommendations.push("Activity declining: Send training email + incentive offer");
        }
        if (metrics.menuUpdatesPerMonth < 1) {
            recommendations.push("No menu updates: Offer menu update training call");
        }
        if (metrics.momGmvChangePercent < -5) {
            recommendations.push("Revenue declining: Share competitive benchmarking + growth levers");
        }
    } else if (tier === "Churning") {
        recommendations.push("🔴 Win-back campaign urgently needed");
        if (metrics.ordersPerWeek === 0) {
            recommendations.push("No orders in 2+ weeks: Implement 30% discount + 1-month free Boost Pack offer");
        }
        recommendations.push("CEO/Manager outreach + dedicated support assignment");
    }

    return {
        restaurant_id: metrics.id,
        restaurant_name: metrics.name,
        total_score: totalScore,
        tier,
        components: components.map(c => ({
            component: c.component,
            weight: `${Math.round(c.weight * 100)}%`,
            score: c.score,
            weighted_score: (c.score * c.weight).toFixed(1),
        })),
        recommendations,
    };
}

export async function GET(request: NextRequest) {
    try {
        // TODO: Fetch real restaurant data from Supabase
        // For now, returning mock data
        // In production, query restaurant activity metrics and calculate scores

        const mockRestaurants = [
            {
                id: "rest_001",
                name: "Restaurant La Saveur",
                ordersPerWeek: 15,
                momGmvChangePercent: 8,
                menuUpdatesPerMonth: 2,
                csaResponseHours: 12,
                boostPackSpendingFcfa: 250000,
            },
            {
                id: "rest_002",
                name: "Chez Auntie Bea",
                ordersPerWeek: 4,
                momGmvChangePercent: -2,
                menuUpdatesPerMonth: 0,
                csaResponseHours: 36,
                boostPackSpendingFcfa: 0,
            },
            {
                id: "rest_003",
                name: "Prestige Bistro",
                ordersPerWeek: 35,
                momGmvChangePercent: 3,
                menuUpdatesPerMonth: 3,
                csaResponseHours: 8,
                boostPackSpendingFcfa: 500000,
            },
        ];

        const healthScores = mockRestaurants.map(calculateHealthScore);

        return NextResponse.json(healthScores, {
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });
    } catch (error) {
        console.error("Health score calculation error:", error);
        return NextResponse.json(
            { error: "Failed to calculate health scores" },
            { status: 500 }
        );
    }
}
