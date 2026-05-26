'use client';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

const CONTACT_EMAIL = 'contact.mesa@gmail.ge';
const EFFECTIVE_DATE = 'May 26, 2026';

export default function PrivacyPolicyContent() {
  const { t } = useTranslation();
  const p = (key: string) => t(`privacyPolicy.${key}`);

  const sectionIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'];

  return (
    <main className="privacy-page">
      <div className="privacy-container">
        {/* Header */}
        <div className="privacy-header">
          <Link href="/" className="privacy-wordmark">mesa</Link>
          <h1>{p('title')}</h1>
          <p className="privacy-effective">{p('effectiveDate')} {EFFECTIVE_DATE}</p>
        </div>

        {/* TOC */}
        <nav className="privacy-toc" aria-label="Table of contents">
          {sectionIds.map((id) => (
            <a key={id} href={`#${id}`}>{p(`sections.${id}`)}</a>
          ))}
        </nav>

        {/* Sections */}
        <div className="privacy-body">

          {/* 1. Who We Are */}
          <section id="s1" className="privacy-section">
            <h2>{p('sections.s1')}</h2>
            <p>{p('s1.p1')}</p>
            <p>{p('s1.p2')}</p>
          </section>

          {/* 2. Data We Collect */}
          <section id="s2" className="privacy-section">
            <h2>{p('sections.s2')}</h2>
            <p>{p('s2.intro')}</p>

            <h3>{p('s2.s21Title')}</h3>
            <ul>
              <li><strong>{p('s2.fullName')}</strong> — {p('s2.fullNameDesc')}</li>
              <li><strong>{p('s2.emailAddr')}</strong> — {p('s2.emailAddrDesc')}</li>
              <li><strong>{p('s2.password')}</strong> — {p('s2.passwordDesc')}</li>
              <li><strong>{p('s2.phone')}</strong> — {p('s2.phoneDesc')}</li>
              <li><strong>{p('s2.role')}</strong> — {p('s2.roleDesc')}</li>
            </ul>

            <h3>{p('s2.s22Title')}</h3>
            <ul>
              <li>{p('s2.guestContact')}</li>
              <li>{p('s2.dateTime')}</li>
              <li>{p('s2.notes')}</li>
              <li>{p('s2.statusHistory')}</li>
              <li>{p('s2.waitlistStatus')}</li>
            </ul>

            <h3>{p('s2.s23Title')}</h3>
            <ul>
              <li>{p('s2.reviewItem')}</li>
            </ul>

            <h3>{p('s2.s24Title')}</h3>
            <p>{p('s2.guestNotesP')}</p>

            <h3>{p('s2.s25Title')}</h3>
            <ul>
              <li>{p('s2.restaurantInfo')}</li>
              <li>{p('s2.smtpCreds')}</li>
            </ul>

            <h3>{p('s2.s26Title')}</h3>
            <ul>
              <li>{p('s2.authTokens')}</li>
              <li>{p('s2.serverLogs')}</li>
            </ul>

            <p><strong>{p('s2.noAds')}</strong></p>
          </section>

          {/* 3. Cookies & Browser Storage */}
          <section id="s3" className="privacy-section">
            <h2>{p('sections.s3')}</h2>
            <p>{p('s3.p1')}</p>
            <ul>
              <li><strong>{p('s3.authTokens')}</strong> — {p('s3.authTokensDesc')}</li>
              <li><strong>{p('s3.sessionState')}</strong> — {p('s3.sessionStateDesc')}</li>
            </ul>
            <p>{p('s3.p2')}</p>
          </section>

          {/* 4. How We Use Your Data */}
          <section id="s4" className="privacy-section">
            <h2>{p('sections.s4')}</h2>
            <table>
              <thead>
                <tr>
                  <th>{p('s4.thPurpose')}</th>
                  <th>{p('s4.thData')}</th>
                  <th>{p('s4.thBasis')}</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>{p('s4.r1Purpose')}</td><td>{p('s4.r1Data')}</td><td>{p('s4.r1Basis')}</td></tr>
                <tr><td>{p('s4.r2Purpose')}</td><td>{p('s4.r2Data')}</td><td>{p('s4.r2Basis')}</td></tr>
                <tr><td>{p('s4.r3Purpose')}</td><td>{p('s4.r3Data')}</td><td>{p('s4.r3Basis')}</td></tr>
                <tr><td>{p('s4.r4Purpose')}</td><td>{p('s4.r4Data')}</td><td>{p('s4.r4Basis')}</td></tr>
                <tr><td>{p('s4.r5Purpose')}</td><td>{p('s4.r5Data')}</td><td>{p('s4.r5Basis')}</td></tr>
                <tr><td>{p('s4.r6Purpose')}</td><td>{p('s4.r6Data')}</td><td>{p('s4.r6Basis')}</td></tr>
                <tr><td>{p('s4.r7Purpose')}</td><td>{p('s4.r7Data')}</td><td>{p('s4.r7Basis')}</td></tr>
              </tbody>
            </table>
          </section>

          {/* 5. Email Communications */}
          <section id="s5" className="privacy-section">
            <h2>{p('sections.s5')}</h2>
            <p>{p('s5.p1')}</p>
            <ul>
              <li>{p('s5.item1')}</li>
              <li>{p('s5.item2')}</li>
              <li>{p('s5.item3')}</li>
              <li>{p('s5.item4')}</li>
            </ul>
            <p>{p('s5.noMarketing')}</p>
          </section>

          {/* 6. Data Sharing */}
          <section id="s6" className="privacy-section">
            <h2>{p('sections.s6')}</h2>
            <p>{p('s6.intro')}</p>
            <ul>
              <li>
                <strong>{p('s6.r1Label')}</strong> {p('s6.r1Desc')}
              </li>
              <li>
                <strong>{p('s6.r2Label')}</strong> {p('s6.r2Desc')}
              </li>
              <li>
                <strong>{p('s6.r3Label')}</strong> {p('s6.r3LabelSuffix')} {p('s6.r3Desc')}
              </li>
              <li>
                <strong>{p('s6.r4Label')}</strong> {p('s6.r4Desc')}
              </li>
            </ul>
          </section>

          {/* 7. Data Retention */}
          <section id="s7" className="privacy-section">
            <h2>{p('sections.s7')}</h2>
            <ul>
              <li><strong>{p('s7.item1Label')}</strong> {p('s7.item1Desc')}</li>
              <li><strong>{p('s7.item2Label')}</strong> {p('s7.item2Desc')}</li>
              <li><strong>{p('s7.item3Label')}</strong> {p('s7.item3Desc')}</li>
              <li><strong>{p('s7.item4Label')}</strong> {p('s7.item4Desc')}</li>
              <li><strong>{p('s7.item5Label')}</strong> {p('s7.item5Desc')}</li>
            </ul>
          </section>

          {/* 8. Security */}
          <section id="s8" className="privacy-section">
            <h2>{p('sections.s8')}</h2>
            <p>{p('s8.intro')}</p>
            <ul>
              <li>{p('s8.item1')}</li>
              <li>{p('s8.item2')}</li>
              <li>{p('s8.item3')}</li>
              <li>{p('s8.item4')}</li>
            </ul>
            <p>
              {p('s8.note')}{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          {/* 9. Your Rights */}
          <section id="s9" className="privacy-section">
            <h2>{p('sections.s9')}</h2>
            <p>
              {p('s9.intro')}{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
            <ul>
              <li><strong>{p('s9.access')}</strong> — {p('s9.accessDesc')}</li>
              <li><strong>{p('s9.correction')}</strong> — {p('s9.correctionDesc')}</li>
              <li><strong>{p('s9.deletion')}</strong> — {p('s9.deletionDesc')}</li>
              <li><strong>{p('s9.portability')}</strong> — {p('s9.portabilityDesc')}</li>
              <li><strong>{p('s9.restriction')}</strong> — {p('s9.restrictionDesc')}</li>
              <li><strong>{p('s9.object')}</strong> — {p('s9.objectDesc')}</li>
              <li><strong>{p('s9.withdraw')}</strong> — {p('s9.withdrawDesc')}</li>
            </ul>
            <p>{p('s9.eu')}</p>
            <p>{p('s9.california')}</p>
          </section>

          {/* 10. Children */}
          <section id="s10" className="privacy-section">
            <h2>{p('sections.s10')}</h2>
            <p>
              {p('s10.p')}{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
              {p('s10.pSuffix')}
            </p>
          </section>

          {/* 11. Changes to This Policy */}
          <section id="s11" className="privacy-section">
            <h2>{p('sections.s11')}</h2>
            <p>{p('s11.p')}</p>
          </section>

          {/* 12. Contact */}
          <section id="s12" className="privacy-section">
            <h2>{p('sections.s12')}</h2>
            <p>{p('s12.intro')}</p>
            <address>
              <strong>{p('s12.name')}</strong>
              {/* TODO: add legal entity name and registered jurisdiction before going live with payments */}
              <br />
              Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </address>
          </section>

        </div>

        <footer className="privacy-footer">
          <Link href="/" className="privacy-back-btn">{p('back')}</Link>
          <span>{p('lastUpdated')} {EFFECTIVE_DATE}</span>
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
        .privacy-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 8px;
          border: 1px solid rgba(24,22,15,0.14);
          background: #fff;
          color: #18160f;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
        }
        .privacy-back-btn:hover {
          border-color: #c4410c;
          color: #c4410c;
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
