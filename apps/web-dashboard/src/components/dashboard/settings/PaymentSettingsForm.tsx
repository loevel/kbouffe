"use client";

import { useState, useEffect } from "react";
import { Save, Smartphone, Banknote, Building2 } from "lucide-react";
import { Card, Button, Input, Toggle } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import type { Json } from "@/lib/supabase/types";

export function PaymentSettingsForm() {
    const { t } = useLocale();
    const { restaurant, updateRestaurant } = useDashboard();
    const [loading, setLoading] = useState(false);

    const [methods, setMethods] = useState({
        mobileMoney: true,
        cashOnDelivery: true,
        bankTransfer: false,
    });

    const [credentials, setCredentials] = useState({
        orangeMoneyNumber: "",
        mtnMomoNumber: "",
    });

    useEffect(() => {
        if (!restaurant) return;
        
        if ((restaurant as any).payment_methods) {
            const pm = (restaurant as any).payment_methods;
            setMethods({
                mobileMoney: !!pm.mobileMoney,
                cashOnDelivery: !!pm.cashOnDelivery,
                bankTransfer: !!pm.bankTransfer,
            });
        }
        
        if ((restaurant as any).payment_credentials) {
            const pc = (restaurant as any).payment_credentials;
            setCredentials({
                orangeMoneyNumber: pc.orangeMoneyNumber || "",
                mtnMomoNumber: pc.mtnMomoNumber || "",
            });
        }
    }, [restaurant]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: any = {
            payment_methods: methods,
            payment_credentials: credentials,
        };
        const { error } = await updateRestaurant(payload);

        if (error) {
            toast.error(`${t.settings.errorPrefix}${error}`);
        } else {
            toast.success(t.settings.paymentsUpdated);
        }
        
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-6">
                    {t.settings.paymentMethods}
                </h3>

                <div className="space-y-4">
                    {/* Mobile Money */}
                    <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Smartphone size={20} className="text-orange-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">
                                        {t.settings.mobileMoney}
                                    </p>
                                    <p className="text-sm text-surface-500">
                                        {t.settings.mobileMoneyDesc}
                                    </p>
                                </div>
                            </div>
                            <Toggle
                                checked={methods.mobileMoney}
                                onChange={(val) => setMethods(prev => ({ ...prev, mobileMoney: val }))}
                            />
                        </div>

                        {methods.mobileMoney && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                                <Input
                                    label={t.settings.momoNumber}
                                    placeholder="6XX XXX XXX"
                                    value={credentials.orangeMoneyNumber}
                                    onChange={(e) => setCredentials(prev => ({
                                        ...prev,
                                        orangeMoneyNumber: e.target.value,
                                    }))}
                                />
                                <Input
                                    label={t.settings.mtnNumber}
                                    placeholder="6XX XXX XXX"
                                    value={credentials.mtnMomoNumber}
                                    onChange={(e) => setCredentials(prev => ({
                                        ...prev,
                                        mtnMomoNumber: e.target.value,
                                    }))}
                                />
                            </div>
                        )}
                    </div>

                    {/* Cash on Delivery */}
                    <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <Banknote size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">
                                        {t.settings.cashOnDelivery}
                                    </p>
                                    <p className="text-sm text-surface-500">
                                        {t.settings.cashOnDeliveryDesc}
                                    </p>
                                </div>
                            </div>
                            <Toggle
                                checked={methods.cashOnDelivery}
                                onChange={(val) => setMethods(prev => ({ ...prev, cashOnDelivery: val }))}
                            />
                        </div>
                    </div>

                    {/* Bank Transfer */}
                    <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Building2 size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">
                                        {t.settings.bankTransfer}
                                    </p>
                                    <p className="text-sm text-surface-500">
                                        {t.settings.bankTransferDesc}
                                    </p>
                                </div>
                            </div>
                            <Toggle
                                checked={methods.bankTransfer}
                                onChange={(val) => setMethods(prev => ({ ...prev, bankTransfer: val }))}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" leftIcon={<Save size={18} />} isLoading={loading}>
                    {t.common.save}
                </Button>
            </div>
        </form>
    );
}
