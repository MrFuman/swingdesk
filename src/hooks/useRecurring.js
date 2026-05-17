import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useRecurring() {
  const { user } = useAuth()
  const [recurring, setRecurring] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchRecurring()
  }, [user])

  async function fetchRecurring() {
    setLoading(true)
    const { data } = await supabase
      .from('recurring_transactions')
      .select('*, categories(name, icon, color)')
      .eq('user_id', user.id)
      .order('next_date', { ascending: true })
    setRecurring(data || [])
    setLoading(false)
  }

  async function addRecurring(data) {
    const { error } = await supabase
      .from('recurring_transactions')
      .insert({ ...data, user_id: user.id })
    if (!error) fetchRecurring()
    return { error }
  }

  async function markPaid(id) {
    const item = recurring.find(r => r.id === id)
    if (!item) return

    // Auto-create transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: item.type,
      amount: Number(item.amount),
      description: item.name,
      category_id: item.category_id || null,
      date: new Date().toISOString().slice(0, 10),
      notes: `Auto-created from recurring`,
    })

    // Advance next_date based on frequency
    const next = new Date(item.next_date)
    if (item.frequency === 'weekly') next.setDate(next.getDate() + 7)
    else if (item.frequency === 'monthly') next.setMonth(next.getMonth() + 1)
    else if (item.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1)

    await supabase
      .from('recurring_transactions')
      .update({ next_date: next.toISOString().slice(0, 10) })
      .eq('id', id)

    fetchRecurring()
  }

  async function toggleRecurring(id, active) {
    await supabase
      .from('recurring_transactions')
      .update({ active })
      .eq('id', id)
    fetchRecurring()
  }

  async function deleteRecurring(id) {
    await supabase.from('recurring_transactions').delete().eq('id', id)
    fetchRecurring()
  }

  const overdue = recurring.filter(r => {
    const days = Math.ceil((new Date(r.next_date) - new Date()) / (1000 * 60 * 60 * 24))
    return r.active && days < 0
  })

  const dueSoon = recurring.filter(r => {
    const days = Math.ceil((new Date(r.next_date) - new Date()) / (1000 * 60 * 60 * 24))
    return r.active && days >= 0 && days <= 7
  })

  return {
    recurring, loading, overdue, dueSoon,
    addRecurring, markPaid, toggleRecurring, deleteRecurring
  }
}