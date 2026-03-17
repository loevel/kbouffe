import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { ForWho } from "@/components/landing/ForWho";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Restaurants } from "@/components/landing/Restaurants";
import { Testimonials } from "@/components/landing/Testimonials";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-950 font-sans">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <ForWho />
        <Features />
        <HowItWorks />
        <Restaurants />
        <Testimonials />
      </main>

      <Footer />
    </div>
  );
}
