#!/usr/bin/env python3
"""
Health Score Calculator for Kbouffe Restaurants
Calculates 0-100 health scores based on activity, growth, engagement, support, and boost adoption.
"""

import json
import sys
from dataclasses import dataclass
from typing import Optional


@dataclass
class RestaurantMetrics:
    """Input metrics for a restaurant"""
    restaurant_id: str
    restaurant_name: str
    orders_per_week: float
    mom_gmv_change_percent: float
    menu_updates_per_month: int
    csa_response_hours: float
    boost_pack_spending_fcfa: float


@dataclass
class ComponentScore:
    """Individual component score"""
    component: str
    weight: float
    metric_value: float
    score: int
    weighted_score: float


@dataclass
class HealthScore:
    """Final health score with tier classification"""
    restaurant_id: str
    restaurant_name: str
    total_score: int
    tier: str  # 'Healthy', 'At-Risk', 'Churning'
    components: list
    recommendations: list


def score_activity(orders_per_week: float) -> int:
    """Score activity component (25% weight). Orders/week metric."""
    if orders_per_week >= 10:
        return 100
    elif orders_per_week >= 3:
        return 70 - int((10 - orders_per_week) * 5)  # 70-40 range
    else:
        return 30


def score_growth(mom_gmv_change_percent: float) -> int:
    """Score growth component (25% weight). MoM GMV change metric."""
    if mom_gmv_change_percent >= 5:
        return 100
    elif mom_gmv_change_percent >= -5:
        return 70 - int(mom_gmv_change_percent * 5)  # 70-70 = stable
    else:
        return 30


def score_engagement(menu_updates_per_month: int) -> int:
    """Score engagement component (20% weight). Menu updates/month metric."""
    if menu_updates_per_month >= 2:
        return 100
    elif menu_updates_per_month == 1:
        return 50
    else:
        return 20


def score_support(csa_response_hours: float) -> int:
    """Score support component (15% weight). CSA response time in hours."""
    if csa_response_hours <= 24:
        return 100
    elif csa_response_hours <= 48:
        return 60
    else:
        return 30


def score_boost_adoption(boost_pack_spending_fcfa: float) -> int:
    """Score boost adoption component (15% weight). Monthly spending in FCFA."""
    if boost_pack_spending_fcfa >= 200000:
        return 100
    elif boost_pack_spending_fcfa > 0:
        return 50
    else:
        return 20


def calculate_health_score(metrics: RestaurantMetrics) -> HealthScore:
    """Calculate overall health score from metrics."""

    # Calculate component scores
    components = [
        ComponentScore(
            component="Activity",
            weight=0.25,
            metric_value=metrics.orders_per_week,
            score=score_activity(metrics.orders_per_week),
            weighted_score=0
        ),
        ComponentScore(
            component="Growth",
            weight=0.25,
            metric_value=metrics.mom_gmv_change_percent,
            score=score_growth(metrics.mom_gmv_change_percent),
            weighted_score=0
        ),
        ComponentScore(
            component="Engagement",
            weight=0.20,
            metric_value=metrics.menu_updates_per_month,
            score=score_engagement(metrics.menu_updates_per_month),
            weighted_score=0
        ),
        ComponentScore(
            component="Support",
            weight=0.15,
            metric_value=metrics.csa_response_hours,
            score=score_support(metrics.csa_response_hours),
            weighted_score=0
        ),
        ComponentScore(
            component="Boost Adoption",
            weight=0.15,
            metric_value=metrics.boost_pack_spending_fcfa,
            score=score_boost_adoption(metrics.boost_pack_spending_fcfa),
            weighted_score=0
        ),
    ]

    # Calculate weighted scores
    total_score = 0
    for comp in components:
        comp.weighted_score = comp.score * comp.weight
        total_score += comp.weighted_score

    total_score = int(total_score)

    # Determine tier
    if total_score >= 75:
        tier = "Healthy"
    elif total_score >= 40:
        tier = "At-Risk"
    else:
        tier = "Churning"

    # Generate recommendations
    recommendations = generate_recommendations(metrics, tier, components)

    return HealthScore(
        restaurant_id=metrics.restaurant_id,
        restaurant_name=metrics.restaurant_name,
        total_score=total_score,
        tier=tier,
        components=components,
        recommendations=recommendations
    )


def generate_recommendations(
    metrics: RestaurantMetrics,
    tier: str,
    components: list
) -> list:
    """Generate actionable recommendations based on health tier and component scores."""

    recommendations = []

    if tier == "Healthy":
        recommendations.append("🟢 Nurture for expansion: Offer Boost Pack upgrade or premium features")
        if metrics.boost_pack_spending_fcfa == 0:
            recommendations.append("Consider promoting Boost Packs (case studies show 4x ROI)")

    elif tier == "At-Risk":
        recommendations.append("🟡 Proactive outreach required: Schedule CSM check-in this week")
        if metrics.orders_per_week < 5:
            recommendations.append("Activity declining: Send training email + incentive offer")
        if metrics.menu_updates_per_month < 1:
            recommendations.append("No menu updates: Offer menu update training call")
        if metrics.mom_gmv_change_percent < -5:
            recommendations.append("Revenue declining: Share competitive benchmarking + growth levers")

    elif tier == "Churning":
        recommendations.append("🔴 Win-back campaign urgently needed")
        if metrics.orders_per_week == 0:
            recommendations.append("No orders in 2+ weeks: Implement 30% discount + 1-month free Boost Pack offer")
        recommendations.append("CEO/Manager outreach + dedicated support assignment")

    return recommendations


def format_output(health_score: HealthScore) -> dict:
    """Format health score for JSON output."""
    return {
        "restaurant_id": health_score.restaurant_id,
        "restaurant_name": health_score.restaurant_name,
        "total_score": health_score.total_score,
        "tier": health_score.tier,
        "components": [
            {
                "component": c.component,
                "weight": f"{c.weight * 100:.0f}%",
                "metric_value": c.metric_value,
                "score": c.score,
                "weighted_score": f"{c.weighted_score:.1f}",
            }
            for c in health_score.components
        ],
        "recommendations": health_score.recommendations,
    }


def main():
    """CLI entry point for health score calculator."""

    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("""
Health Score Calculator - Kbouffe CS Operations

Usage:
  python3 health_score_calculator.py [--help] [--demo]

  --help     Show this help message
  --demo     Run demo with sample restaurants

Examples:
  # Demo mode with 4 sample restaurants
  python3 health_score_calculator.py --demo

  # Input via stdin (JSON array of restaurants)
  echo '[{"restaurant_id":"rest_001",...}]' | python3 health_score_calculator.py

Input JSON format:
  [
    {
      "restaurant_id": "rest_001",
      "restaurant_name": "Restaurant La Saveur",
      "orders_per_week": 15,
      "mom_gmv_change_percent": 8,
      "menu_updates_per_month": 2,
      "csa_response_hours": 12,
      "boost_pack_spending_fcfa": 250000
    }
  ]

Output: JSON array of health scores with tier and recommendations
        """)
        return

    # Demo mode
    if len(sys.argv) > 1 and sys.argv[1] == "--demo":
        sample_restaurants = [
            RestaurantMetrics(
                restaurant_id="rest_001",
                restaurant_name="Restaurant La Saveur",
                orders_per_week=15,
                mom_gmv_change_percent=8,
                menu_updates_per_month=2,
                csa_response_hours=12,
                boost_pack_spending_fcfa=250000,
            ),
            RestaurantMetrics(
                restaurant_id="rest_002",
                restaurant_name="Chez Auntie Bea",
                orders_per_week=4,
                mom_gmv_change_percent=-2,
                menu_updates_per_month=0,
                csa_response_hours=36,
                boost_pack_spending_fcfa=0,
            ),
            RestaurantMetrics(
                restaurant_id="rest_003",
                restaurant_name="Prestige Bistro",
                orders_per_week=35,
                mom_gmv_change_percent=3,
                menu_updates_per_month=3,
                csa_response_hours=8,
                boost_pack_spending_fcfa=500000,
            ),
            RestaurantMetrics(
                restaurant_id="rest_004",
                restaurant_name="Street Shack (At Risk)",
                orders_per_week=2,
                mom_gmv_change_percent=-8,
                menu_updates_per_month=0,
                csa_response_hours=72,
                boost_pack_spending_fcfa=0,
            ),
        ]

        results = [format_output(calculate_health_score(r)) for r in sample_restaurants]
        print(json.dumps(results, indent=2, ensure_ascii=False))
        return

    # Read from stdin or use demo
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            # No input, run demo
            sys.argv.append("--demo")
            main()
            return

        restaurants_data = json.loads(input_data)

        # Ensure it's a list
        if isinstance(restaurants_data, dict):
            restaurants_data = [restaurants_data]

        results = []
        for restaurant_data in restaurants_data:
            metrics = RestaurantMetrics(**restaurant_data)
            score = calculate_health_score(metrics)
            results.append(format_output(score))

        print(json.dumps(results, indent=2, ensure_ascii=False))

    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input - {e}", file=sys.stderr)
        sys.exit(1)
    except TypeError as e:
        print(f"Error: Missing required fields - {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
