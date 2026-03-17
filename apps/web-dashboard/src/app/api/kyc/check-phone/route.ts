/**
 * GET /api/kyc/check-phone — Quick check if a phone is active on MTN.
 *
 * Used during registration/onboarding to validate the phone number.
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { checkMsisdnActive } from "@/lib/kyc/mtn";

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;

    const phone = request.nextUrl.searchParams.get("phone");

    if (!phone?.trim()) {
      return apiError("Le parametre phone est requis", 400);
    }

    const result = await checkMsisdnActive(phone.trim());

    return NextResponse.json({
      success: true,
      phone: phone.trim(),
      active: result.active,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur verification telephone";
    console.error("GET /api/kyc/check-phone error:", error);
    return apiError(message, 502);
  }
}
