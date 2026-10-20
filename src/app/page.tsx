import { Hero } from "@/components/sections/Hero";
import { Comparison } from "@/components/sections/Comparison";
import { Showcase } from "@/components/showcase/Showcase";
import { HelmFit } from "@/components/sections/HelmFit";
import { Setup } from "@/components/sections/Setup";
import { Testimonials } from "@/components/sections/Testimonials";
import { Engineering } from "@/components/sections/Engineering";
import { FinalCta } from "@/components/sections/FinalCta";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <main className="bg-ink">
        <Hero />
        <Comparison />
        {/* Sections 3 + 4 share one sticky 3D stage */}
        <Showcase />
        <HelmFit />
        <Setup />
        <Testimonials />
        <Engineering />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
