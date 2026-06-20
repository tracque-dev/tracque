import LegalLayout, { LegalSection } from '../components/LegalLayout'

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 19, 2026">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-400">
        This is a good-faith starting template. Have it reviewed by counsel before relying on it for compliance (GDPR, CCPA, etc.).
      </div>

      <p>Tracque (“we”, “us”) provides an AI-visibility, SEO, reputation, and revenue-attribution platform. This policy explains what we collect, how we use it, and your choices. It applies to tracque.com and the Tracque application.</p>

      <LegalSection heading="1. Information we collect">
        <p>• <span className="text-foreground font-medium">Account data</span> — name, email, and authentication identifiers when you sign up.</p>
        <p>• <span className="text-foreground font-medium">Workspace data you provide</span> — brands, domains, keywords, published rates/hours, and similar business facts you enter to be monitored.</p>
        <p>• <span className="text-foreground font-medium">Analytics you instrument</span> — when you install our tracking snippet on your site, we collect aggregate visit and conversion events (source, UTM, referrer, page, anonymous visitor id). We do not require or request end-user names, emails, or payment details through the snippet.</p>
        <p>• <span className="text-foreground font-medium">Usage & device data</span> — log data, IP, and browser metadata used to operate and secure the service.</p>
      </LegalSection>

      <LegalSection heading="2. How we use it">
        <p>To provide the service (run AI/SEO/reputation scans, compute attribution and reports), to secure and improve the product, to communicate with you, and to meet legal obligations. We do not use your data to train any third-party AI model.</p>
      </LegalSection>

      <LegalSection heading="3. Third-party processors">
        <p>We share data with infrastructure and data providers strictly to deliver the service, under their respective terms: Supabase (database, auth, hosting), Vercel (frontend hosting), OpenAI and other AI engines (visibility queries), DataForSEO and SerpAPI (search/SEO/business data), and an error-monitoring provider. We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection heading="4. Data retention">
        <p>We retain workspace and analytics data for as long as your account is active and as needed to provide the service. You may request deletion at any time; we will delete or anonymize data except where retention is legally required.</p>
      </LegalSection>

      <LegalSection heading="5. Security">
        <p>Data is tenant-isolated with row-level security, encrypted in transit, and access is restricted. No system is perfectly secure, but we work to protect your data and will notify you of material breaches as required by law.</p>
      </LegalSection>

      <LegalSection heading="6. Your rights">
        <p>Depending on your jurisdiction, you may have rights to access, correct, export, or delete your personal data, and to object to or restrict certain processing. Contact us to exercise them.</p>
      </LegalSection>

      <LegalSection heading="7. Cookies">
        <p>We use essential cookies for authentication and session management. Our own marketing analytics are first-party and aggregate.</p>
      </LegalSection>

      <LegalSection heading="8. Children">
        <p>Tracque is a business tool not directed to children under 16, and we do not knowingly collect their data.</p>
      </LegalSection>

      <LegalSection heading="9. Changes">
        <p>We may update this policy; material changes will be posted here with a new “last updated” date.</p>
      </LegalSection>
    </LegalLayout>
  )
}
