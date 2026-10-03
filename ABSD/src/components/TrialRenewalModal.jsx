import React, { useState } from 'react'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import PlanCard from './PlanCard.jsx'
import WhatsAppAction from './WhatsAppAction.jsx'
import { PLAN_PRICES, SHAMCASH_QR, SHAMCASH_HOLDER, SHAMCASH_CODE, ADMIN_WHATSAPP } from '../lib/config'
import { buildWhatsappLink } from '../lib/utils'

export default function TrialRenewalModal({ t, lang, session, specialty, onClose, onChoose }) {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const specialtyLabel = specialty ? specialty.name[lang] : ''
  const waLink = selectedPlan ? buildWhatsappLink(session.email, selectedPlan, specialtyLabel, lang) : null

  function handlePick(plan) {
    setSelectedPlan(plan)
    onChoose(plan)
  }

  return (
    <ModalShell onClose={onClose}>
      <ModalTitle icon="fa-hourglass-half" text={t.renewNow} onClose={onClose} />
      {!selectedPlan ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <PlanCard t={t} title={t.monthlyPlan} price={PLAN_PRICES.monthly} suffix={t.perMonth} onChoose={() => handlePick('monthly')} />
          <PlanCard t={t} title={t.quarterlyPlan} price={PLAN_PRICES.quarterly} suffix={t.perQuarter} onChoose={() => handlePick('quarterly')} />
          <PlanCard
            t={t}
            title={t.yearlyPlan}
            price={PLAN_PRICES.yearly}
            suffix={t.perYear}
            highlight
            badge={t.bestValue}
            onChoose={() => handlePick('yearly')}
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
            {lang === 'ar' ? `ادفع $${PLAN_PRICES[selectedPlan]} عبر شام كاش` : `Pay $${PLAN_PRICES[selectedPlan]} via Sham Cash`}
          </p>
          <img src={SHAMCASH_QR} alt="Sham Cash QR" style={{ width: 180, height: 'auto', borderRadius: 14, border: '1px solid var(--border-soft)', marginBottom: 12 }} />
          <div style={{ background: 'var(--bg-cream)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 2 }}>{lang === 'ar' ? 'اسم صاحب الحساب' : 'Account holder'}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>{SHAMCASH_HOLDER}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 2 }}>{lang === 'ar' ? 'رمز الحساب' : 'Account code'}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, wordBreak: 'break-all', direction: 'ltr', textAlign: 'center' }}>{SHAMCASH_CODE}</div>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 16, lineHeight: 1.7 }}>
            {lang === 'ar'
              ? 'بعد الدفع، أرسل صورة إشعار التحويل عبر واتساب ليتم تفعيل اشتراكك.'
              : 'After paying, send a screenshot of the transfer receipt via WhatsApp to activate your subscription.'}
          </p>
          <WhatsAppAction t={t} lang={lang} link={waLink} phone={ADMIN_WHATSAPP} label={t.sendViaWhatsapp} />
        </div>
      )}
    </ModalShell>
  )
}
