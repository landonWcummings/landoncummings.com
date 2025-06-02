import React from "react";
import Link from "next/link";
import Image from "next/image";

const SupportPage = () => {
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
        href="/PokerPilot"
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

      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        {/* Logo */}
        <Image
          src="/PokerPilot/PokerPilotLogo.png"
          alt="PokerPilot Logo"
          width={120}
          height={120}
          style={{ margin: "0 auto 1.5rem auto", display: "block" }}
        />

        {/* Support Heading */}
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Need Help?</h1>
        <p style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
          For any questions, issues, or feedback, please reach out to our support team.
        </p>

        {/* Contact Card */}
        <div
          style={{
            backgroundColor: "#1f2e26",
            padding: "2rem",
            borderRadius: "10px",
            display: "inline-block",
          }}
        >
          <p style={{ fontSize: "1.125rem", marginBottom: "1rem" }}>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:lndncmmngs@gmail.com"
              style={{ color: "#f0c674", textDecoration: "none" }}
            >
              lndncmmngs@gmail.com
            </a>
          </p>
          <p style={{ fontSize: "1rem", opacity: 0.8 }}>
            Our team typically responds within 24-48 hours.
          </p>
        </div>

        {/* Footer Note */}
        <p style={{ marginTop: "3rem", fontSize: "0.9rem", opacity: 0.7 }}>
          Thank you for choosing <strong>PokerPilot</strong>. We&apos;re here to help you
          elevate your game.
        </p>
      </div>
    </div>
  );
};

export default SupportPage;
