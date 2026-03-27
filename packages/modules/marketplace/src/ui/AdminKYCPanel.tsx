"use client";

import { useState } from "react";
import { Check, X, ExternalLink, AlertCircle } from "lucide-react";
import {
  Card,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  Modal,
  ModalFooter,
  toast,
  adminFetch,
} from "@kbouffe/module-core/ui";
import useSWR from "swr";
import type { Supplier, SupplierKycStatus } from "../lib/types";

// ── Types ─────────────────────────────────────────────────────────────────

interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
}

type KycTab = "pending" | "approved" | "rejected";

// ── Fetcher ───────────────────────────────────────────────────────────────

async function fetchSuppliers(url: string): Promise<SuppliersResponse> {
  const res = await adminFetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── KYC status badge ──────────────────────────────────────────────────────

const KYC_STYLES: Record<KycTab, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const KYC_LABELS: Record<KycTab, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
};

const TYPE_LABELS: Record<string, string> = {
  individual_farmer: "🌱 Agriculteur",
  cooperative: "🤝 Coopérative",
  wholesaler: "🏪 Grossiste",
};

// ── Th helper (inline to avoid needing TableHead import variations) ────────

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-sm text-surface-900 dark:text-white ${className}`}>
      {children}
    </td>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export function AdminKYCPanel() {
  const [activeTab, setActiveTab] = useState<KycTab>("pending");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Supplier | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR<SuppliersResponse>(
    `/api/marketplace/admin/suppliers?kyc_status=${activeTab}`,
    fetchSuppliers,
    { revalidateOnFocus: false }
  );

  const suppliers = data?.suppliers ?? [];

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleApprove = async (supplier: Supplier) => {
    setActionLoading(supplier.id);
    try {
      const res = await adminFetch(
        `/api/marketplace/admin/suppliers/${supplier.id}/kyc`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kyc_status: "approved" as SupplierKycStatus }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erreur lors de l'approbation");
      } else {
        toast.success(`${supplier.name} approuvé avec succès.`);
        mutate();
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (supplier: Supplier) => {
    setRejectTarget(supplier);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error("Veuillez saisir un motif de refus.");
      return;
    }

    setActionLoading(rejectTarget.id);
    try {
      const res = await adminFetch(
        `/api/marketplace/admin/suppliers/${rejectTarget.id}/kyc`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kyc_status: "rejected" as SupplierKycStatus,
            rejection_reason: rejectReason,
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erreur lors du refus");
      } else {
        toast.success(`Dossier de ${rejectTarget.name} refusé.`);
        mutate();
        setRejectModalOpen(false);
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Tabs ─────────────────────────────────────────────────────────────────

  const tabs: { key: KycTab; label: string }[] = [
    { key: "pending", label: "En attente" },
    { key: "approved", label: "Approuvés" },
    { key: "rejected", label: "Refusés" },
  ];

  return (
    <>
      <Card padding="none">
        {/* Header */}
        <div className="p-4 border-b border-surface-100 dark:border-surface-800">
          <h2 className="text-base font-semibold text-surface-900 dark:text-white">
            Vérification KYC — Fournisseurs
          </h2>
          <p className="text-xs text-surface-500 mt-0.5">
            Examinez et approuvez les dossiers des fournisseurs agricoles
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-100 dark:border-surface-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-8 text-center text-sm text-surface-500">
            Chargement des dossiers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-surface-500 text-sm">
              Aucun fournisseur {KYC_LABELS[activeTab].toLowerCase()} pour le moment.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <Th>Fournisseur</Th>
                <Th>Type</Th>
                <Th>Région</Th>
                <Th>Téléphone</Th>
                <Th>Soumis le</Th>
                <Th>Documents</Th>
                {activeTab === "pending" && <Th>Actions</Th>}
                {activeTab !== "pending" && <Th>Statut</Th>}
              </tr>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <Td>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-xs text-surface-500">
                        {supplier.contact_name}
                      </p>
                    </div>
                  </Td>
                  <Td>{TYPE_LABELS[supplier.type] ?? supplier.type}</Td>
                  <Td>
                    <span className="text-xs">
                      {supplier.locality}, {supplier.region}
                    </span>
                  </Td>
                  <Td>{supplier.phone}</Td>
                  <Td>
                    <span className="text-xs text-surface-500">
                      {new Date(supplier.created_at).toLocaleDateString(
                        "fr-CM",
                        { day: "2-digit", month: "short", year: "numeric" }
                      )}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {supplier.identity_doc_url && (
                        <a
                          href={supplier.identity_doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                        >
                          <ExternalLink size={12} />
                          Identité
                        </a>
                      )}
                      {supplier.minader_cert_url && (
                        <a
                          href={supplier.minader_cert_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                        >
                          <ExternalLink size={12} />
                          MINADER
                        </a>
                      )}
                      {!supplier.identity_doc_url &&
                        !supplier.minader_cert_url && (
                          <span className="text-xs text-surface-400">
                            Aucun document
                          </span>
                        )}
                    </div>
                  </Td>
                  {activeTab === "pending" ? (
                    <Td>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          leftIcon={<Check size={14} />}
                          isLoading={actionLoading === supplier.id}
                          disabled={actionLoading !== null}
                          onClick={() => handleApprove(supplier)}
                        >
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<X size={14} />}
                          disabled={actionLoading !== null}
                          onClick={() => openRejectModal(supplier)}
                        >
                          Refuser
                        </Button>
                      </div>
                    </Td>
                  ) : (
                    <Td>
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${KYC_STYLES[activeTab]}`}
                      >
                        {KYC_LABELS[activeTab]}
                      </span>
                      {activeTab === "rejected" &&
                        supplier.kyc_rejection_reason && (
                          <p className="text-xs text-surface-400 mt-1 max-w-[200px] truncate">
                            {supplier.kyc_rejection_reason}
                          </p>
                        )}
                    </Td>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Reject modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Refuser le dossier"
      >
        <div className="space-y-4">
          <div className="flex gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">
              Vous êtes sur le point de refuser le dossier de{" "}
              <strong>{rejectTarget?.name}</strong>. Le fournisseur sera
              notifié avec le motif indiqué.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Motif du refus <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Ex : Documents d'identité illisibles. Veuillez soumettre des photos de meilleure qualité."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white resize-none"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            isLoading={actionLoading === rejectTarget?.id}
            disabled={actionLoading !== null}
            onClick={handleReject}
          >
            Confirmer le refus
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
