import React, { useState } from 'react'
import LangSwitch from '../components/LangSwitch.jsx'
import PlanCard from '../components/PlanCard.jsx'
import WhatsAppAction from '../components/WhatsAppAction.jsx'
import { cardStyle, secondaryBtnStyle } from '../lib/sharedStyles'
import { PLAN_PRICES, SHAMCASH_QR, SHAMCASH_HOLDER, SHAMCASH_CODE, ADMIN_WHATSAPP } from '../lib/config'
import { buildWhatsappLink } from '../lib/utils'

export default function SubscriptionExpiredScreen({ t, lang, setLang, session, specialty, sub, onLogout, onRequestRenewal }) {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const isPending = sub && sub.pendingPlan
  const isRevoked = sub && sub.status === 'revoked'

  function handleChoose(plan) {
    setSelectedPlan(plan)
    onRequestRenewal(plan)
  }

  const specialtyLabel = specialty ? specialty.name[lang] : ''
  const waPlan = isPending ? sub.pendingPlan : selectedPlan
  const waLink = waPlan ? buildWhatsappLink(session.email, waPlan, specialtyLabel, lang) : null
  const directWaLink = `https://wa.me/${ADMIN_WHATSAPP.replace('+', '')}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 960, width: '100%', margin: '0 auto', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {specialty && (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={'fa-solid ' + specialty.icon} style={{ fontSize: 15, color: 'var(--green-dark)' }}></i>
            </div>
          )}
          <span style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>{session.email}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LangSwitch lang={lang} setLang={setLang} t={t} />
          <button onClick={onLogout} style={secondaryBtnStyle}>
            {t.logout}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="fade-in" style={{ width: '100%', maxWidth: 520 }}>
          {isRevoked ? (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'var(--red-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px'
                }}
              >
                <i className="fa-solid fa-ban" style={{ fontSize: 24, color: 'var(--red)' }}></i>
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: 'var(--green-dark)' }}>{t.subscriptionExpiredTitle}</h1>
              <p style={{ fontSize: 13.5, color: 'var(--text-sub)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 18px' }}>{t.accountRevokedNotice}</p>
              <WhatsAppAction t={t} lang={lang} link={directWaLink} phone={ADMIN_WHATSAPP} label={t.sendViaWhatsapp} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'var(--amber-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px'
                }}
              >
                <i className="fa-solid fa-hourglass-end" style={{ fontSize: 24, color: 'var(--amber)' }}></i>
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: 'var(--green-dark)' }}>{t.subscriptionExpiredTitle}</h1>
              <p style={{ fontSize: 13.5, color: 'var(--text-sub)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>{t.subscriptionExpiredDesc}</p>
            </div>
          )}

          {!isRevoked &&
            (isPending ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '28px 20px' }}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                  {lang === 'ar' ? `ادفع $${PLAN_PRICES[waPlan]} عبر شام كاش` : `Pay $${PLAN_PRICES[waPlan]} via Sham Cash`}
                </p>
                <img src={SHAMCASH_QR} alt="Sham Cash QR" style={{ width: 170, height: 'auto', borderRadius: 14, border: '1px solid var(--border-soft)', marginBottom: 12 }} />
                <div style={{ background: 'var(--bg-cream)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 2 }}>{lang === 'ar' ? 'اسم صاحب الحساب' : 'Account holder'}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>{SHAMCASH_HOLDER}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 2 }}>{lang === 'ar' ? 'رمز الحساب' : 'Account code'}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, wordBreak: 'break-all', direction: 'ltr', textAlign: 'center' }}>{SHAMCASH_CODE}</div>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 14, lineHeight: 1.7 }}>
                  {lang === 'ar'
                    ? 'بعد الدفع، أرسل صورة إشعار التحويل عبر واتساب ليتم تفعيل اشتراكك.'
                    : 'After paying, send a screenshot of the transfer receipt via WhatsApp to activate your subscription.'}
                </p>
                <WhatsAppAction t={t} lang={lang} link={waLink} phone={ADMIN_WHATSAPP} label={t.sendViaWhatsapp} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <PlanCard t={t} title={t.monthlyPlan} price={PLAN_PRICES.monthly} suffix={t.perMonth} onChoose={() => handleChoose('monthly')} />
                <PlanCard t={t} title={t.quarterlyPlan} price={PLAN_PRICES.quarterly} suffix={t.perQuarter} onChoose={() => handleChoose('quarterly')} />
                <PlanCard
                  t={t}
                  title={t.yearlyPlan}
                  price={PLAN_PRICES.yearly}
                  suffix={t.perYear}
                  highlight
                  badge={t.bestValue}
                  onChoose={() => handleChoose('yearly')}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
