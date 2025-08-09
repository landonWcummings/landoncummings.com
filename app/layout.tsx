import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Landon Cummings - AI Engineer & Software Developer Portfolio",
  description: "Landon Cummings portfolio website featuring AI projects, machine learning applications, web development, and interactive simulations. Experience n-body physics simulations, AI-powered games, quantitative finance tools, and more innovative software solutions.",
  keywords: [
    "Landon Cummings",
    "AI engineer",
    "machine learning",
    "software developer",
    "portfolio",
    "n-body simulation",
    "physics simulation",
    "artificial intelligence",
    "web development",
    "React",
    "Next.js",
    "JavaScript",
    "Python",
    "data science",
    "quantitative finance",
    "game AI",
    "computer science",
    "programming",
    "interactive simulations",
    "reinforcement learning",
    "neural networks",
    "algorithm development",
    "software engineering",
    "full stack developer",
    "computer graphics",
    "scientific computing",
    "NEAT algorithm",
    "Connect4 AI",
    "2048 AI",
    "poker analysis",
    "investment analysis",
    "message analytics",
    "GPT implementation"
  ],
  authors: [{ name: "Landon Cummings" }],
  creator: "Landon Cummings",
  publisher: "Landon Cummings",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://landoncummings.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Landon Cummings - AI Engineer & Software Developer Portfolio",
    description: "Explore cutting-edge AI projects, interactive simulations, and innovative software solutions by Landon Cummings. Featured projects include n-body physics simulations, AI game bots, quantitative finance tools, and machine learning applications.",
    url: "https://landoncummings.com",
    siteName: "Landon Cummings Portfolio",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/LCfancylogo.png",
        width: 1200,
        height: 630,
        alt: "Landon Cummings Portfolio - AI Engineer & Software Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Landon Cummings - AI Engineer & Software Developer",
    description: "Portfolio showcasing AI projects, physics simulations, and innovative software solutions",
    images: ["/LCfancylogo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code-here", // You can add your actual verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data for SEO */}
        <Script id="structured-data" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Landon Cummings",
              "jobTitle": "AI Engineer & Software Developer",
              "description": "AI Engineer and Software Developer specializing in machine learning, web development, and interactive simulations",
              "url": "https://landoncummings.com",
              "sameAs": [
                "https://github.com/landonWcummings",
                "https://linkedin.com/in/landon-cummings"
              ],
              "knowsAbout": [
                "Artificial Intelligence",
                "Machine Learning",
                "Software Development",
                "Physics Simulation",
                "Web Development",
                "Python Programming",
                "JavaScript Programming",
                "React Development",
                "Next.js",
                "Data Science",
                "Quantitative Finance",
                "Game AI Development",
                "Neural Networks",
                "Reinforcement Learning",
                "Algorithm Development"
              ],
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://landoncummings.com"
              }
            }
          `}
        </Script>
        
        {/* Project Portfolio Structured Data */}
        <Script id="portfolio-data" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              "name": "Landon Cummings Portfolio",
              "description": "Interactive portfolio showcasing AI projects, physics simulations, and software development work",
              "creator": {
                "@type": "Person",
                "name": "Landon Cummings"
              },
              "hasPart": [
                {
                  "@type": "SoftwareApplication",
                  "name": "N-Body Physics Simulation",
                  "description": "Real-time gravitational physics simulation with interactive controls and visual effects",
                  "applicationCategory": "Simulation Software",
                  "operatingSystem": "Web Browser"
                },
                {
                  "@type": "SoftwareApplication", 
                  "name": "AI Game Collection",
                  "description": "Collection of AI-powered games including Snake AI with NEAT algorithm, Connect4 bot, and 2048 AI",
                  "applicationCategory": "Game",
                  "operatingSystem": "Web Browser"
                },
                {
                  "@type": "SoftwareApplication",
                  "name": "Quantitative Investment Analysis Tool",
                  "description": "Financial analysis platform using advanced quantitative models for investment research",
                  "applicationCategory": "Finance Software",
                  "operatingSystem": "Web Browser"
                },
                {
                  "@type": "SoftwareApplication",
                  "name": "iMessage Analysis App",
                  "description": "Advanced analytics tool for iMessage conversations with data visualization",
                  "applicationCategory": "Analytics Software",
                  "operatingSystem": "macOS"
                }
              ]
            }
          `}
        </Script>

        {/* Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XZGGYTXKTB"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XZGGYTXKTB');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
