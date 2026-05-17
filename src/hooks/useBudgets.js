import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useBudgets(month) {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !month) return
    fetchBudgets()
  }, [user, month])

  async function fetchBudgets() {
    setLoading(true)
    const { data } = await supabase
      .from('budgets')
      .select('*, categories(id, name, icon, color)')
      .eq('user_id', user.id)
      .eq('month', month)
    setBudgets(data || [])
    setLoading(false)
  }

  async function setBudget(category_id, amount) {
    const existing = budgets.find(b => b.category_id === category_id)
    if (existing) {
      await supabase.from('budgets')
        .update({ amount })
        .eq('id', existing.id)
    } else {
      await supabase.from('budgets')
        .insert({ user_id: user.id, category_id, month, amount })
    }
    fetchBudgets()
  }

  async function deleteBudget(id) {
    await supabase.from('budgets').delete().eq('id', id)
    fetchBudgets()
  }

  return { budgets, loading, setBudget, deleteBudget, refetch: fetchBudgets }
}