/**
 * POST /api/kyc/verify — Verify a customer/merchant/driver identity via MTN KYC.
 *
 * Accepts a phone number and optional identity fields, returns per-field verification.
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { verifyCustomerKyc, type KycVerificationRequest } from "@/lib/kyc/mtn";
import { createAdminClient } from "@/lib/supabase/server";

interface VerifyPayload {
  phone: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  idNumber?: string;
  idType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const body = (await request.json()) as VerifyPayload;

    if (!body.phone?.trim()) {
      return apiError("Le numero de telephone est requis", 400);
    }

    const kycRequest: KycVerificationRequest = {
      msisdn: body.phone.trim(),
      firstName: body.firstName?.trim(),
      lastName: body.lastName?.trim(),
      dateOfBirth: body.dateOfBirth?.trim(),
      idNumber: body.idNumber?.trim(),
      idType: body.idType?.trim(),
      nationality: "CM",
    };

    const result = await verifyCustomerKyc(kycRequest);

    // Log verification attempt in DB for audit trail
    try {
      const admin = await createAdminClient();
      await admin
        .from("kyc_verifications")
        .insert({
          restaurant_id: ctx.restaurantId,
          user_id: ctx.userId,
          phone: body.phone.trim(),
          status: result.status,
          fields_verified: result.fields,
          provider: "mtn_kyc_v1",
          created_at: new Date().toISOString(),
        } as never);
    } catch (auditErr) {
      // Non-blocking — table might not exist yet
      console.warn("[KYC] Audit log failed:", auditErr);
    }

    return NextResponse.json({
      success: true,
      verification: {
        status: result.status,
        msisdnActive: result.msisdnActive,
        fields: result.fields,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur verification KYC";
    console.error("POST /api/kyc/verify error:", error);
    return apiError(message, 502);
  }
}
