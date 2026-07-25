export default function TermsOfService({ onBack }) {
  return (
    <div style={{ padding: 16 }}>
      <button className="btn-secondary" style={{ marginBottom: 12 }} onClick={onBack}>‹ Back</button>
      <h2>Terms of Service</h2>
      <div className="card severity-caution" style={{ fontSize: 13 }}>
        <strong>Prototype draft.</strong> This document was generated for development purposes and has not
        been reviewed by an attorney. Replace it with counsel-reviewed terms before real users rely on this app.
      </div>

      <div className="card">
        <h3>1. Acceptance of terms</h3>
        <p>By using VitaTrack, you agree to these terms. If you don't agree, don't use the app.</p>

        <h3>2. What this app is</h3>
        <p>
          VitaTrack is a personal scheduling and tracking tool for vitamins, minerals, and herbal
          supplements. It surfaces general reference information and flags well-documented interaction
          concerns based on a small, curated dataset. It is not a medical device, and it does not diagnose,
          treat, cure, or prevent any disease.
        </p>

        <h3>3. Not medical advice</h3>
        <p>
          Nothing in this app is medical, pharmacy, or professional health advice. Always talk to your
          doctor or pharmacist before starting, stopping, or changing any supplement or medication.
          In a medical emergency, call 911 (US). For a suspected supplement or medication overdose,
          contact Poison Control at 1-800-222-1222 (US) — not this app.
        </p>

        <h3>4. Not evaluated by the FDA</h3>
        <p>
          Statements about dietary supplements in this app have not been evaluated by the U.S. Food and
          Drug Administration.
        </p>

        <h3>5. Content sourcing</h3>
        <p>
          Reference content is adapted from public NIH Office of Dietary Supplements and NIH NCCIH fact
          sheets, but has not been independently verified against the current published fact sheets at the
          time you use the app. This app is not produced, reviewed, or endorsed by NIH or any government
          agency.
        </p>

        <h3>6. Your responsibilities</h3>
        <p>
          You're responsible for the accuracy of the information you enter and for confirming anything
          this app surfaces with a qualified professional before acting on it.
        </p>

        <h3>7. No warranty</h3>
        <p>
          This app is provided "as is" and "as available," without warranty of any kind, express or
          implied, including accuracy, completeness, or fitness for a particular purpose.
        </p>

        <h3>8. Limitation of liability</h3>
        <p>
          To the maximum extent permitted by law, VitaTrack and its developers are not liable for any
          damages arising from your use of, or inability to use, this app.
        </p>

        <h3>9. Third-party services</h3>
        <p>
          The "Check for recalls" feature sends the supplement name you're checking to the public
          openFDA API (api.fda.gov), which is governed by the FDA's own terms of use.
        </p>

        <h3>10. Children</h3>
        <p>
          This app isn't directed to children under 13. If a minor uses it, a parent or guardian should
          supervise.
        </p>

        <h3>11. Changes</h3>
        <p>These terms may change as the app develops. Continued use after changes means you accept them.</p>

        <h3>12. Governing law</h3>
        <p>To be determined before public launch.</p>
      </div>
    </div>
  )
}
