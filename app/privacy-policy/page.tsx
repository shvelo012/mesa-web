import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Mesa",
  description: "How Mesa collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "May 26, 2026";
const CONTACT_EMAIL = "contact.mesa@gmail.ge";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "overview",
    title: "1. Who We Are",
    content: (
      <>
        <p>
          Mesa (&ldquo;Mesa&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates a restaurant
          reservation platform that connects diners with restaurants. This Privacy Policy explains what personal data we
          collect, why we collect it, how we use it, and your rights over it.
        </p>
        <p>
          By using Mesa you agree to the practices described here. If you disagree, do not use the service.
        </p>
      </>
    ),
  },
  {
    id: "data-collected",
    title: "2. Data We Collect",
    content: (
      <>
        <p>We collect data in three ways: data you give us, data created by your use of the service, and data restaurants share with us about you.</p>

        <h3>2.1 Account data (registered users)</h3>
        <ul>
          <li><strong>Full name</strong> — used to identify you across the platform.</li>
          <li><strong>Email address</strong> — account login, email verification, and transactional notifications.</li>
          <li><strong>Password</strong> — stored as a bcrypt hash; we never store or transmit it in plain text.</li>
          <li><strong>Phone number</strong> (optional) — used for reservation contact.</li>
          <li><strong>Account role</strong> — whether you are a diner or a restaurant owner.</li>
        </ul>

        <h3>2.2 Reservation &amp; waitlist data</h3>
        <ul>
          <li>Guest name, email address, and phone number (even for guests without an account).</li>
          <li>Reservation date, time, and party size.</li>
          <li>Special notes or requests you add to a reservation.</li>
          <li>Reservation status history (pending, confirmed, seated, cancelled, no-show, completed).</li>
          <li>Waitlist position and status.</li>
        </ul>

        <h3>2.3 Reviews</h3>
        <ul>
          <li>Star rating and written review text you submit for a restaurant.</li>
        </ul>

        <h3>2.4 Guest notes (restaurant-side)</h3>
        <p>
          Restaurant staff may attach internal notes to a guest&apos;s email address (e.g. dietary preferences, VIP
          status). These notes are visible only to staff of that restaurant and to us as the platform operator.
        </p>

        <h3>2.5 Restaurant owner data</h3>
        <ul>
          <li>Restaurant name, address, phone, email, cuisine type, and operating hours.</li>
          <li>SMTP credentials for custom email sending (stored encrypted at rest).</li>
        </ul>

        <h3>2.6 Technical data</h3>
        <ul>
          <li>JWT authentication tokens stored locally in your browser.</li>
          <li>Standard server logs (IP address, timestamp, request path) retained for up to 30 days.</li>
        </ul>

        <p>
          <strong>We do not use third-party analytics, advertising pixels, or tracking cookies.</strong>
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Data",
    content: (
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Data used</th>
            <th>Legal basis (GDPR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Create and manage your account</td>
            <td>Name, email, password, phone, role</td>
            <td>Contract</td>
          </tr>
          <tr>
            <td>Process reservations &amp; waitlist entries</td>
            <td>Guest contact details, date/time, party size, notes</td>
            <td>Contract</td>
          </tr>
          <tr>
            <td>Send transactional emails</td>
            <td>Email, name — reservation status, verification, password change alerts</td>
            <td>Contract</td>
          </tr>
          <tr>
            <td>Display and moderate reviews</td>
            <td>Star rating, review text, user identity</td>
            <td>Legitimate interest</td>
          </tr>
          <tr>
            <td>Allow restaurants to manage guests</td>
            <td>Guest notes keyed to email</td>
            <td>Legitimate interest</td>
          </tr>
          <tr>
            <td>Security &amp; fraud prevention</td>
            <td>Server logs, account activity</td>
            <td>Legitimate interest</td>
          </tr>
          <tr>
            <td>Legal compliance</td>
            <td>Any data required by applicable law</td>
            <td>Legal obligation</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "email",
    title: "4. Email Communications",
    content: (
      <>
        <p>We send the following transactional emails. They cannot be unsubscribed from while you have an active account, as they are necessary to operate the service:</p>
        <ul>
          <li>Email address verification on sign-up.</li>
          <li>Reservation confirmation, rejection, or status change.</li>
          <li>Waitlist notifications.</li>
          <li>Password-change security alerts.</li>
        </ul>
        <p>We do not send marketing emails. If that changes, we will ask for your explicit consent first.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "5. Data Sharing",
    content: (
      <>
        <p>We do <strong>not</strong> sell your personal data. We share data only in these limited cases:</p>
        <ul>
          <li>
            <strong>With restaurants you interact with.</strong> When you make a reservation or join a waitlist at a
            restaurant, that restaurant&apos;s staff can see your name, contact details, party size, notes, and
            reservation history within their venue.
          </li>
          <li>
            <strong>With hosting &amp; infrastructure providers.</strong> Our database and server run on cloud
            infrastructure. These providers process data solely on our instructions and under data processing agreements.
          </li>
          <li>
            <strong>With your SMTP provider</strong> (restaurant owners only). If you configure a custom SMTP server,
            emails are routed through it. We are not responsible for that provider&apos;s privacy practices.
          </li>
          <li>
            <strong>When required by law.</strong> We may disclose data if compelled by a valid legal order.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    title: "6. Data Retention",
    content: (
      <ul>
        <li>
          <strong>Active accounts:</strong> retained until you delete your account.
        </li>
        <li>
          <strong>Reservations &amp; waitlist:</strong> retained for 2 years after the reservation date to support
          dispute resolution, then deleted.
        </li>
        <li>
          <strong>Reviews:</strong> retained until you delete the review or your account is deleted.
        </li>
        <li>
          <strong>Server logs:</strong> retained for 30 days, then automatically purged.
        </li>
        <li>
          <strong>Deleted accounts:</strong> personal data is removed within 30 days of deletion. Anonymised
          aggregate data (e.g. reservation counts) may be retained indefinitely.
        </li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "7. Security",
    content: (
      <>
        <p>We take reasonable technical measures to protect your data:</p>
        <ul>
          <li>Passwords hashed with bcrypt (cost factor 12).</li>
          <li>Authentication via short-lived JWT access tokens and rotating refresh tokens.</li>
          <li>SMTP credentials stored encrypted at rest.</li>
          <li>HTTPS enforced in transit.</li>
        </ul>
        <p>
          No system is perfectly secure. If you suspect unauthorised access to your account, change your password
          immediately and contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "8. Your Rights",
    content: (
      <>
        <p>
          Depending on your location, you may have the following rights over your personal data. Submit requests to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <ul>
          <li>
            <strong>Access</strong> — request a copy of the data we hold about you.
          </li>
          <li>
            <strong>Correction</strong> — ask us to fix inaccurate data.
          </li>
          <li>
            <strong>Deletion</strong> — request deletion of your account and personal data (subject to legal
            retention obligations).
          </li>
          <li>
            <strong>Portability</strong> — receive your data in a structured, machine-readable format.
          </li>
          <li>
            <strong>Restriction</strong> — ask us to pause processing while a dispute is resolved.
          </li>
          <li>
            <strong>Object</strong> — object to processing based on legitimate interest.
          </li>
          <li>
            <strong>Withdraw consent</strong> — where processing is based on consent, withdraw it at any time without
            affecting prior processing.
          </li>
        </ul>
        <p>
          EU/EEA residents: if you believe we have violated your rights under GDPR, you have the right to lodge a
          complaint with your local supervisory authority.
        </p>
        <p>
          California residents: under CCPA you have rights to know, delete, and opt out of the sale of personal
          information. We do not sell personal information.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "9. Children",
    content: (
      <p>
        Mesa is not directed at children under 16. We do not knowingly collect personal data from anyone under 16. If
        you believe a child has provided us data, contact{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will delete it promptly.
      </p>
    ),
  },
  {
    id: "changes",
    title: "10. Changes to This Policy",
    content: (
      <p>
        We may update this policy. When we do, we&apos;ll update the effective date below and, for material changes,
        notify registered users by email. Continued use after notice constitutes acceptance.
      </p>
    ),
  },
  {
    id: "contact",
    title: "11. Contact",
    content: (
      <>
        <p>Questions or requests about this policy:</p>
        <address>
          <strong>Mesa</strong>
          <br />
          Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </address>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-page">
      <div className="privacy-container">
        {/* Header */}
        <div className="privacy-header">
          <Link href="/" className="privacy-wordmark">mesa</Link>
          <h1>Privacy Policy</h1>
          <p className="privacy-effective">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        {/* TOC */}
        <nav className="privacy-toc" aria-label="Table of contents">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>{s.title}</a>
          ))}
        </nav>

        {/* Sections */}
        <div className="privacy-body">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="privacy-section">
              <h2>{s.title}</h2>
              {s.content}
            </section>
          ))}
        </div>

        <footer className="privacy-footer">
          <Link href="/">← Back to Mesa</Link>
          <span>Last updated: {EFFECTIVE_DATE}</span>
        </footer>
      </div>

      <style>{`
        .privacy-page {
          background: #f5f3ef;
          min-height: 100vh;
          padding: 48px 16px 80px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #18160f;
        }
        .privacy-container {
          max-width: 760px;
          margin: 0 auto;
        }

        /* Header */
        .privacy-header {
          margin-bottom: 40px;
        }
        .privacy-wordmark {
          display: inline-block;
          font-size: 22px;
          font-weight: 700;
          color: #c4410c;
          letter-spacing: -0.02em;
          text-decoration: none;
          margin-bottom: 24px;
        }
        .privacy-header h1 {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.1;
          color: #18160f;
        }
        .privacy-effective {
          margin-top: 8px;
          font-size: 13px;
          color: #9a9088;
        }

        /* TOC */
        .privacy-toc {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #fff;
          border: 1px solid rgba(24,22,15,0.09);
          border-radius: 10px;
          padding: 20px 24px;
          margin-bottom: 40px;
        }
        .privacy-toc a {
          font-size: 13px;
          color: #5c5248;
          text-decoration: none;
          padding: 3px 0;
          transition: color 0.15s;
        }
        .privacy-toc a:hover {
          color: #c4410c;
        }

        /* Body */
        .privacy-section {
          margin-bottom: 48px;
          scroll-margin-top: 24px;
        }
        .privacy-section h2 {
          font-size: 18px;
          font-weight: 700;
          color: #18160f;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(24,22,15,0.09);
        }
        .privacy-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #18160f;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        .privacy-section p {
          font-size: 14px;
          line-height: 1.75;
          color: #5c5248;
          margin-bottom: 12px;
        }
        .privacy-section ul {
          padding-left: 20px;
          margin-bottom: 12px;
        }
        .privacy-section li {
          font-size: 14px;
          line-height: 1.75;
          color: #5c5248;
          margin-bottom: 4px;
        }
        .privacy-section a {
          color: #c4410c;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .privacy-section address {
          font-style: normal;
          font-size: 14px;
          line-height: 1.75;
          color: #5c5248;
          margin-top: 8px;
        }

        /* Table */
        .privacy-section table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin: 8px 0;
        }
        .privacy-section th {
          background: rgba(24,22,15,0.04);
          text-align: left;
          padding: 10px 14px;
          font-weight: 600;
          color: #18160f;
          border: 1px solid rgba(24,22,15,0.09);
        }
        .privacy-section td {
          padding: 10px 14px;
          color: #5c5248;
          border: 1px solid rgba(24,22,15,0.09);
          vertical-align: top;
          line-height: 1.6;
        }
        .privacy-section tr:nth-child(even) td {
          background: #fafaf8;
        }

        /* Footer */
        .privacy-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 32px;
          border-top: 1px solid rgba(24,22,15,0.09);
          font-size: 13px;
          color: #9a9088;
          flex-wrap: wrap;
          gap: 8px;
        }
        .privacy-footer a {
          color: #c4410c;
          text-decoration: none;
        }
        .privacy-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .privacy-section table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </main>
  );
}
