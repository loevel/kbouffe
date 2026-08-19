import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider, LocaleProvider, ToastProvider } from "@kbouffe/module-core/ui";
import { CartProvider } from "@/contexts/cart-context";
import { ClientAppProvider } from "@/components/providers/ClientAppProvider";
import { PushNotificationManagerLazy } from "@/components/providers/PushNotificationManagerLazy";
import { PwaInstallPrompt } from "@/components/shared/PwaInstallPrompt";
import { SITE_URL } from "@/lib/seo/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Canonical par défaut = l'URL de la page sur le domaine canonique. Évite que
  // www.kbouffe.com, l'URL *.workers.dev ou un sous-domaine réécrit soient
  // indexés comme des pages distinctes. Les pages qui définissent leur propre
  // `alternates` (vitrines /r/<slug>) gardent la main.
  alternates: {
    canonical: "./",
  },
  title: {
    default: "Kbouffe — Votre restaurant en ligne au Cameroun",
    template: "%s | Kbouffe",
  },
  description:
    "Créez votre boutique de commande en ligne en 2 minutes. Acceptez les paiements Mobile Money (MTN, Orange). 0% de commission.",
  keywords: [
    "restaurant en ligne",
    "commande en ligne",
    "Mobile Money",
    "MTN MoMo",
    "Orange Money",
    "Cameroun",
    "livraison",
    "food delivery",
    "Kbouffe",
  ],
  authors: [{ name: "Kbouffe", url: "https://kbouffe.com" }],
  creator: "Kbouffe",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "fr_CM",
    siteName: "Kbouffe",
    images: [{ url: "/logo-full.svg", width: 400, height: 120, alt: "Kbouffe" }],
  },
  twitter: {
    card: "summary",
    creator: "@kbouffe",
    images: ["/logo-full.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kbouffe",
  },
  other: {
    "msapplication-TileColor": "#f97316",
  },
};

export const viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Permet à la BottomNavBar de s'étendre sous le notch iPhone / Dynamic Island
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('kbouffe-theme');var d=document.documentElement;if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}else{d.classList.add('light')}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <LocaleProvider>
            <ClientAppProvider>
              <CartProvider>
                {children}
                <PwaInstallPrompt />
                <ToastProvider />
                <PushNotificationManagerLazy />
              </CartProvider>
            </ClientAppProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
