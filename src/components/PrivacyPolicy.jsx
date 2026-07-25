export default function PrivacyPolicy({ onBack }) {
  return (
    <div style={{ padding: 16 }}>
      <button className="btn-secondary" style={{ marginBottom: 12 }} onClick={onBack}>‹ Back</button>
      <h2>Privacy Policy</h2>
      <div className="card severity-caution" style={{ fontSize: 13 }}>
        <strong>Prototype draft.</strong> This document was generated for development purposes and has not
        been reviewed by an attorney. Replace it with counsel-reviewed terms — and revisit this whole
        policy — before any accounts/cloud-sync layer is added.
      </div>

      <div className="card">
        <h3>1. Overview</h3>
        <p>This policy covers what VitaTrack collects and how it's used, in plain language.</p>

        <h3>2. Information we collect</h3>
        <p>
          <strong>Health profile:</strong> sex, age band, pregnancy status, breastfeeding/lactation status,
          and whether you have kidney or liver disease.<br />
          <strong>Supplement schedule:</strong> which supplements you've added, chosen dosages, and which
          days you take them.<br />
          <strong>Medications:</strong> any medication names you type in.<br />
          <strong>Wellness log:</strong> mood, energy, and notes you choose to record.
        </p>

        <h3>3. How it's used</h3>
        <p>
          Solely to personalize recommended amounts, upper-limit warnings, and interaction/safety flags
          within the app. It is not analyzed, sold, or used for advertising.
        </p>

        <h3>4. Where it's stored</h3>
        <p>
          Everything you enter is saved in this browser's local storage, on this device only — it survives
          closing the tab or restarting the browser, but it isn't sent to or stored on any server we
          operate, there's no account, and it doesn't sync to any other device. Clearing your browser's site
          data, or using the "Clear all data" button on the Profile tab, deletes it completely and
          immediately. If an account/cloud-sync layer is added later, this policy will be updated first, and
          you'll be asked to consent again before anything leaves this device.
        </p>

        <h3>5. Third-party sharing</h3>
        <p>
          The "Check for recalls" feature (Interactions tab) sends the name of the supplement you tap to
          the public openFDA API (api.fda.gov), a U.S. government service, so it can search for matching
          recalls. The medication search (Interactions tab) sends what you type to the NIH's public RxNorm
          API (rxnav.nlm.nih.gov) to suggest real medication names as you type. No other data is shared with
          any third party.
        </p>

        <h3>6. Your choices</h3>
        <p>
          Use the "Clear all data" button on the Profile tab, or clear this site's data in your browser
          settings, to delete everything immediately. There's no account to delete because no account
          currently exists.
        </p>

        <h3>7. Children's privacy</h3>
        <p>This app isn't knowingly directed to, or collecting data from, children under 13.</p>

        <h3>8. Changes to this policy</h3>
        <p>We'll update this page if what we collect or how we use it changes.</p>

        <h3>9. Contact</h3>
        <p>Contact details to be added before public launch.</p>
      </div>
    </div>
  )
}
