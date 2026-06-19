import LegalLayout, { LegalSection } from '../components/LegalLayout'

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" updated="June 19, 2026">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        This is a good-faith starting template. Have it reviewed by counsel before relying on it.
      </div>

      <p>These Terms govern your use of Tracque. By creating an account or using the service, you agree to them.</p>

      <LegalSection heading="1. The service">
        <p>Tracque monitors how AI engines and search engines represent your brand, tracks SEO and reputation signals, and attributes traffic to revenue. It is an analytics and observability tool.</p>
      </LegalSection>

      <LegalSection heading="2. Accounts">
        <p>You are responsible for your account credentials and for activity under your account. Provide accurate information and keep it current.</p>
      </LegalSection>

      <LegalSection heading="3. Acceptable use">
        <p>Don’t use Tracque to break the law, infringe others’ rights, scrape or attack third-party systems unlawfully, or attempt to access data that isn’t yours. Don’t resell the service except under an authorized agency/white-label plan.</p>
      </LegalSection>

      <LegalSection heading="4. Plans & billing">
        <p>Paid plans are billed in advance on a recurring basis and renew until cancelled. Fees are non-refundable except where required by law. We may change pricing with notice; changes apply at your next renewal.</p>
      </LegalSection>

      <LegalSection heading="5. Your data">
        <p>You own the brands, keywords, and business facts you provide and the analytics you instrument. You grant us the limited rights needed to operate the service for you. We handle your data per our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.</p>
      </LegalSection>

      <LegalSection heading="6. Accuracy & no guarantees">
        <p>AI engines are probabilistic and change over time. Tracque reports directional intelligence with confidence intervals, not a census of every AI conversation, and does not guarantee any particular AI output, ranking, or business result. Tracque is monitoring-only and does not make lending, pricing, or other automated decisions on your behalf.</p>
      </LegalSection>

      <LegalSection heading="7. Disclaimers & liability">
        <p>The service is provided “as is” without warranties of any kind. To the maximum extent permitted by law, Tracque is not liable for indirect or consequential damages, and our total liability is limited to the amount you paid us in the 12 months before the claim.</p>
      </LegalSection>

      <LegalSection heading="8. Termination">
        <p>You may cancel anytime. We may suspend or terminate accounts that violate these Terms. On termination, your right to use the service ends; you may request an export of your data first.</p>
      </LegalSection>

      <LegalSection heading="9. Changes & governing law">
        <p>We may update these Terms; material changes will be posted here. These Terms are governed by the laws of the jurisdiction in which Tracque is established, without regard to conflict-of-law rules.</p>
      </LegalSection>
    </LegalLayout>
  )
}
