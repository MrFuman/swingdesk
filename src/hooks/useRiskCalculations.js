import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useRiskCalculations() {
  const { user } = useAuth()
  const [calculations, setCalculations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchCalculations()
  }, [user])

  async function fetchCalculations() {
    setLoading(true)
    const { data } = await supabase
      .from('risk_calculations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setCalculations(data || [])
    setLoading(false)
  }

  async function saveCalculation(data) {
    const { error } = await supabase
      .from('risk_calculations')
      .insert({ ...data, user_id: user.id })
    if (!error) fetchCalculations()
    return { error }
  }

  async function deleteCalculation(id) {
    await supabase.from('risk_calculations').delete().eq('id', id)
    fetchCalculations()
  }

  return { calculations, loading, saveCalculation, deleteCalculation }
}