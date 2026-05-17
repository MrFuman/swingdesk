import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTrades() {
  const { user } = useAuth()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchTrades()
  }, [user])

  async function fetchTrades() {
    setLoading(true)
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
    setTrades(data || [])
    setLoading(false)
  }

  async function addTrade(data) {
    const { error } = await supabase
      .from('trades')
      .insert({ ...data, user_id: user.id })
    if (!error) fetchTrades()
    return { error }
  }

  async function updateTrade(id, data) {
    const { error } = await supabase
      .from('trades')
      .update(data)
      .eq('id', id)
    if (!error) fetchTrades()
    return { error }
  }

  async function deleteTrade(id) {
    const trade = trades.find(t => t.id === id)
    if (trade?.screenshot_url) {
      const path = `${user.id}/${id}`
      await supabase.storage.from('trade-screenshots').remove([path])
    }
    await supabase.from('trades').delete().eq('id', id)
    fetchTrades()
  }

  async function uploadScreenshot(tradeId, file) {
    const path = `${user.id}/${tradeId}`
    const { error } = await supabase.storage
      .from('trade-screenshots')
      .upload(path, file, { upsert: true })
    if (error) return { error }
    const { data } = supabase.storage
      .from('trade-screenshots')
      .getPublicUrl(path)
    await supabase.from('trades')
      .update({ screenshot_url: data.publicUrl })
      .eq('id', tradeId)
    fetchTrades()
    return { url: data.publicUrl }
  }

  async function importTrades(tradesData) {
    const { error } = await supabase
      .from('trades')
      .insert(tradesData.map(t => ({ ...t, user_id: user.id })))
    if (!error) fetchTrades()
    return { error }
  }

  const openTrades = trades.filter(t => t.status === 'open')
  const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl != null)
  const wins = closedTrades.filter(t => t.pnl > 0)
  const losses = closedTrades.filter(t => t.pnl < 0)
  const totalPnl = closedTrades.reduce((sum, t) => sum + Number(t.pnl), 0)
  const grossProfit = wins.reduce((sum, t) => sum + Number(t.pnl), 0)
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + Number(t.pnl), 0))
  const winRate = closedTrades.length > 0
    ? Math.round((wins.length / closedTrades.length) * 100) : 0
  const profitFactor = grossLoss > 0
    ? (grossProfit / grossLoss).toFixed(2)
    : grossProfit > 0 ? '∞' : '0'

  const stats = { total: trades.length, winRate, totalPnl, profitFactor }

  const equityCurve = [...closedTrades]
    .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date))
    .reduce((acc, t, i) => {
      const prev = acc[i]?.equity ?? 0
      acc.push({
        date: t.entry_date, equity: prev + Number(t.pnl),
        trade: i + 1, instrument: t.instrument, pnl: Number(t.pnl),
      })
      return acc
    }, [])

  let peak = 0, maxDrawdown = 0
  equityCurve.forEach(p => {
    if (p.equity > peak) peak = p.equity
    const dd = peak - p.equity
    if (dd > maxDrawdown) maxDrawdown = dd
  })

  return {
    trades, openTrades, loading,
    addTrade, updateTrade, deleteTrade,
    uploadScreenshot, importTrades,
    stats: { ...stats, maxDrawdown },
    equityCurve
  }
}