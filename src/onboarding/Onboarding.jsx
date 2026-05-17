import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ModuleSelect from './ModuleSelect'
import MoneyOnboarding from './MoneyOnboarding'
import TradingOnboarding from './TradingOnboarding'

export default function Onboarding({ onComplete }) {
  const { user } = useAuth()
  const [step, setStep] = useState('modules')
  const [selectedModules, setSelectedModules] = useState([])
  const [moneyData, setMoneyData] = useState(null)
  const [tradingData, setTradingData] = useState(null)

 function handleModuleSelect(modules) {
    console.log('modules selected:', modules)
    setSelectedModules(modules)
    if (modules.includes('money')) {
      console.log('going to money step')
      setStep('money')
    } else if (modules.includes('trading')) {
      setStep('trading')
    } else {
      saveAndFinish(modules, null, null)
    }
  }

  function handleMoneyDone(data) {
    setMoneyData(data)
    if (selectedModules.includes('trading')) {
      setStep('trading')
    } else {
      saveAndFinish(selectedModules, data, null)
    }
  }

  function handleTradingDone(data) {
    setTradingData(data)
    saveAndFinish(selectedModules, moneyData, data)
  }

  async function saveAndFinish(modules, money, trading) {
    const updateData = {
      onboarding_complete: true,
      modules: modules,
    }

    if (money) {
      updateData.full_name = money.full_name
      updateData.account_balance = parseFloat(money.account_balance) || 0
      updateData.monthly_income = parseFloat(money.monthly_income) || 0
      updateData.monthly_budget = parseFloat(money.monthly_budget) || 0
    }

    if (trading) {
      updateData.trading_capital = parseFloat(trading.trading_capital) || 0
      updateData.risk_per_trade = parseFloat(trading.risk_per_trade) || 1
      updateData.preferred_market = trading.preferred_market
    }

    await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    onComplete()
  }

  if (step === 'modules') return <ModuleSelect onNext={handleModuleSelect} />
  if (step === 'money') return <MoneyOnboarding onNext={handleMoneyDone} />
  if (step === 'trading') return <TradingOnboarding onNext={handleTradingDone} />

  return null
}