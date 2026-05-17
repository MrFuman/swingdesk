import { useState } from 'react'
import { useTradeTags } from '../hooks/useTradeTags'
import { Trash2, Plus, Check } from 'lucide-react'

const COLORS = ['#22c55e','#ef4444','#6366f1','#f59e0b','#06b6d4','#ec4899','#8b5cf6','#f97316','#14b8a6']

export default function TagManager() {
  const { tags, loading, addTag, deleteTag, updateTag } = useTradeTags()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!newName.trim()) { setError('Tag name required'); return }
    setSaving(true)
    const { error } = await addTag(newName.trim(), newColor)
    if (error) setError(error.message)
    else { setNewName(''); setError('') }
    setSaving(false)
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', borderRadius: 9,
    padding: '8px 12px', fontSize: 13, outline: 'none',
    fontFamily: 'var(--font-sans)',
  }

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {tags.length} tags · used for filtering trades
        </p>
      </div>

      {/* Add new tag */}
      <div className="fade-up-1" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14,
      }}>
        <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
          New Tag
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <input type="text" placeholder="Tag name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ ...inputStyle, flex: 1 }} />
          <button onClick={handleAdd} disabled={saving} style={{
            padding: '8px 14px', borderRadius: 9, fontSize: 13,
            fontWeight: 600, cursor: 'pointer', border: 'none',
            background: 'var(--accent)', color: '#000',
            fontFamily: 'var(--font-sans)', flexShrink: 0,
          }}>
            <Plus size={14} />
          </button>
        </div>
        {/* Color picker */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setNewColor(c)} style={{
              width: 24, height: 24, borderRadius: '50%',
              background: c, border: `2px solid ${newColor === c ? '#fff' : 'transparent'}`,
              cursor: 'pointer', outline: 'none',
              boxShadow: newColor === c ? `0 0 0 2px ${c}` : 'none',
              transition: 'all 0.15s', flexShrink: 0,
            }} />
          ))}
        </div>
        {error && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{error}</p>}
      </div>

      {/* Tags list */}
      <div className="fade-up-2" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Your Tags
          </p>
        </div>
        {loading && <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>Loading...</p>}
        {!loading && tags.length === 0 && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>No tags yet.</p>
        )}
        {tags.map((tag, i) => (
          <div key={tag.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: i < tags.length - 1 ? '1px solid var(--border)' : 'none',
            transition: 'background 0.1s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: tag.color, flexShrink: 0,
              }} />
              <span style={{
                fontSize: 13, color: 'var(--text-primary)',
                padding: '3px 10px', borderRadius: 6,
                background: `${tag.color}18`,
                border: `1px solid ${tag.color}35`,
              }}>{tag.name}</span>
            </div>
            <button onClick={() => deleteTag(tag.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', padding: 2,
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}