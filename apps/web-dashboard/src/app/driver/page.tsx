import { createClient } from "@/lib/supabase/server";
import { DriverActiveOrders } from "@/components/driver/DriverActiveOrders";

export default async function DriverPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const fullName = user?.user_metadata?.full_name ?? user?.email ?? "Livreur";

    return (
        <div className="max-w-lg mx-auto px-4">
            {/* Header */}
            <div className="pt-8 pb-6">
                <p className="text-sm text-surface-500 dark:text-surface-400">Bonjour,</p>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white mt-0.5">
                    {fullName}
                </h1>
            </div>

            {/* Livraisons actives */}
            <DriverActiveOrders />
        </div>
    );
}
