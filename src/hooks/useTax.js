import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// 2024 Malaysia tax brackets (Resident Individual)
export const TAX_BRACKETS = [
  { min: 0, max: 5000, rate: 0 },
  { min: 5000, max: 20000, rate: 0.01 },
  { min: 20000, max: 35000, rate: 0.03 },
  { min: 35000, max: 50000, rate: 0.08 },
  { min: 50000, max: 70000, rate: 0.13 },
  { min: 70000, max: 100000, rate: 0.21 },
  { min: 100000, max: 250000, rate: 0.24 },
  { min: 250000, max: 400000, rate: 0.245 },
  { min: 400000, max: 600000, rate: 0.25 },
  { min: 600000, max: 1000000, rate: 0.26 },
  { min: 1000000, max: Infinity, rate: 0.28 },
]

export function calculateTax(chargeableIncome) {
  let tax = 0
  for (const bracket of TAX_BRACKETS) {
    if (chargeableIncome <= bracket.min) break
    const taxable = Math.min(chargeableIncome, bracket.max) - bracket.min
    tax += taxable * bracket.rate
  }
  return tax
}

export function getTaxBracket(chargeableIncome) {
  for (let i = TAX_BRACKETS.length - 1; i >= 0; i--) {
    if (chargeableIncome > TAX_BRACKETS[i].min) return TAX_BRACKETS[i]
  }
  return TAX_BRACKETS[0]
}

// Common LHDN reliefs with max limits
export const RELIEF_CATEGORIES = [
  { id: 'self', label: 'Individual & dependent relatives', max: 9000, icon: '👤' },
  { id: 'medical_self', label: 'Medical treatment (self/spouse/child)', max: 10000, icon: '🏥' },
  { id: 'epf', label: 'EPF / approved scheme', max: 4000, icon: '💼' },
  { id: 'life_insurance', label: 'Life insurance premium', max: 3000, icon: '🛡️' },
  { id: 'lifestyle', label: 'Lifestyle (books, internet, etc.)', max: 2500, icon: '📱' },
  { id: 'education', label: 'Education fees (self)', max: 7000, icon: '🎓' },
  { id: 'medical_parent', label: 'Medical for parents', max: 8000, icon: '👴' },
  { id: 'child', label: 'Child relief (per child)', max: 2000, icon: '👶' },
  { id: 'child_edu', label: 'Child in higher education', max: 8000, icon: '🎒' },
  { id: 'spouse', label: 'Spouse / alimony', max: 4000, icon: '💑' },
  { id: 'disabled', label: 'Disabled individual/spouse', max: 6000, icon: '♿' },
  { id: 'sspn', label: 'SSPN (education savings)', max: 8000, icon: '🏦' },
  { id: 'ev', label: 'EV charging facility', max: 2500, icon: '⚡' },
  { id: 'other', label: 'Other reliefs', max: null, icon: '📋' },
]

export function useTax(year) {
  const { user } = useAuth()
  const [reliefs, setReliefs] = useState([])
  const [submission, setSubmission] = useState(null)
  const [annualIncome, setAnnualIncome] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !year) return
    fetchAll()
  }, [user, year])

  async function fetchAll() {
    setLoading(true)
    const [{ data: reliefsData }, { data: submissionData }, { data: txnData }] =
      await Promise.all([
        supabase.from('tax_reliefs')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', year),
        supabase.from('tax_submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', year)
          .single(),
        supabase.from('transactions')
          .select('amount, type, date')
          .eq('user_id', user.id)
          .eq('type', 'income')
          .gte('date', `${year}-01-01`)
          .lte('date', `${year}-12-31`)
      ])

    setReliefs(reliefsData || [])
    setSubmission(submissionData || null)
    const total = (txnData || []).reduce((sum, t) => sum + Number(t.amount), 0)
    setAnnualIncome(total)
    setLoading(false)
  }

  async function saveRelief(category, label, amount) {
    const existing = reliefs.find(r => r.category === category)
    if (existing) {
      await supabase.from('tax_reliefs')
        .update({ amount, label })
        .eq('id', existing.id)
    } else {
      await supabase.from('tax_reliefs')
        .insert({ user_id: user.id, year, category, label, amount })
    }
    fetchAll()
  }

  async function deleteRelief(id) {
    await supabase.from('tax_reliefs').delete().eq('id', id)
    fetchAll()
  }

  async function saveSubmission(data) {
    if (submission) {
      await supabase.from('tax_submissions')
        .update(data)
        .eq('id', submission.id)
    } else {
      await supabase.from('tax_submissions')
        .insert({ ...data, user_id: user.id, year })
    }
    fetchAll()
  }

  const totalReliefs = reliefs.reduce((sum, r) => sum + Number(r.amount), 0)
  const chargeableIncome = Math.max(0, annualIncome - totalReliefs)
  const estimatedTax = calculateTax(chargeableIncome)
  const bracket = getTaxBracket(chargeableIncome)
  const effectiveRate = annualIncome > 0 ? (estimatedTax / annualIncome) * 100 : 0

  return {
    reliefs, submission, annualIncome, loading,
    totalReliefs, chargeableIncome, estimatedTax,
    bracket, effectiveRate,
    saveRelief, deleteRelief, saveSubmission,
    refetch: fetchAll
  }
}