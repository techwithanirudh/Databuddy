import Background from "./components/background";
import Navbar from "./components/navbar";
import FadeIn from "./components/FadeIn";
import SidebarNavigation from "./components/sidebar-navigation";
import Hero from "./components/hero";
import Features from "./components/features";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Sparkles, Boxes, Target } from "lucide-react";
import { Metadata } from "next";

import dynamic from "next/dynamic"; 

const CTA = dynamic(() => import("./components/cta"), { ssr: true });
const Privacy = dynamic(() => import("./components/privacy"), { ssr: true });
const FAQ = dynamic(() => import("./components/faq"), { ssr: true });
const Comparison = dynamic(() => import("./components/comparison"), { ssr: true });
const Performance = dynamic(() => import("./components/performance"), { ssr: true });
const Testimonials = dynamic(() => import("./components/testimonials"), { ssr: true });
const Contact = dynamic(() => import("./components/contact"), { ssr: true });
const SocialProof = dynamic(() => import("./components/social-proof"), { ssr: true });
const Footer = dynamic(() => import("./components/footer"), { ssr: true });
const EarlyAccessPopup = dynamic(() => import("./components/EarlyAccessPopup"), { ssr: true });

export const metadata: Metadata = {
  title: "Databuddy Analytics | Privacy-First Web Analytics",
  description: "Fast, privacy-first web analytics that gives you the insights you need without compromising user privacy or site performance.",
  keywords: ["privacy analytics", "cookieless analytics", "GDPR compliant analytics", "web analytics", "fast analytics", "privacy-first"],
  alternates: {
    canonical: "https://databuddy.cc"
  },
  openGraph: {
    title: "Databuddy Analytics | Privacy-First Web Analytics",
    description: "Fast, privacy-first web analytics that gives you the insights you need without compromising user privacy or site performance.",
    url: "https://databuddy.cc",
    type: "website",
    siteName: "Databuddy Analytics"
  },
  twitter: {
    card: "summary_large_image",
    title: "Databuddy Analytics | Privacy-First Web Analytics",
    description: "Fast, privacy-first web analytics that gives you the insights you need without compromising user privacy or site performance."
  }
};

export default function Home() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scroll-smooth">
        <Navbar />
        <SidebarNavigation />
        <FadeIn>
          <Hero />
        </FadeIn>
        {/* <FadeIn delay={100}>
          <SocialProof />
        </FadeIn> */}
        <FadeIn delay={100}>
          <div id="privacy">
            <Privacy />
          </div>
        </FadeIn>
        
        <FadeIn delay={100}>
          <div id="compare">
            <Comparison />
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div id="performance">
            <Performance />
          </div>
        </FadeIn>
        {/* <FadeIn delay={100}>
          <Testimonials />
        </FadeIn> */}
        <FadeIn delay={100}>
          <div id="cta-form">
            <CTA />
          </div>
        </FadeIn>
        <Footer />
        
        {/* Early Access Popup with Typeform link */}
        <EarlyAccessPopup typeformUrl="https://form.typeform.com/to/yXiXwsDD" />
        
        {/* Structured data for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Databuddy Analytics",
              "url": "https://databuddy.cc",
              "logo": "https://databuddy.cc/logo.png",
              "description": "Privacy-first web analytics that doesn't compromise on features or performance.",
              "sameAs": [
                "https://twitter.com/databuddyps",
                "https://github.com/databuddy-analytics"
              ]
            })
          }}
        />
      </div>
    </div>
  );
}
