import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { competitors } from "./data";

// Import Navbar and Footer components
const Navbar = dynamic(() => import("@/app/components/navbar"), { ssr: true });
const Footer = dynamic(() => import("@/app/components/footer"), { ssr: true });

export const metadata = {
  title: "Compare Analytics Platforms | Databuddy Analytics",
  description: "See how Databuddy Analytics compares to other analytics platforms like Google Analytics, Plausible, Fathom, and Matomo.",
};

export default function ComparePage() {
  const competitorsToCompare = competitors.filter(c => c.id !== "Databuddy");
  const databuddy = competitors.find(c => c.id === "Databuddy");
  
  if (!databuddy) {
    return <div>Error loading comparison data</div>;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 relative">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none">
          <div className="absolute top-40 left-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute top-80 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-600">
                Compare Analytics Platforms
              </span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              See how Databuddy stacks up against other analytics platforms. We&apos;ve analyzed the key features, privacy considerations, and performance metrics to help you make an informed decision.
            </p>
          </div>
          
          {/* Databuddy Overview */}
          <div className="mb-12">
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <span className="mr-2">Databuddy Analytics</span>
                  <Badge className="bg-sky-500 text-white">Our Platform</Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Privacy-First Analytics with AI-Powered Insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-6">{databuddy.overview}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Key Strengths</h3>
                    <ul className="space-y-2">
                      {databuddy.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start text-slate-300">
                          <span className="text-sky-400 mr-2">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">What Sets Us Apart</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start text-slate-300">
                        <span className="text-sky-400 mr-2">•</span>
                        <span>Privacy-first approach with no cookies required</span>
                      </li>
                      <li className="flex items-start text-slate-300">
                        <span className="text-sky-400 mr-2">•</span>
                        <span>AI-powered insights that help you make data-driven decisions</span>
                      </li>
                      <li className="flex items-start text-slate-300">
                        <span className="text-sky-400 mr-2">•</span>
                        <span>Lightning-fast performance with minimal impact on your site</span>
                      </li>
                      <li className="flex items-start text-slate-300">
                        <span className="text-sky-400 mr-2">•</span>
                        <span>Complete data ownership and control</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Competitor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {competitorsToCompare.map((competitor) => (
              <Card 
                key={competitor.id}
                className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:border-sky-500/30 transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="text-white">{competitor.name}</CardTitle>
                  <CardDescription className="text-slate-400">
                    vs Databuddy Analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 mb-6">{competitor.overview}</p>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Key Differences</h3>
                    <p className="text-slate-300 mb-4">{competitor.outshine}</p>
                  </div>
                  <Link 
                    href={`/compare/${competitor.id}`}
                    className="inline-flex items-center bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Full Comparison <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Comparison Table */}
          <div className="mb-12">
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-white">Feature Comparison</CardTitle>
                <CardDescription className="text-slate-400">
                  See how Databuddy compares to other analytics platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="p-3 text-slate-400">Feature</th>
                      <th className="p-3 text-sky-400">Databuddy</th>
                      {competitorsToCompare.map((competitor) => (
                        <th key={competitor.id} className="p-3 text-slate-400">{competitor.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700">
                      <td className="p-3 text-slate-300">Privacy-First</td>
                      <td className="p-3 text-white">★★★★★</td>
                      <td className="p-3 text-white">★☆☆☆☆</td>
                      <td className="p-3 text-white">★★★★★</td>
                      <td className="p-3 text-white">★★★★★</td>
                      <td className="p-3 text-white">★★★★☆</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="p-3 text-slate-300">Ease of Use</td>
                      <td className="p-3 text-white">★★★★★</td>
                      <td className="p-3 text-white">★★★☆☆</td>
                      <td className="p-3 text-white">★★★★★</td>
                      <td className="p-3 text-white">★★★★☆</td>
                      <td className="p-3 text-white">★★★☆☆</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="p-3 text-slate-300">Feature Richness</td>
                      <td className="p-3 text-white">★★★★☆</td>
                      <td className="p-3 text-white">★★★★★</td>
                      <td className="p-3 text-white">★★☆☆☆</td>
                      <td className="p-3 text-white">★★☆☆☆</td>
                      <td className="p-3 text-white">★★★★☆</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="p-3 text-slate-300">Performance</td>
                      <td className="p-3 text-white">★★★★★</td>
                      <td className="p-3 text-white">★☆☆☆☆</td>
                      <td className="p-3 text-white">★★★★★</td>
                      <td className="p-3 text-white">★★★★★</td>
                      <td className="p-3 text-white">★★★☆☆</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-300">AI-Powered Insights</td>
                      <td className="p-3 text-white">★★★★★</td>
                      <td className="p-3 text-white">★★★☆☆</td>
                      <td className="p-3 text-white">★☆☆☆☆</td>
                      <td className="p-3 text-white">★☆☆☆☆</td>
                      <td className="p-3 text-white">★★☆☆☆</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
          
          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Make the Switch?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-6">
              Join thousands of businesses that have already switched to Databuddy for privacy-first, powerful analytics.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/#cta-form"
                className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Get Early Access
              </Link>
              <Link 
                href="/demo"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}