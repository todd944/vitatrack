export const DEFAULT_PROFILE = {
  sex: 'female',
  ageBand: '19-50',
  pregnant: false,
  lactating: false,
  kidneyDisease: false,
  liverDisease: false,
}

const selectStyle = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: 8,
  border: '1px solid var(--line)',
  borderRadius: 6,
}

const checkboxRowStyle = { display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }

export default function HealthProfileForm({ profile, onChange }) {
  const set = (patch) => onChange({ ...profile, ...patch })

  return (
    <div>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Sex
        <select value={profile.sex} onChange={(e) => set({ sex: e.target.value })} style={selectStyle}>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>
      </label>
      <label style={{ display: 'block', marginBottom: 4 }}>
        Age
        <select value={profile.ageBand} onChange={(e) => set({ ageBand: e.target.value })} style={selectStyle}>
          <option value="14-18">14-18</option>
          <option value="19-50">19-50</option>
          <option value="51+">51+</option>
        </select>
      </label>

      {profile.sex === 'female' && (
        <>
          <label style={checkboxRowStyle}>
            <input type="checkbox" checked={profile.pregnant} onChange={(e) => set({ pregnant: e.target.checked })} />
            <span>Currently pregnant</span>
          </label>
          <label style={checkboxRowStyle}>
            <input type="checkbox" checked={profile.lactating} onChange={(e) => set({ lactating: e.target.checked })} />
            <span>Currently breastfeeding / lactating</span>
          </label>
        </>
      )}

      <label style={checkboxRowStyle}>
        <input type="checkbox" checked={profile.kidneyDisease} onChange={(e) => set({ kidneyDisease: e.target.checked })} />
        <span>I have kidney disease</span>
      </label>
      <label style={checkboxRowStyle}>
        <input type="checkbox" checked={profile.liverDisease} onChange={(e) => set({ liverDisease: e.target.checked })} />
        <span>I have liver disease</span>
      </label>

      <p className="source-cite" style={{ marginTop: 8 }}>
        This tailors recommended amounts and safety flags throughout the app. It's saved on this device only and isn't a diagnosis.
      </p>
    </div>
  )
}
