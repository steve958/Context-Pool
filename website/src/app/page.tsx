import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Providers from "@/components/Providers";
import QuickStart from "@/components/QuickStart";
import ApiShowcase from "@/components/ApiShowcase";
import UseCases from "@/components/UseCases";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Providers />
        <QuickStart />
        <ApiShowcase />
        <UseCases />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
