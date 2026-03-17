import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Nous contacter — Kbouffe",
    description: "Contactez l'équipe Kbouffe pour toute question, suggestion ou demande de partenariat.",
};

export default function ContactPage() {
    return (
        <div className="flex min-h-screen flex-col bg-surface-50 dark:bg-surface-950 font-sans">
            <Navbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-surface-900 dark:text-white mb-4">
                            Nous contacter
                        </h1>
                        <p className="text-lg text-surface-600 dark:text-surface-400">
                            Une question, une suggestion ou besoin d&apos;aide ? Notre équipe est là pour vous.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {/* Contact info */}
                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                                    <Mail className="h-5 w-5 text-brand-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-surface-900 dark:text-white mb-1">E-mail</h3>
                                    <p className="text-surface-600 dark:text-surface-400">contact@kbouffe.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                                    <Phone className="h-5 w-5 text-brand-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-surface-900 dark:text-white mb-1">Téléphone</h3>
                                    <p className="text-surface-600 dark:text-surface-400">+237 6XX XXX XXX</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                                    <MapPin className="h-5 w-5 text-brand-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-surface-900 dark:text-white mb-1">Adresse</h3>
                                    <p className="text-surface-600 dark:text-surface-400">Douala, Cameroun</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact form */}
                        <div className="lg:col-span-2">
                            <ContactForm />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
