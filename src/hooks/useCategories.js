import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const DEFAULT_CATEGORIES = [
  { name: 'Salary', icon: '💰', color: '#22c55e', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#6366f1', type: 'income' },
  { name: 'Investment', icon: '📈', color: '#f59e0b', type: 'income' },
  { name: 'Other Income', icon: '💵', color: '#14b8a6', type: 'income' },
  { name: 'Food', icon: '🍔', color: '#ef4444', type: 'expense' },
  { name: 'Transport', icon: '🚗', color: '#f97316', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense' },
  { name: 'Bills', icon: '📄', color: '#8b5cf6', type: 'expense' },
  { name: 'Health', icon: '🏥', color: '#06b6d4', type: 'expense' },
  { name: 'Entertainment', icon: '🎮', color: '#f59e0b', type: 'expense' },
  { name: 'Education', icon: '📚', color: '#6366f1', type: 'expense' },
  { name: 'Others', icon: '📦', color: '#666666', type: 'expense' },
]

export function useSeedCategories() {
  const { user } = useAuth()
  const seeded = useRef(false)

  useEffect(() => {
    if (!user || seeded.current) return
    seeded.current = true
    seedCategories()
  }, [user?.id])

  async function seedCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)

    if (data && data.length > 0) return

    await supabase.from('categories').insert(
      DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: user.id }))
    )
  }
}

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => {
        setCategories(data || [])
        setLoading(false)
      })
  }, [user])

  return { categories, loading }
}