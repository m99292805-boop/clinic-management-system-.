import React, { useState } from 'react'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import ModalActions from './ModalActions.jsx'
import Field from './Field.jsx'
import { inputStyle } from '../lib/sharedStyles'
import { todayStr, currencyLabel } from '../lib/utils'
import { CURRENCIES } from '../lib/config'

export default function AddPaymentModal({ t, lang, onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [date, setDate] = useState(todayStr())
  const [method, setMethod] = useState('cash')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (submitting) return
    if (amount === '' || !date) {
      setError(t.fillRequired)
      return
    }
    const amountNum = Number(amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError(t.invalidAmount)
      return
    }
    setError('')
    setSubmitting(true)
    await onSave({ amount: amountNum, currency, date, method })
    setSubmitting(false)
  }

  return (
    <ModalShell onClose={onClose}>
      <ModalTitle icon="fa-sack-dollar" text={t.addPayment} onClose={onClose} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
        <Field label={t.amount}>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
        </Field>
        <Field label={t.currency}>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {currencyLabel(c.code, lang)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={t.date}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </Field>
      <Field label={t.paymentMethod}>
        <select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}>
          <option value="cash">{t.cash}</option>
          <option value="transfer">{t.transfer}</option>
        </select>
      </Field>
      {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
      <ModalActions t={t} onClose={onClose} onSave={submit} saveLabel={t.savePayment} disabled={submitting} />
    </ModalShell>
  )
}
