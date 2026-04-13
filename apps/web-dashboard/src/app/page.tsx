import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { MarketSegments } from "@/components/landing/MarketSegments";
import { ForWho } from "@/components/landing/ForWho";
import { Features } from "@/components/landing/Features";
import { ProFeatures } from "@/components/landing/ProFeatures";
import { RemoteDineIn } from "@/components/landing/RemoteDineIn";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MarketplacePacks } from "@/components/landing/MarketplacePacks";
import { PricingTeaser } from "@/components/landing/PricingTeaser";
import { Restaurants } from "@/components/landing/Restaurants";
import { Testimonials } from "@/components/landing/Testimonials";
import { LandingFaq } from "@/components/landing/LandingFaq";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-950 font-sans">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <ForWho />
        <MarketSegments />
        <Features />
        <ProFeatures />
        <MarketplacePacks />
        <RemoteDineIn />
        <HowItWorks />
        <PricingTeaser />
        <Restaurants />
        <Testimonials />
        <LandingFaq />
      </main>

      <Footer />
    </div>
  );
}
