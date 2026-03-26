"use client";

import { useState } from "react";
import { Check, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { Card, Button, Input, toast } from "@kbouffe/module-core/ui";
import { registerSupplier } from "../hooks/use-suppliers";
import type {
  SupplierType,
  CameroonRegion,
  RegisterSupplierRequest,
} from "../lib/types";
import { CAMEROON_REGIONS } from "../lib/types";

// ── Types ─────────────────────────────────────────────────────────────────

interface FormState {
  // Step 1
  type: SupplierType | "";
  // Step 2
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  region: CameroonRegion | "";
  locality: string;
  description: string;
  // Step 3 — individual
  identity_doc_url: string;
  phytosanitary_declaration: string;
  // Step 3 — cooperative extra
  cooperative_number: string;
  minader_cert_url: string;
  // Step 3 — wholesaler extra
  rccm: string;
  nif: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS: {
  value: SupplierType;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: "individual_farmer",
    label: "Agriculteur Individuel",
    emoji: "🌾",
    description:
      "Exploitant agricole individuel ou famille paysanne. Idéal pour les petites productions locales.",
  },
  {
    value: "cooperative",
    label: "Coopérative",
    emoji: "🤝",
    description:
      "Groupement de producteurs. Volumes importants, prix négociés, gestion collective.",
  },
  {
    value: "wholesaler",
    label: "Grossiste",
    emoji: "🏪",
    description:
      "Entreprise commerciale. RCCM requis. Agrée pour la distribution en gros.",
  },
];

const STEP_TITLES = [
  "Type de compte",
  "Informations générales",
  "Documents",
  "Confirmation",
];

// ── Progress indicator ────────────────────────────────────────────────────

function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              i < current
                ? "bg-primary-600 text-white"
                : i === current
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border-2 border-primary-600"
                : "bg-surface-100 dark:bg-surface-800 text-surface-400"
            }`}
          >
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`h-0.5 w-8 transition-all ${
                i < current
                  ? "bg-primary-600"
                  : "bg-surface-200 dark:bg-surface-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Labeled input wrapper ─────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface SupplierRegisterFormProps {
  onSuccess?: () => void;
}

export function SupplierRegisterForm({ onSuccess }: SupplierRegisterFormProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    type: "",
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    region: "",
    locality: "",
    description: "",
    identity_doc_url: "",
    phytosanitary_declaration: "",
    cooperative_number: "",
    minader_cert_url: "",
    rccm: "",
    nif: "",
  });

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Validation ──────────────────────────────────────────────────────────

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.type) return "Veuillez sélectionner un type de compte.";
    }
    if (step === 1) {
      if (!form.name.trim()) return "Le nom est requis.";
      if (!form.contact_name.trim()) return "Le nom du contact est requis.";
      if (!form.phone.trim()) return "Le numéro de téléphone est requis.";
      if (!form.region) return "La région est requise.";
      if (!form.locality.trim()) return "La localité est requise.";
    }
    if (step === 2) {
      if (form.type === "wholesaler") {
        if (!form.rccm.trim()) return "Le numéro RCCM est requis pour les grossistes.";
        if (!form.nif.trim()) return "Le NIF est requis pour les grossistes.";
      }
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.type || !form.region) return;

    const payload: RegisterSupplierRequest = {
      name: form.name,
      type: form.type,
      contact_name: form.contact_name,
      phone: form.phone,
      email: form.email || undefined,
      description: form.description || undefined,
      region: form.region,
      locality: form.locality,
      identity_doc_url: form.identity_doc_url || undefined,
      phytosanitary_declaration: form.phytosanitary_declaration || undefined,
      cooperative_number: form.cooperative_number || undefined,
      minader_cert_url: form.minader_cert_url || undefined,
      rccm: form.rccm || undefined,
      nif: form.nif || undefined,
    };

    setSubmitting(true);
    const { success, error } = await registerSupplier(payload);
    setSubmitting(false);

    if (!success) {
      toast.error(error ?? "Erreur lors de l'inscription.");
      return;
    }

    toast.success("Votre dossier a été soumis avec succès ! Nous le traiterons sous 48h.");
    onSuccess?.();
  };

  // ── Step renders ────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-4">
      <p className="text-sm text-surface-500 text-center mb-2">
        Sélectionnez le type qui correspond le mieux à votre activité.
      </p>
      <div className="grid gap-3">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => set("type", opt.value)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              form.type === opt.value
                ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                : "border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{opt.emoji}</span>
              <div>
                <p className="font-semibold text-surface-900 dark:text-white">
                  {opt.label}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  {opt.description}
                </p>
              </div>
              {form.type === opt.value && (
                <Check
                  size={18}
                  className="ml-auto text-primary-600 shrink-0"
                />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <Input
        label="Nom du fournisseur / exploitation *"
        placeholder="Ex : Ferme Ngom, Coopérative Bamiléké..."
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
      />
      <Input
        label="Nom du responsable *"
        placeholder="Prénom et nom"
        value={form.contact_name}
        onChange={(e) => set("contact_name", e.target.value)}
      />
      <Input
        label="Téléphone *"
        placeholder="Ex : 677000000"
        value={form.phone}
        onChange={(e) => set("phone", e.target.value)}
      />
      <Input
        label="Email"
        type="email"
        placeholder="contact@exemple.cm"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
      />
      <Field label="Région *">
        <select
          className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white"
          value={form.region}
          onChange={(e) => set("region", e.target.value)}
        >
          <option value="">Sélectionner une région</option>
          {CAMEROON_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>
      <Input
        label="Localité / Ville *"
        placeholder="Ex : Bafoussam, Bertoua..."
        value={form.locality}
        onChange={(e) => set("locality", e.target.value)}
      />
      <Field label="Description de l'activité">
        <textarea
          rows={3}
          placeholder="Décrivez vos produits, votre région de production, vos certifications..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white resize-none"
        />
      </Field>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-surface-500 mb-2">
        Les documents permettent de vérifier votre identité et la légitimité de
        votre activité. Votre dossier sera examiné sous 48h.
      </p>

      {/* Common: identity doc */}
      <Input
        label="Pièce d'identité (CNI ou passeport) — URL ou lien"
        placeholder="https://..."
        value={form.identity_doc_url}
        onChange={(e) => set("identity_doc_url", e.target.value)}
      />

      {/* Individual farmer */}
      {form.type === "individual_farmer" && (
        <Field label="Déclaration phytosanitaire">
          <textarea
            rows={3}
            placeholder="Précisez les traitements appliqués, les produits utilisés, fréquence des traitements..."
            value={form.phytosanitary_declaration}
            onChange={(e) => set("phytosanitary_declaration", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white resize-none"
          />
        </Field>
      )}

      {/* Cooperative */}
      {form.type === "cooperative" && (
        <>
          <Input
            label="Numéro d'agrément coopérative"
            placeholder="Ex : COOPAG-2024-001"
            value={form.cooperative_number}
            onChange={(e) => set("cooperative_number", e.target.value)}
          />
          <Input
            label="Certificat MINADER — URL"
            placeholder="https://..."
            value={form.minader_cert_url}
            onChange={(e) => set("minader_cert_url", e.target.value)}
          />
        </>
      )}

      {/* Wholesaler */}
      {form.type === "wholesaler" && (
        <>
          <Input
            label="Numéro RCCM *"
            placeholder="Ex : RC/YAO/2023/B/001"
            value={form.rccm}
            onChange={(e) => set("rccm", e.target.value)}
          />
          <Input
            label="NIF (Numéro d'Identification Fiscale) *"
            placeholder="Ex : M012345678901N"
            value={form.nif}
            onChange={(e) => set("nif", e.target.value)}
          />
          <Input
            label="Certificat MINADER — URL"
            placeholder="https://..."
            value={form.minader_cert_url}
            onChange={(e) => set("minader_cert_url", e.target.value)}
          />
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-800">
        {[
          {
            label: "Type",
            value:
              TYPE_OPTIONS.find((t) => t.value === form.type)?.label ?? "—",
          },
          { label: "Nom", value: form.name || "—" },
          { label: "Contact", value: form.contact_name || "—" },
          { label: "Téléphone", value: form.phone || "—" },
          { label: "Email", value: form.email || "—" },
          {
            label: "Région",
            value: form.region ? `${form.locality}, ${form.region}` : "—",
          },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-2.5 flex justify-between text-sm">
            <span className="text-surface-500">{label}</span>
            <span className="font-medium text-surface-900 dark:text-white">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Legal disclaimer */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 p-4">
        <div className="flex gap-2 mb-2">
          <AlertCircle
            size={16}
            className="text-amber-600 shrink-0 mt-0.5"
          />
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
            Clause d'intermédiaire — Loi n°2015/018 du 21 décembre 2015
          </p>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          En soumettant ce dossier, vous reconnaissez que{" "}
          <strong>KBouffe agit uniquement en qualité d'hébergeur et d'annuaire</strong>{" "}
          au sens de l'article 18 de la loi 2015/018. La facturation et le
          paiement s'effectuent{" "}
          <strong>directement entre le fournisseur et le restaurant</strong>.
          KBouffe perçoit des frais de mise en relation. En cas de litige,
          KBouffe dispose d'une{" "}
          <strong>action récursoire</strong> contre le fournisseur pour tout
          préjudice causé par un produit non conforme, impropre à la
          consommation ou faisant l'objet d'une déclaration mensongère. Le
          fournisseur s'engage à respecter les normes sanitaires en vigueur au
          Cameroun (décret n°2021/243) et à maintenir ses informations à jour.
        </p>
      </div>
    </div>
  );

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white text-center mb-1">
          Inscription Fournisseur
        </h2>
        <p className="text-sm text-surface-500 text-center mb-6">
          {STEP_TITLES[step]}
        </p>

        <StepIndicator current={step} total={4} />

        <div className="min-h-[300px]">{steps[step]()}</div>

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-surface-100 dark:border-surface-800">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
            leftIcon={<ChevronLeft size={16} />}
          >
            Retour
          </Button>

          {step < 3 ? (
            <Button onClick={handleNext} rightIcon={<ChevronRight size={16} />}>
              Continuer
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              isLoading={submitting}
              disabled={submitting}
            >
              Soumettre mon dossier
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
