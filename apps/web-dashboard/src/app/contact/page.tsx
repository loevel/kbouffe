import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Nous contacter — Kbouffe",
    description: "Contactez l'équipe Kbouffe. Réponse moyenne : 2 heures. Support 24/7 via email et WhatsApp.",
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
                        <p className="text-lg text-surface-600 dark:text-surface-400 mb-6">
                            On répond à chaque message en moins de 2 heures. Qu&apos;est-ce qu&apos;on peut faire pour vous ?
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <span className="flex items-center gap-2 text-surface-500">
                                <span className="text-green-500 font-bold">✓</span>
                                Réponse moyenne: 2h
                            </span>
                            <span className="flex items-center gap-2 text-surface-500">
                                <span className="text-green-500 font-bold">✓</span>
                                Chaque message compte
                            </span>
                            <span className="flex items-center gap-2 text-surface-500">
                                <span className="text-green-500 font-bold">✓</span>
                                Support 24/7
                            </span>
                        </div>
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
                                    <h3 className="font-semibold text-surface-900 dark:text-white mb-1">WhatsApp/Téléphone</h3>
                                    <p className="text-surface-600 dark:text-surface-400">Réponse en ~5 min</p>
                                    <a href="https://wa.me/237XXXXXXXXX" className="text-brand-500 hover:text-brand-600 font-medium mt-2 inline-block">
                                        Ouvrir WhatsApp →
                                    </a>
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
