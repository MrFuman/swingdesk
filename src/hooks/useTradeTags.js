import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const DEFAULT_TAGS = [
  { name: 'Breakout', color: '#22c55e' },
  { name: 'Pullback', color: '#6366f1' },
  { name: 'Reversal', color: '#f59e0b' },
  { name: 'Trend follow', color: '#06b6d4' },
  { name: 'Scalp', color: '#ec4899' },
  { name: 'Swing', color: '#8b5cf6' },
]

export function useTradeTags() {
  const { user } = useAuth()
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchTags()
  }, [user])

  async function fetchTags() {
    setLoading(true)
    const { data } = await supabase
      .from('trade_tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (data && data.length === 0) await seedTags()
    else { setTags(data || []); setLoading(false) }
  }

  async function seedTags() {
    await supabase.from('trade_tags').insert(
      DEFAULT_TAGS.map(t => ({ ...t, user_id: user.id }))
    )
    const { data } = await supabase
      .from('trade_tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    setTags(data || [])
    setLoading(false)
  }

  async function addTag(name, color) {
    const { error } = await supabase
      .from('trade_tags')
      .insert({ user_id: user.id, name, color })
    if (!error) fetchTags()
    return { error }
  }

  async function deleteTag(id) {
    await supabase.from('trade_tags').delete().eq('id', id)
    fetchTags()
  }

  async function updateTag(id, name, color) {
    await supabase.from('trade_tags').update({ name, color }).eq('id', id)
    fetchTags()
  }

  return { tags, loading, addTag, deleteTag, updateTag }
}