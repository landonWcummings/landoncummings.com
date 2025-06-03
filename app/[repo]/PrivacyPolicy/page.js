import Link from "next/link";

export default async function PrivacyPolicy({ params }) {
  const { repo } = await params;
  if (repo.toLowerCase() !== "pokerpilot") {
    return null;
  }

  const { repo: repoName } = await params;


  return (
    <div
      style={{
        backgroundColor: "#121f17",
        color: "#ffffff",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link
        href={`/${repoName}`}
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

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1
          style={{
            borderBottom: "2px solid #ffffff",
            paddingBottom: "0.5rem",
            textAlign: "center",
            fontSize: "3rem",
          }}
        >
          PokerPilot – Privacy Policy
        </h1>
        <p
          style={{
            marginTop: "1rem",
            fontStyle: "italic",
            textAlign: "center",
            fontSize: "1.1rem",
          }}
        >
          <strong>Effective Date:</strong> 2 June 2025
        </p>

        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            marginTop: "1.5rem",
          }}
        >
          Thank you for choosing <strong>PokerPilot</strong> (the “App”). We respect your
          privacy. This Privacy Policy explains what information we (the “Developer,” “we,”
          “our,” or “us”) collect when you use PokerPilot, how we use it, and the choices you
          have. We have designed PokerPilot so that it <strong>does not collect, store, or
          transmit any personal data</strong>. The App performs all poker-hand simulations
          entirely on your device, without connecting to external servers.
        </p>

        <hr style={{ borderColor: "#ffffff", margin: "2rem 0" }} />

        <h2
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: "2rem",
          }}
        >
          1  Scope
        </h2>
        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            margin: "1rem 0",
          }}
        >
          This Privacy Policy applies to all users of PokerPilot on iOS, iPadOS, and/or
          macOS who download the App through Apple App Store. By using the App, you agree
          to the terms described herein.
        </p>

        <h2
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: "2rem",
          }}
        >
          2  Information We Collect
        </h2>
        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            margin: "1rem 0",
          }}
        >
          PokerPilot is a self-contained simulation tool. <strong>We do not collect or
          process any of the following:</strong>
        </p>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            margin: "1rem auto",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Category
              </th>
              <th
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Examples
              </th>
              <th
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Collection Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Personal Identifiers
              </td>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Name, email address, device ID
              </td>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Not collected
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Usage Data
              </td>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Analytics, crash logs, diagnostic data
              </td>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Not collected
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Financial Information
              </td>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Credit-card, payment details
              </td>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Not collected
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Location Information
              </td>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Precise or coarse location
              </td>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Not collected
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Contacts &amp; Photos
              </td>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                Address book, camera roll
              </td>
              <td
                style={{
                  border: "1px solid #ffffff",
                  padding: "0.5rem",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Not collected
              </td>
            </tr>
          </tbody>
        </table>

        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            margin: "1rem 0",
          }}
        >
          PokerPilot does not integrate third-party SDKs, advertising frameworks, social
          plug-ins, or cloud back-ends. All hand-range calculations and Monte-Carlo
          simulations occur locally on the device’s CPU/GPU.
        </p>

        <h2
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: "2rem",
          }}
        >
          3  How We Use Information
        </h2>
        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            margin: "1rem 0",
          }}
        >
          Because we do not collect any personal information, no personal information is
          used. Aggregate statistical outputs (e.g., hand-equity percentages) are displayed
          on your device solely for your reference and are not transmitted elsewhere.
        </p>

        <h2
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: "2rem",
          }}
        >
          4  Data Sharing and Disclosure
        </h2>
        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            margin: "1rem 0",
          }}
        >
          Since no data is collected, <strong>no data is shared</strong> with any third
          parties, including analytic providers, advertisers, or affiliates. We will
          disclose information only if required by law and only to the extent such
          information exists.
        </p>

        <h2
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: "2rem",
          }}
        >
          5  Security
        </h2>
        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            margin: "1rem 0",
          }}
        >
          Although PokerPilot does not handle personal data, we employ standard Apple
          platform security features (App Signing, Sandboxing, and Gatekeeper on macOS) to
          protect the integrity of the App binary. All computations remain offline.
        </p>

        <h2
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: "2rem",
          }}
        >
          6  Children’s Privacy
        </h2>
        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            margin: "1rem 0",
          }}
        >
          PokerPilot is rated <strong>17+</strong> on the App Store due to simulated
          gambling content. The App is <strong>not intended for children under 13 years
          of age</strong>. We do not knowingly collect personal information from anyone,
          including children. If you believe a child has provided us with personal data,
          please contact us (see Section 9).
        </p>

        <h2
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: "2rem",
          }}
        >
          7  Responsible Gambling Notice
        </h2>
        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            margin: "1rem 0",
          }}
        >
          PokerPilot is an educational and entertainment tool that uses statistical
          simulations to illustrate poker probabilities. It <strong>does not enable,
          facilitate, or encourage real-money wagering</strong>. If you choose to
          participate in real-money poker, please gamble responsibly. For help, visit
          resources such as{" "}
          <a href="https://www.begambleaware.org/" style={{ color: "#f0c674" }}>
            BeGambleAware.org
          </a>{" "}
          or call your local helpline.
        </p>

        <h2
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: "2rem",
          }}
        >
          8  Changes to This Privacy Policy
        </h2>
        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            margin: "1rem 0",
          }}
        >
          We may update this Privacy Policy from time to time to reflect changes in
          legal requirements or app functionality. If changes are material, we will post
          the updated policy in the App’s settings screen and on our website, and update
          the “Effective Date” above. Continued use of the App after an update
          constitutes acceptance of the revised policy.
        </p>

        <h2
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: "2rem",
          }}
        >
          9  Contact Us
        </h2>
        <p
          style={{
            textAlign: "center",
            fontSize: "1rem",
            margin: "1rem 0",
          }}
        >
          If you have questions or concerns about this Privacy Policy or your privacy
          when using PokerPilot, please contact:
        </p>
        <blockquote
          style={{
            borderLeft: "5px solid #ffffff",
            margin: "1rem auto",
            paddingLeft: "1rem",
            maxWidth: "600px",
          }}
        >
          <p style={{ textAlign: "center", margin: "0" }}>
            <strong>PokerPilot Support</strong>
          </p>
          <p style={{ textAlign: "center", margin: "0" }}>
            Email:{" "}
            <a
              href="mailto:lndncmmngs@gmail.com"
              style={{ color: "#f0c674" }}
            >
              lndncmmngs@gmail.com
            </a>
          </p>
        </blockquote>

        <p
          style={{
            textAlign: "center",
            marginTop: "2rem",
            fontStyle: "italic",
            fontSize: "0.9rem",
          }}
        >
          *This Privacy Policy is provided for submission to Apple in accordance with
          App Store Review Guideline 5.1.*
        </p>
      </div>
    </div>
  );
}
