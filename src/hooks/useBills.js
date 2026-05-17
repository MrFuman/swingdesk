import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useBills() {
  const { user } = useAuth()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchBills()
  }, [user])

  async function fetchBills() {
    setLoading(true)
    const { data } = await supabase
      .from('bills')
      .select('*, categories(name, icon, color)')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })
    setBills(data || [])
    setLoading(false)
  }

  async function addBill(data) {
    const { error } = await supabase
      .from('bills')
      .insert({ ...data, user_id: user.id })
    if (!error) fetchBills()
    return { error }
  }

  async function markPaid(id) {
    // 1. Mark bill as paid
    await supabase
      .from('bills')
      .update({ status: 'paid' })
      .eq('id', id)

    // 2. Auto-create a transaction
    const bill = bills.find(b => b.id === id)
    if (bill) {
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        amount: Number(bill.amount),
        description: bill.name,
        category_id: bill.category_id || null,
        date: new Date().toISOString().slice(0, 10),
        notes: `Auto-created from bill payment`,
      })
    }

    fetchBills()
  }

  async function markUnpaid(id) {
    await supabase
      .from('bills')
      .update({ status: 'unpaid' })
      .eq('id', id)
    fetchBills()
  }

  async function deleteBill(id) {
    await supabase.from('bills').delete().eq('id', id)
    fetchBills()
  }

  const upcoming = bills.filter(b => {
    const days = Math.ceil((new Date(b.due_date) - new Date()) / (1000 * 60 * 60 * 24))
    return b.status === 'unpaid' && days <= 7 && days >= 0
  })

  const overdue = bills.filter(b => {
    const days = Math.ceil((new Date(b.due_date) - new Date()) / (1000 * 60 * 60 * 24))
    return b.status === 'unpaid' && days < 0
  })

  return { bills, loading, upcoming, overdue, addBill, markPaid, markUnpaid, deleteBill }
}