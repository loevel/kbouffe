export const Constants = {
    public: {
        Enums: {
            delivery_type: ["delivery", "pickup", "dine_in"],
            order_status: [
                "pending",
                "accepted",
                "preparing",
                "ready",
                "completed",
                "cancelled",
            ],
            payment_method: ["mobile_money_mtn", "mobile_money_orange", "cash"],
            payment_status: ["pending", "paid", "failed", "refunded"],
            payout_status: ["pending", "paid", "failed"],
            user_role: ["merchant", "customer", "admin", "support"],
        },
    },
};
