import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider, LocaleProvider, ToastProvider } from "@kbouffe/module-core/ui";
import { CartProvider } from "@/contexts/cart-context";
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
  metadataBase: new URL("https://kbouffe.com"),
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
    icon: "/icon",
    apple: "/apple-icon",
  },
  openGraph: {
    type: "website",
    locale: "fr_CM",
    siteName: "Kbouffe",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@kbouffe",
  },
  other: {
    "theme-color": "#f97316",
    "msapplication-TileColor": "#f97316",
  },
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
            <CartProvider>
              {children}
              <ToastProvider />
            </CartProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
