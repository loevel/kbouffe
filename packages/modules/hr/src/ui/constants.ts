import { TeamRole } from "../api/permissions";

export const ROLE_LABELS: Record<TeamRole, { fr: string; en: string }> = {
    owner: { fr: "Propriétaire", en: "Owner" },
    manager: { fr: "Gérant", en: "Manager" },
    cashier: { fr: "Caissier", en: "Cashier" },
    cook: { fr: "Cuisinier", en: "Cook" },
    viewer: { fr: "Observateur", en: "Viewer" },
    driver: { fr: "Livreur", en: "Driver" },
};

export const ROLE_BADGE_VARIANT: Record<TeamRole, "brand" | "info" | "success" | "warning" | "default"> = {
    owner: "brand",
    manager: "info",
    cashier: "success",
    cook: "warning",
    viewer: "default",
    driver: "brand", // Or potentially another color, brand highlights them as external fleet
};
