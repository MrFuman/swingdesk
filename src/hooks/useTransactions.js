import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTransactions(month) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const startDate = `${month}-01`
  const endDate = new Date(month + '-01')
  endDate.setMonth(endDate.getMonth() + 1)
  const endStr = endDate.toISOString().slice(0, 10)

  useEffect(() => {
    if (!user) return
    fetchAll()
  }, [user, month])

  async function fetchAll() {
    setLoading(true)
    const [{ data: txns }, { data: cats }] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, categories(name, icon, color)')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lt('date', endStr)
        .order('date', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
    ])
    setTransactions(txns || [])
    setCategories(cats || [])
    setLoading(false)
  }

  async function addTransaction(data) {
    const { error } = await supabase
      .from('transactions')
      .insert({ ...data, user_id: user.id })
    if (!error) fetchAll()
    return { error }
  }

  async function deleteTransaction(id) {
    await supabase.from('transactions').delete().eq('id', id)
    fetchAll()
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = totalIncome - totalExpense

  return {
    transactions, categories, loading,
    totalIncome, totalExpense, balance,
    addTransaction, deleteTransaction, refetch: fetchAll
  }
}