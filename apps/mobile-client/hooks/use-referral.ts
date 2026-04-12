/**
 * Referral hook — extracted from loyalty-context.
 * Manages the referral code and referral reward tracking.
 */
import { useLoyalty } from '@/contexts/loyalty-context';

export function useReferral() {
    const { referralCode, referralInvites, referralRewards, registerReferralReward } = useLoyalty();

    return { referralCode, referralInvites, referralRewards, registerReferralReward };
}
