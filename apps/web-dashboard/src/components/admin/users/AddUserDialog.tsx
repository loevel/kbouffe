"use client";

import { useState } from "react";
import { Modal, ModalFooter, Button, Input, Select, toast } from "@kbouffe/module-core/ui";
import { UserPlus, Mail, Lock, User, Phone } from "lucide-react";

interface AddUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddUserDialog({ isOpen, onClose, onSuccess }: AddUserDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        role: "client",
        adminRole: "support",
    });

    const roles = [
        { value: "client", label: "Client" },
        { value: "merchant", label: "Marchand" },
        { value: "livreur", label: "Livreur" },
        { value: "admin", label: "Administrateur" },
    ];

    const adminRoles = [
        { value: "super_admin", label: "Super Admin" },
        { value: "support", label: "Support" },
        { value: "sales", label: "Commercial" },
        { value: "moderator", label: "Modérateur" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erreur lors de la création");
            }

            toast.success("Utilisateur créé avec succès");
            onSuccess();
            onClose();
            setFormData({
                email: "",
                password: "",
                fullName: "",
                phone: "",
                role: "client",
                adminRole: "support",
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nouvel Utilisateur"
            description="Créez un nouvel utilisateur sur la plateforme."
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Email"
                    type="email"
                    required
                    placeholder="exemple@kbouffe.com"
                    leftIcon={<Mail size={18} />}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                    label="Mot de passe"
                    type="password"
                    required
                    placeholder="••••••••"
                    leftIcon={<Lock size={18} />}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Input
                    label="Nom Complet"
                    placeholder="Jean Dupont"
                    leftIcon={<User size={18} />}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
                <Input
                    label="Téléphone"
                    placeholder="+237 6..."
                    leftIcon={<Phone size={18} />}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Rôle"
                        options={roles}
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                    {formData.role === "admin" && (
                        <Select
                            label="Droit Admin"
                            options={adminRoles}
                            value={formData.adminRole}
                            onChange={(e) => setFormData({ ...formData, adminRole: e.target.value })}
                        />
                    )}
                </div>

                <ModalFooter>
                    <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button type="submit" isLoading={isLoading} leftIcon={<UserPlus size={18} />}>
                        Créer l'utilisateur
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
