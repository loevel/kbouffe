"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    ChefHat,
    Store,
    MapPin,
    Clock,
    ArrowRight,
    ArrowLeft,
    Check,
    Loader2,
    Phone,
    Globe,
    UtensilsCrossed,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";
import { useLocale } from "@/contexts/locale-context";

const CUISINE_TYPES = [
    { value: "african", labelKey: "cuisineAfrican" },
    { value: "cameroonian", labelKey: "cuisineCameroonian" },
    { value: "fast_food", labelKey: "cuisineFastFood" },
    { value: "grillades", labelKey: "cuisineGrillades" },
    { value: "patisserie", labelKey: "cuisinePatisserie" },
    { value: "boulangerie", labelKey: "cuisineBoulangerie" },
    { value: "boissons", labelKey: "cuisineBoissons" },
    { value: "international", labelKey: "cuisineInternational" },
    { value: "other", labelKey: "cuisineOther" },
] as const;

const CAMEROON_CITIES = [
    "Douala",
    "Yaoundé",
    "Bamenda",
    "Bafoussam",
    "Garoua",
    "Maroua",
    "Ngaoundéré",
    "Bertoua",
    "Limbe",
    "Buéa",
    "Kribi",
    "Ebolowa",
];

const DEFAULT_HOURS = {
    monday: { open: "08:00", close: "22:00", isOpen: true },
    tuesday: { open: "08:00", close: "22:00", isOpen: true },
    wednesday: { open: "08:00", close: "22:00", isOpen: true },
    thursday: { open: "08:00", close: "22:00", isOpen: true },
    friday: { open: "08:00", close: "22:00", isOpen: true },
    saturday: { open: "08:00", close: "22:00", isOpen: true },
    sunday: { open: "08:00", close: "22:00", isOpen: false },
};

type DayKey = keyof typeof DEFAULT_HOURS;

const STEPS = ["info", "location", "hours", "plan", "legal", "payment", "review"] as const;

interface OnboardingForm {
    restaurantName: string;
    phone: string;
    description: string;
    cuisineType: string;
    address: string;
    city: string;
    socialLink: string;
    openingHours: typeof DEFAULT_HOURS;
    saasPlanId: string;
    paymentProvider: string;
    paymentMomoNumber?: string;
    paymentMomoName?: string;
    cguAccepted: boolean;
    healthAccepted: boolean;
}

export default function OnboardingPage() {
    const router = useRouter();
    const { t } = useLocale();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<OnboardingForm>({
        restaurantName: "",
        phone: "",
        description: "",
        cuisineType: "african",
        address: "",
        city: "Douala",
        socialLink: "",
        openingHours: DEFAULT_HOURS,
        saasPlanId: "starter",
        paymentProvider: "",
        paymentMomoNumber: "",
        paymentMomoName: "",
        cguAccepted: false,
        healthAccepted: false,
    });

    // Load user metadata from session to pre-fill the form
    useEffect(() => {
        async function loadUserData() {
            try {
                const supabase = createClient();
                if (!supabase) return;

                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user?.user_metadata) {
                    const meta = session.user.user_metadata;
                    setForm(prev => ({
                        ...prev,
                        restaurantName: meta.restaurant_name || "",
                        phone: meta.phone || "",
                    }));
                }
            } catch (err) {
                console.error("Error loading onboarding data:", err);
            } finally {
                setInitializing(false);
            }
        }
        loadUserData();
    }, []);

    // KYC verification state
    const [kycStatus, setKycStatus] = useState<"idle" | "checking" | "active" | "inactive" | "error">("idle");
    const [kycVerifiedPhone, setKycVerifiedPhone] = useState<string | null>(null);

    const verifyPhone = useCallback(async () => {
        const phone = form.phone.trim();
        if (!phone) return;

        setKycStatus("checking");
        try {
            const res = await fetch(`/api/kyc/check-phone?phone=${encodeURIComponent(phone)}`);
            if (!res.ok) {
                setKycStatus("error");
                return;
            }
            const data = await res.json();
            setKycStatus(data.active ? "active" : "inactive");
            setKycVerifiedPhone(phone);
        } catch {
            setKycStatus("error");
        }
    }, [form.phone]);

    function updateField<K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError(null);
    }

    function updateHours(day: DayKey, field: "open" | "close" | "isOpen", value: string | boolean) {
        setForm((prev) => ({
            ...prev,
            openingHours: {
                ...prev.openingHours,
                [day]: { ...prev.openingHours[day], [field]: value },
            },
        }));
    }

    function validateStep(): boolean {
        switch (STEPS[step]) {
            case "info":
                if (!form.restaurantName.trim()) {
                    setError(t.onboarding.nameRequired);
                    return false;
                }
                if (!form.phone.trim()) {
                    setError(t.onboarding.phoneRequired);
                    return false;
                }
                return true;
            case "location":
                if (!form.address.trim()) {
                    setError(t.onboarding.addressRequired);
                    return false;
                }
                return true;
            case "hours":
                return true;
            case "plan":
                return !!form.saasPlanId;
            case "legal":
                if (!form.cguAccepted) {
                    setError(t.onboarding.legalRequired);
                    return false;
                }
                if (!form.healthAccepted) {
                    setError(t.onboarding.legalRequired); // Or a specific health error if we add one
                    return false;
                }
                return true;
            case "payment":
                if (!form.paymentProvider) {
                    setError(t.onboarding.paymentRequired);
                    return false;
                }
                if (form.paymentProvider === "mobile_money") {
                    if (!form.paymentMomoNumber || !form.paymentMomoName) {
                        setError(t.onboarding.paymentRequired);
                        return false;
                    }
                }
                return true;
            case "review":
                return true;
            default:
                return true;
        }
    }

    function nextStep() {
        if (!validateStep()) return;
        if (step < STEPS.length - 1) setStep(step + 1);
    }

    function prevStep() {
        if (step > 0) setStep(step - 1);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/register-restaurant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    restaurantName: form.restaurantName,
                    phone: form.phone,
                    address: form.address,
                    city: form.city,
                    cuisineType: form.cuisineType,
                    description: form.description,
                    socialLink: form.socialLink,
                    openingHours: form.openingHours,
                    saasPlanId: form.saasPlanId,
                    paymentProvider: form.paymentProvider,
                    paymentMomoNumber: form.paymentMomoNumber,
                    paymentMomoName: form.paymentMomoName,
                    isPremium: form.saasPlanId !== "starter",
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || t.onboarding.errorGeneric);
                return;
            }

            router.push("/dashboard");
        } catch {
            setError(t.onboarding.errorGeneric);
        } finally {
            setLoading(false);
        }
    }

    const stepIcons = [
        <Store key="store" size={20} />,
        <MapPin key="map" size={20} />,
        <Clock key="clock" size={20} />,
        <ChefHat key="plan" size={20} />,
        <ShieldCheck key="legal" size={20} />,
        <Globe key="payment" size={20} />,
        <Check key="check" size={20} />,
    ];

    const stepLabels = [
        t.onboarding.stepInfo,
        t.onboarding.stepLocation,
        t.onboarding.stepHours,
        t.onboarding.stepPlan,
        t.onboarding.stepLegal,
        t.onboarding.stepPayment,
        t.onboarding.stepReview,
    ];

    const dayLabels: Record<DayKey, string> = {
        monday: t.onboarding.monday,
        tuesday: t.onboarding.tuesday,
        wednesday: t.onboarding.wednesday,
        thursday: t.onboarding.thursday,
        friday: t.onboarding.friday,
        saturday: t.onboarding.saturday,
        sunday: t.onboarding.sunday,
    };

    if (initializing) {
        return (
            <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                            <ChefHat className="w-8 h-8 text-brand-500 animate-bounce" />
                        </div>
                        <Loader2 className="absolute -bottom-1 -right-1 w-6 h-6 text-brand-500 animate-spin" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                            Préparation de votre espace
                        </h2>
                        <p className="text-surface-500 dark:text-surface-400 text-sm">
                            Veuillez patienter un instant...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
            {/* Header */}
            <header className="border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 py-4 px-6">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <div className="bg-brand-500 text-white p-2 rounded-xl">
                        <ChefHat size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-surface-900 dark:text-white">
                        Kbouffe
                    </span>
                </div>
            </header>

            <main className="flex-1 flex items-start justify-center pt-8 pb-16 px-4">
                <div className="w-full max-w-2xl">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
                            {t.onboarding.title}
                        </h1>
                        <p className="text-surface-500 dark:text-surface-400">
                            {t.onboarding.subtitle}
                        </p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
                        {STEPS.map((_, i) => (
                            <div key={i} className="flex items-center">
                                <button
                                    type="button"
                                    onClick={() => i < step && setStep(i)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                        i === step
                                            ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                                            : i < step
                                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-pointer"
                                              : "bg-surface-100 dark:bg-surface-800 text-surface-400"
                                    }`}
                                    disabled={i > step}
                                >
                                    {i < step ? <Check size={16} /> : stepIcons[i]}
                                    <span className="hidden sm:inline">{stepLabels[i]}</span>
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div
                                        className={`w-8 h-0.5 mx-1 ${
                                            i < step ? "bg-green-400" : "bg-surface-200 dark:bg-surface-700"
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Form card */}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 md:p-8 shadow-sm">
                            {error && (
                                <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Step 1: Restaurant Info */}
                            {STEPS[step] === "info" && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {t.onboarding.restaurantName} *
                                        </label>
                                        <div className="relative">
                                            <Store size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                            <input
                                                type="text"
                                                value={form.restaurantName}
                                                onChange={(e) => updateField("restaurantName", e.target.value)}
                                                placeholder={t.onboarding.restaurantNamePlaceholder}
                                                required
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {t.onboarding.phone} *
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                                <input
                                                    type="tel"
                                                    value={form.phone}
                                                    onChange={(e) => {
                                                        updateField("phone", e.target.value);
                                                        if (kycVerifiedPhone !== e.target.value.trim()) {
                                                            setKycStatus("idle");
                                                        }
                                                    }}
                                                    placeholder="+237 6XX XXX XXX"
                                                    required
                                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={verifyPhone}
                                                disabled={!form.phone.trim() || kycStatus === "checking"}
                                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                                                    kycStatus === "active"
                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                                                        : kycStatus === "inactive" || kycStatus === "error"
                                                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                                          : "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/30"
                                                }`}
                                            >
                                                {kycStatus === "checking" ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : kycStatus === "active" ? (
                                                    <ShieldCheck size={16} />
                                                ) : kycStatus === "inactive" || kycStatus === "error" ? (
                                                    <AlertTriangle size={16} />
                                                ) : (
                                                    <ShieldCheck size={16} />
                                                )}
                                                {kycStatus === "checking"
                                                    ? t.common.loading
                                                    : kycStatus === "active"
                                                      ? t.onboarding.phoneVerified
                                                      : kycStatus === "inactive"
                                                        ? t.onboarding.phoneNotFound
                                                        : t.onboarding.verifyPhone}
                                            </button>
                                        </div>
                                        {kycStatus === "active" && (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                                                <ShieldCheck size={12} />
                                                {t.onboarding.kycVerified}
                                            </p>
                                        )}
                                        {kycStatus === "inactive" && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                                                <AlertTriangle size={12} />
                                                {t.onboarding.kycNotFound}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {t.onboarding.cuisineType}
                                        </label>
                                        <div className="relative">
                                            <UtensilsCrossed size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                            <select
                                                value={form.cuisineType}
                                                onChange={(e) => updateField("cuisineType", e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none"
                                            >
                                                {CUISINE_TYPES.map((ct) => (
                                                    <option key={ct.value} value={ct.value}>
                                                        {t.onboarding[ct.labelKey]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {t.onboarding.description}
                                            <span className="text-surface-400 ml-1">({t.common.optional})</span>
                                        </label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => updateField("description", e.target.value)}
                                            placeholder={t.onboarding.descriptionPlaceholder}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {t.onboarding.socialLink}
                                            <span className="text-surface-400 ml-1">({t.common.optional})</span>
                                        </label>
                                        <div className="relative">
                                            <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                            <input
                                                type="url"
                                                value={form.socialLink}
                                                onChange={(e) => updateField("socialLink", e.target.value)}
                                                placeholder={t.onboarding.socialLinkPlaceholder}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Location */}
                            {STEPS[step] === "location" && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {t.onboarding.city}
                                        </label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                            <select
                                                value={form.city}
                                                onChange={(e) => updateField("city", e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none"
                                            >
                                                {CAMEROON_CITIES.map((city) => (
                                                    <option key={city} value={city}>
                                                        {city}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {t.onboarding.address} *
                                        </label>
                                        <input
                                            type="text"
                                            value={form.address}
                                            onChange={(e) => updateField("address", e.target.value)}
                                            placeholder={t.onboarding.addressPlaceholder}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                        />
                                        <p className="text-xs text-surface-400 mt-1.5">
                                            {t.onboarding.addressHint}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Opening Hours */}
                            {STEPS[step] === "hours" && (
                                <div className="space-y-4">
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                                        {t.onboarding.hoursDesc}
                                    </p>
                                    {(Object.keys(form.openingHours) as DayKey[]).map((day) => (
                                        <div
                                            key={day}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                form.openingHours[day].isOpen
                                                    ? "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800"
                                                    : "border-surface-100 dark:border-surface-800 bg-surface-100/50 dark:bg-surface-800/50 opacity-60"
                                            }`}
                                        >
                                            <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                                                <input
                                                    type="checkbox"
                                                    checked={form.openingHours[day].isOpen}
                                                    onChange={(e) => updateHours(day, "isOpen", e.target.checked)}
                                                    className="w-4 h-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                                                />
                                                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                                    {dayLabels[day]}
                                                </span>
                                            </label>

                                            {form.openingHours[day].isOpen && (
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <input
                                                        type="time"
                                                        value={form.openingHours[day].open}
                                                        onChange={(e) => updateHours(day, "open", e.target.value)}
                                                        className="px-2 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                    />
                                                    <span className="text-surface-400 text-sm">→</span>
                                                    <input
                                                        type="time"
                                                        value={form.openingHours[day].close}
                                                        onChange={(e) => updateHours(day, "close", e.target.value)}
                                                        className="px-2 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                    />
                                                </div>
                                            )}

                                            {!form.openingHours[day].isOpen && (
                                                <span className="ml-auto text-xs text-surface-400">
                                                    {t.onboarding.closed}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Step 4: SaaS Plan Selection */}
                            {STEPS[step] === "plan" && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                                            {t.onboarding.planTitle}
                                        </h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400">
                                            {t.onboarding.planSubtitle}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { id: "starter", name: t.onboarding.planStarter, price: t.pricing.freePrice, commission: "0%", features: [t.pricing.feature1restaurant, t.pricing.featureUpTo15] },
                                            { id: "pro", name: t.onboarding.planPro, price: t.pricing.proPrice, commission: "5%", features: [t.pricing.featureUnlimitedProducts, t.pricing.featurePrioritySupport], popular: true },
                                            { id: "business", name: t.onboarding.planBusiness, price: t.pricing.businessPrice, commission: "3%", features: [t.pricing.featureMultiRestaurant, t.pricing.featureDedicatedManager] },
                                        ].map((plan) => (
                                            <div
                                                key={plan.id}
                                                onClick={() => updateField("saasPlanId", plan.id)}
                                                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer hover:border-brand-500/50 ${
                                                    form.saasPlanId === plan.id
                                                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/10"
                                                        : "border-surface-200 dark:border-surface-800"
                                                }`}
                                            >
                                                {plan.popular && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        {t.pricing.proPopular}
                                                    </div>
                                                )}
                                                <div className="text-lg font-bold mb-1">{plan.name}</div>
                                                <div className="flex items-baseline gap-1 mb-2">
                                                    <span className="text-2xl font-black">{plan.price}</span>
                                                    {plan.price !== t.pricing.freePrice && <span className="text-xs text-surface-500">{t.pricing.proPeriod}</span>}
                                                </div>
                                                <div className="text-xs text-brand-600 dark:text-brand-400 font-semibold mb-4">
                                                    {plan.commission} {t.onboarding.planCommission}
                                                </div>
                                                <ul className="space-y-2">
                                                    {plan.features.map((feat, i) => (
                                                        <li key={i} className="flex items-center gap-2 text-[11px] text-surface-500">
                                                            <Check size={12} className="text-green-500" />
                                                            {feat}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Legal Agreement */}
                            {STEPS[step] === "legal" && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                                            {t.onboarding.legalTitle}
                                        </h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400">
                                            {t.onboarding.legalSubtitle}
                                        </p>
                                    </div>

                                    <div className="bg-surface-50 dark:bg-surface-800 p-6 rounded-2xl border border-surface-200 dark:border-surface-700">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="bg-brand-100 dark:bg-brand-900/30 p-2 rounded-lg text-brand-600 dark:text-brand-400">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-surface-900 dark:text-white mb-1">Kbouffe SaaS Agreement</h4>
                                                <p className="text-xs text-surface-500">Dernière mise à jour : 8 Mars 2026</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 text-sm text-surface-600 dark:text-surface-400 max-h-48 overflow-y-auto mb-6 pr-2 scrollbar-thin scrollbar-thumb-surface-300">
                                            <p>En utilisant Kbouffe SaaS, vous acceptez que :</p>
                                            <ul className="list-disc pl-4 space-y-2">
                                                <li>Kbouffe agit en tant que facilitateur technologique.</li>
                                                <li>Vous êtes responsable de la conformité légale et fiscale de votre restaurant.</li>
                                                <li>Les fonds sont prélevés via votre propre passerelle de paiement (Stripe/Mobile Money).</li>
                                                <li>Kbouffe prélève une commission automatique sur chaque transaction réussie selon votre plan.</li>
                                            </ul>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="flex items-center gap-3 p-4 rounded-xl border border-brand-200 dark:border-brand-900/50 bg-brand-50/30 dark:bg-brand-900/5 cursor-pointer hover:bg-brand-50/50 transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={form.cguAccepted}
                                                    onChange={(e) => updateField("cguAccepted", e.target.checked)}
                                                    className="w-5 h-5 rounded border-brand-300 text-brand-500 focus:ring-brand-500"
                                                />
                                                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                                    {t.onboarding.legalCguLabel}
                                                </span>
                                            </label>

                                            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/5">
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.healthAccepted}
                                                        onChange={(e) => updateField("healthAccepted", e.target.checked)}
                                                        className="w-5 h-5 mt-0.5 rounded border-amber-300 text-amber-500 focus:ring-amber-500"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-sm font-bold text-surface-900 dark:text-white mb-1">
                                                            {t.onboarding.legalHealthLabel}
                                                        </div>
                                                        <p className="text-xs text-surface-600 dark:text-surface-400">
                                                            {t.onboarding.legalHealthDesc}
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 6: Payment Setup */}
                            {STEPS[step] === "payment" && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                                            {t.onboarding.paymentTitle}
                                        </h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400">
                                            {t.onboarding.paymentSubtitle}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => updateField("paymentProvider", "stripe")}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                                                form.paymentProvider === "stripe"
                                                    ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/10 outline-none ring-2 ring-brand-500/20"
                                                    : "border-surface-200 dark:border-surface-800 hover:border-surface-300"
                                            }`}
                                        >
                                            <div className="bg-[#635BFF] text-white p-3 rounded-xl shadow-lg shadow-[#635BFF]/20">
                                                <Globe size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-surface-900 dark:text-white">Stripe Connect</div>
                                                <div className="text-xs text-surface-500">{t.onboarding.paymentSetupStripe}</div>
                                            </div>
                                            {form.paymentProvider === "stripe" && <Check size={20} className="text-brand-500" />}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => updateField("paymentProvider", "mobile_money")}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                                                form.paymentProvider === "mobile_money"
                                                    ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/10 outline-none ring-2 ring-brand-500/20"
                                                    : "border-surface-200 dark:border-surface-800 hover:border-surface-300"
                                            }`}
                                        >
                                            <div className="bg-amber-400 text-surface-900 p-3 rounded-xl shadow-lg shadow-amber-400/20">
                                                <Phone size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-surface-900 dark:text-white">Mobile Money (MTN/Orange)</div>
                                                <div className="text-xs text-surface-500">{t.onboarding.paymentSetupMobileMoney}</div>
                                            </div>
                                            {form.paymentProvider === "mobile_money" && <Check size={20} className="text-brand-500" />}
                                        </button>

                                        {form.paymentProvider === "mobile_money" && (
                                            <div className="p-5 rounded-2xl border border-brand-200 dark:border-brand-900/30 bg-brand-50/20 dark:bg-brand-900/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div>
                                                    <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                                                        {t.onboarding.paymentMomoNumber}
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={form.paymentMomoNumber}
                                                        onChange={(e) => updateField("paymentMomoNumber", e.target.value)}
                                                        placeholder={t.onboarding.paymentMomoNumberPlaceholder}
                                                        className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                                                        {t.onboarding.paymentMomoName}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={form.paymentMomoName}
                                                        onChange={(e) => updateField("paymentMomoName", e.target.value)}
                                                        placeholder={t.onboarding.paymentMomoNamePlaceholder}
                                                        className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 dark:text-amber-400">
                                            {t.onboarding.paymentWarning}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Review */}
                            {STEPS[step] === "review" && (
                                <div className="space-y-4">
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                                        {t.onboarding.reviewDesc}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                                            <div className="text-xs text-surface-400 mb-1">{t.onboarding.restaurantName}</div>
                                            <div className="font-medium text-surface-900 dark:text-white">{form.restaurantName}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                                            <div className="text-xs text-surface-400 mb-1">{t.onboarding.phone}</div>
                                            <div className="font-medium text-surface-900 dark:text-white">{form.phone}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                                            <div className="text-xs text-surface-400 mb-1">{t.onboarding.cuisineType}</div>
                                            <div className="font-medium text-surface-900 dark:text-white">
                                                {t.onboarding[CUISINE_TYPES.find((c) => c.value === form.cuisineType)?.labelKey ?? "cuisineOther"]}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                                            <div className="text-xs text-surface-400 mb-1">{t.onboarding.city}</div>
                                            <div className="font-medium text-surface-900 dark:text-white">{form.city}</div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                                        <div className="text-xs text-surface-400 mb-1">{t.onboarding.address}</div>
                                        <div className="font-medium text-surface-900 dark:text-white">{form.address}</div>
                                    </div>

                                    {form.description && (
                                        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                                            <div className="text-xs text-surface-400 mb-1">{t.onboarding.description}</div>
                                            <div className="text-sm text-surface-700 dark:text-surface-300">{form.description}</div>
                                        </div>
                                    )}

                                    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                                        <div className="text-xs text-surface-400 mb-2">{t.onboarding.stepHours}</div>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                            {(Object.keys(form.openingHours) as DayKey[]).map((day) => (
                                                <div
                                                    key={day}
                                                    className="flex items-center justify-between py-1"
                                                >
                                                    <span className="text-surface-600 dark:text-surface-400">
                                                        {dayLabels[day]}
                                                    </span>
                                                    <span className="font-medium text-surface-900 dark:text-white">
                                                        {form.openingHours[day].isOpen
                                                            ? `${form.openingHours[day].open} - ${form.openingHours[day].close}`
                                                            : t.onboarding.closed}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-900/50 bg-brand-50/20 dark:bg-brand-900/5">
                                            <div className="text-xs text-surface-400 mb-1">{t.onboarding.stepPlan}</div>
                                            <div className="font-bold text-brand-600 dark:text-brand-400 capitalize">{form.saasPlanId}</div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-900/50 bg-brand-50/20 dark:bg-brand-900/5">
                                            <div className="text-xs text-surface-400 mb-1">{t.onboarding.stepPayment}</div>
                                            <div className="font-bold text-brand-600 dark:text-brand-400 capitalize">
                                                {form.paymentProvider.replace("_", " ")}
                                                {form.paymentProvider === "mobile_money" && (
                                                    <span className="block text-[10px] font-normal text-surface-500 mt-0.5">
                                                        {form.paymentMomoNumber} - {form.paymentMomoName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={step === 0}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-0 disabled:pointer-events-none transition-all"
                            >
                                <ArrowLeft size={18} />
                                {t.common.back}
                            </button>

                            {step < STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5"
                                >
                                    {t.onboarding.next}
                                    <ArrowRight size={18} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white rounded-xl font-semibold transition-all shadow-md shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5"
                                >
                                    {loading && <Loader2 size={18} className="animate-spin" />}
                                    {loading ? t.onboarding.creating : t.onboarding.createStore}
                                    {!loading && <Check size={18} />}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
