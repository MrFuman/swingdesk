const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function MonthPicker({ value, onChange }) {
  const [year, month] = value.split('-').map(Number)

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

  function handleMonth(m) {
    const mm = String(m).padStart(2, '0')
    onChange(`${year}-${mm}`)
  }

  function handleYear(y) {
    const mm = String(month).padStart(2, '0')
    onChange(`${y}-${mm}`)
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <select
        value={month}
        onChange={e => handleMonth(e.target.value)}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-primary)', borderRadius: 9,
          padding: '6px 10px', fontSize: 12, outline: 'none',
          fontFamily: 'var(--font-sans)', cursor: 'pointer',
        }}>
        {MONTHS.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={e => handleYear(e.target.value)}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-primary)', borderRadius: 9,
          padding: '6px 10px', fontSize: 12, outline: 'none',
          fontFamily: 'var(--font-sans)', cursor: 'pointer',
        }}>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}