// app/PokerPilot/page.js

import React from "react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#121f17",
        color: "#ffffff",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Back Arrow Link */}
      <Link
        href="/"
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          color: "#f0c674",
          fontSize: "2rem",
          textDecoration: "none",
        }}
      >
        ⬅️
      </Link>

      <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
        {/* Logo */}
        <Image
          src="/PokerPilot/PokerPilotLogo.png"
          alt="PokerPilot Logo"
          width={150}
          height={150}
          style={{ margin: "0 auto 1.5rem auto", display: "block" }}
        />

        {/* Hero Section */}
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>Welcome to PokerPilot</h1>
        <p style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
          Instant Pre-flop Odds & Accurate Post-flop Simulations
        </p>

        {/* Side-by-Side Screenshots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
          <Image
            src="/PokerPilot/page2.png"
            alt="PokerPilot Screenshot 2"
            width={300}
            height={200}
            style={{ width: "45%", maxWidth: "300px", borderRadius: "10px" }}
          />
          <Image
            src="/PokerPilot/page3.png"
            alt="PokerPilot Screenshot 3"
            width={300}
            height={200}
            style={{ width: "45%", maxWidth: "300px", borderRadius: "10px" }}
          />
        </div>

        {/* Features Section */}
        <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Why Choose PokerPilot?</h2>
        <ul style={{ listStyleType: "none", padding: 0, fontSize: "1.125rem", lineHeight: "1.8" }}>
          <li>• Calculate pre-flop odds instantly for any number of players</li>
          <li>• Run Monte-Carlo simulations for post-flop accuracy</li>
          <li>• All computations performed locally—no internet required</li>
          <li>• Sleek, intuitive interface designed for poker enthusiasts</li>
        </ul>

        {/* Call-to-Action */}
        <a
          href="https://apps.apple.com/app/pokerpilot"
          style={{
            display: "inline-block",
            backgroundColor: "#f0c674",
            color: "#121f17",
            padding: "0.75rem 1.5rem",
            borderRadius: "5px",
            fontSize: "1.125rem",
            marginTop: "2rem",
            textDecoration: "none",
          }}
        >
          Download on the App Store
        </a>

        {/* iOS Note */}
        <p style={{ fontSize: "0.9rem", fontStyle: "italic", marginTop: "0.5rem" }}>
          (Link works on iOS devices only)
        </p>

        {/* Privacy Policy Link */}
        <p style={{ marginTop: "3rem", fontSize: "0.9rem" }}>
          <Link
            href="/PokerPilot/PrivacyPolicy"
            style={{ color: "#f0c674", textDecoration: "underline" }}
          >
            View Privacy Policy
          </Link>
        </p>

        <p style={{ marginTop: "0rem", fontSize: "0.9rem" }}>
          <Link
            href="/PokerPilot/Support"
            style={{ color: "#f0c674", textDecoration: "underline" }}
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}
