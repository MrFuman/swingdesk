import { useState } from 'react'
import { useTrades } from '../hooks/useTrades'
import { Upload, CheckCircle, AlertCircle, Download } from 'lucide-react'

const REQUIRED_FIELDS = ['instrument', 'direction', 'entry_price', 'position_size', 'status', 'entry_date']
const ALL_FIELDS = [...REQUIRED_FIELDS, 'exit_price', 'stop_loss', 'take_profit', 'pnl', 'market', 'setup', 'notes', 'exit_date']

export default function TradeImport() {
  const { importTrades } = useTrades()
  const [step, setStep] = useState('upload')
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function parseCSV(text) {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
      return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] || '' }), {})
    })
    return { headers, rows }
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const { headers, rows } = parseCSV(ev.target.result)
        setHeaders(headers)
        setRows(rows)
        // Auto-map matching headers
        const autoMap = {}
        ALL_FIELDS.forEach(field => {
          const match = headers.find(h => h.toLowerCase().replace(/[_\s]/g, '') === field.toLowerCase().replace(/[_\s]/g, ''))
          if (match) autoMap[field] = match
        })
        setMapping(autoMap)
        setStep('map')
      } catch (err) {
        setError('Failed to parse CSV. Make sure it is a valid CSV file.')
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    setImporting(true)
    const missingRequired = REQUIRED_FIELDS.filter(f => !mapping[f])
    if (missingRequired.length > 0) {
      setError(`Missing required fields: ${missingRequired.join(', ')}`)
      setImporting(false)
      return
    }

    const trades = rows.map(row => {
      const trade = {}
      ALL_FIELDS.forEach(field => {
        if (mapping[field]) {
          const val = row[mapping[field]]
          if (['entry_price', 'exit_price', 'stop_loss', 'take_profit', 'position_size', 'pnl'].includes(field)) {
            trade[field] = val ? parseFloat(val) : null
          } else {
            trade[field] = val || null
          }
        }
      })
      return trade
    }).filter(t => t.instrument && t.entry_price)

    const { error } = await importTrades(trades)
    if (error) {
      setError(error.message)
    } else {
      setResult({ count: trades.length })
      setStep('done')
    }
    setImporting(false)
  }

  function downloadTemplate() {
    const headers = ALL_FIELDS.join(',')
    const example = 'AAPL,long,150,100,open,2024-01-15,,,145,160,,stocks,breakout,,,'
    const blob = new Blob([headers + '\n' + example], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'swingdesk_import_template.csv'
    a.click()
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', borderRadius: 9,
    padding: '7px 10px', fontSize: 12, outline: 'none',
    fontFamily: 'var(--font-sans)', width: '100%',
  }

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Import trades from any CSV file
        </p>
      </div>

      {/* Download template */}
      <div className="fade-up-1" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: 12, marginBottom: 16,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 2 }}>
            Download template
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Use our CSV template for easiest import
          </p>
        </div>
        <button onClick={downloadTemplate} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 8, fontSize: 12,
          fontWeight: 500, cursor: 'pointer', border: 'none',
          background: 'var(--accent-dim)', color: 'var(--accent)',
          fontFamily: 'var(--font-sans)',
        }}>
          <Download size={12} /> Template
        </button>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="fade-up-2" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '32px 20px', textAlign: 'center',
        }}>
          <Upload size={32} style={{ color: 'var(--text-secondary)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 6 }}>
            Upload your CSV file
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Supports exports from most brokers and trading platforms
          </p>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
            background: 'var(--accent)', color: '#000',
            fontFamily: 'var(--font-sans)',
          }}>
            <Upload size={14} /> Choose CSV file
            <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
          </label>
          {error && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 12 }}>{error}</p>}
        </div>
      )}

      {/* Step: Map columns */}
      {step === 'map' && (
        <div className="fade-up-2">
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, overflow: 'hidden', marginBottom: 14,
          }}>
            <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Map columns
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {rows.length} rows found · Match your CSV columns to SwingDesk fields
              </p>
            </div>
            <div style={{ padding: '16px 18px' }}>
              {ALL_FIELDS.map(field => (
                <div key={field} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 10, gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: REQUIRED_FIELDS.includes(field) ? 600 : 400 }}>
                      {field}
                      {REQUIRED_FIELDS.includes(field) && (
                        <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>
                      )}
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <select
                      value={mapping[field] || ''}
                      onChange={e => setMapping(m => ({ ...m, [field]: e.target.value || undefined }))}
                      style={inputStyle}>
                      <option value="">— skip —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setStep('upload'); setError('') }} style={{
              flex: 1, padding: '10px', borderRadius: 10, fontSize: 13,
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}>Back</button>
            <button onClick={handleImport} disabled={importing} style={{
              flex: 2, padding: '10px', borderRadius: 10, fontSize: 13,
              fontWeight: 600, cursor: 'pointer', border: 'none',
              background: 'var(--accent)', color: '#000',
              fontFamily: 'var(--font-sans)',
              opacity: importing ? 0.7 : 1,
            }}>
              {importing ? 'Importing...' : `Import ${rows.length} trades`}
            </button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="fade-up-2" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '40px 20px', textAlign: 'center',
        }}>
          <CheckCircle size={40} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>
            Import successful!
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
            {result?.count} trades imported successfully
          </p>
          <button onClick={() => { setStep('upload'); setRows([]); setHeaders([]); setMapping({}); setResult(null) }} style={{
            padding: '10px 24px', borderRadius: 10, fontSize: 13,
            fontWeight: 600, cursor: 'pointer', border: 'none',
            background: 'var(--accent-dim)', color: 'var(--accent)',
            fontFamily: 'var(--font-sans)',
          }}>Import more</button>
        </div>
      )}
    </div>
  )
}