import React, { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import LangSwitch from '../components/LangSwitch.jsx'
import ModalShell from '../components/ModalShell.jsx'
import ManualActivateModal from '../components/ManualActivateModal.jsx'
import AgentsPanel from '../components/AgentsPanel.jsx'
import { cardStyle, inputStyle, secondaryBtnStyle, primaryBtnStyle, dangerBtnStyle } from '../lib/sharedStyles'
import { isExpired, todayStr, planLabel } from '../lib/utils'
import { PLAN_PRICES } from '../lib/config'

export default function AdminPanel() {
  const {
    t,
    lang,
    setLang,
    specialties,
    adminProfiles,
    adminSubs,
    adminCounts,
    adminAgents,
    adminAgentRewards,
    adminSecretaries,
    handleLogout,
    approveSubscription,
    rejectSubscription,
    revokeSubscription,
    deleteDoctorAccount,
    deleteAgentAccount
  } = useAuth()

  const [revokeTarget, setRevokeTarget] = useState(null)
  const [activateTarget, setActivateTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mainTab, setMainTab] = useState('doctors') // doctors | agents
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | trial | paid
  const [busyKeys, setBusyKeys] = useState({})

  async function withBusy(key, fn) {
    if (busyKeys[key]) return
    setBusyKeys((prev) => ({ ...prev, [key]: true }))
    try {
      await fn()
    } finally {
      setBusyKeys((prev) => {
        const n = { ...prev }
        delete n[key]
        return n
      })
    }
  }

  const { entries, agentStats } = useMemo(() => {
    const profileById = {}
    adminProfiles.forEach((p) => {
      profileById[p.id] = p
    })
    const referredList = {}
    adminProfiles.forEach((p) => {
      if (p.referred_by && profileById[p.referred_by]) {
        if (!referredList[p.referred_by]) referredList[p.referred_by] = []
        referredList[p.referred_by].push({ email: p.email, fullName: p.full_name })
      }
    })
    const rewardedDoctorIds = new Set(adminAgentRewards.map((r) => r.doctor_id))
    const agentStatsMap = {}
    adminAgents.forEach((a) => {
      agentStatsMap[a.id] = { agent: a, doctors: [], earned: 0 }
    })
    adminAgentRewards.forEach((r) => {
      if (agentStatsMap[r.agent_id]) agentStatsMap[r.agent_id].earned += Number(r.amount || 0)
    })
    adminProfiles.forEach((p) => {
      if (p.agent_id && agentStatsMap[p.agent_id]) {
        agentStatsMap[p.agent_id].doctors.push({ email: p.email, fullName: p.full_name, isPaid: rewardedDoctorIds.has(p.id) })
      }
    })

    const list = adminProfiles.map((p) => {
      const sub = adminSubs[p.id] || { status: 'expired', plan: null, endDate: null, pendingPlan: null }
      const spec = specialties[p.specialty_id]
      const referredBy = p.referred_by && profileById[p.referred_by] ? { email: profileById[p.referred_by].email, code: profileById[p.referred_by].referral_code } : null
      return {
        key: p.id,
        email: p.email,
        fullName: p.full_name || '',
        phone: p.phone || '—',
        specialty: spec,
        patientsCount: adminCounts[p.id] || 0,
        sub,
        referredBy,
        referredDoctors: referredList[p.id] || [],
        referralCode: p.referral_code || '',
        secretaryName: adminSecretaries[p.id] || null
      }
    })

    return { entries: list, agentStats: Object.values(agentStatsMap) }
  }, [adminProfiles, adminSubs, adminCounts, adminAgents, adminAgentRewards, adminSecretaries, specialties])

  const expiringToday = entries.filter((e) => e.sub.status === 'active' && e.sub.endDate && new Date(e.sub.endDate) <= new Date(todayStr()))

  const searchTerm = search.trim().toLowerCase()
  const searchedEntries = entries
    .filter((e) => {
      if (!searchTerm) return true
      return e.email.toLowerCase().includes(searchTerm) || e.fullName.toLowerCase().includes(searchTerm) || e.referralCode.toLowerCase().includes(searchTerm)
    })
    .filter((e) => {
      if (statusFilter === 'trial') return e.sub.plan === 'trial' && !isExpired(e.sub)
      if (statusFilter === 'paid') return (e.sub.plan === 'monthly' || e.sub.plan === 'quarterly' || e.sub.plan === 'yearly') && !isExpired(e.sub)
      return true
    })

  const pending = searchedEntries.filter((e) => e.sub.pendingPlan)
  const others = searchedEntries.filter((e) => !e.sub.pendingPlan)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
      <div style={{ background: 'var(--card-white)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-shield-halved" style={{ color: '#fff', fontSize: 16 }}></i>
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--green-dark)' }}>{t.adminPanel}</div>
              <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{t.adminSubtitle}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setMainTab(mainTab === 'agents' ? 'doctors' : 'agents')}
              style={{ ...secondaryBtnStyle, background: mainTab === 'agents' ? 'var(--green-dark)' : undefined, color: mainTab === 'agents' ? '#fff' : undefined }}
            >
              <i className="fa-solid fa-people-group" style={{ marginInlineEnd: 6 }}></i>
              {t.agentsTab}
            </button>
            <LangSwitch lang={lang} setLang={setLang} t={t} />
            <button onClick={handleLogout} style={secondaryBtnStyle}>
              {t.logout}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 60px' }}>
        {expiringToday.length > 0 && (
          <div style={{ background: '#fff0f0', border: '1.5px solid var(--red)', borderRadius: 'var(--radius-btn)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--red)', fontSize: 18 }}></i>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>
              {expiringToday.length} {t.expiringTodayAlert}: <span style={{ fontWeight: 500 }}>{expiringToday.map((e) => e.fullName || e.email).join('، ')}</span>
            </div>
          </div>
        )}

        {mainTab === 'agents' ? (
          <AgentsPanel t={t} agentStats={agentStats} onDeleteAgent={deleteAgentAccount} />
        ) : (
          <>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: 14, color: 'var(--text-sub)', fontSize: 13 }}></i>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchDoctorPlaceholder} style={{ ...inputStyle, paddingInlineStart: 38 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                ['all', t.allStatuses],
                ['trial', t.trialStatus],
                ['paid', t.paidStatus]
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: statusFilter === key ? 'var(--green-dark)' : 'var(--card-white)',
                    color: statusFilter === key ? '#fff' : 'var(--text-sub)'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 10 }}>
              {t.pendingRequests} {pending.length > 0 && <span style={{ color: 'var(--amber)' }}>({pending.length})</span>}
            </div>
            {pending.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-sub)', padding: '24px', marginBottom: 24 }}>{t.noRequests}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {pending.map((e) => (
                  <div key={e.key} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {e.specialty && <i className={'fa-solid ' + e.specialty.icon} style={{ color: 'var(--green-dark)', fontSize: 14 }}></i>}
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{e.fullName ? `${e.fullName} — ${e.email}` : e.email}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4 }}>
                        {e.specialty ? e.specialty.name[lang] : ''} · {t.requestedPlan}: {planLabel(t, e.sub.pendingPlan)} (${PLAN_PRICES[e.sub.pendingPlan]})
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-sub)' }}>
                        <i className="fa-solid fa-phone" style={{ marginInlineEnd: 5, color: 'var(--green-mid)' }}></i>
                        {e.phone}
                      </div>
                      {e.referredBy && (
                        <div style={{ fontSize: 11.5, color: 'var(--green-dark)', marginTop: 4 }}>
                          <i className="fa-solid fa-user-plus" style={{ marginInlineEnd: 5 }}></i>
                          {t.referredByLabel}: {e.referredBy.email}{' '}
                          <span style={{ color: 'var(--text-sub)', direction: 'ltr', display: 'inline-block' }}>({e.referredBy.code})</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        disabled={!!busyKeys[e.key]}
                        onClick={() => withBusy(e.key, () => rejectSubscription(e.key))}
                        style={{ ...secondaryBtnStyle, opacity: busyKeys[e.key] ? 0.6 : 1 }}
                      >
                        {t.reject}
                      </button>
                      <button
                        type="button"
                        disabled={!!busyKeys[e.key]}
                        onClick={() => withBusy(e.key, () => approveSubscription(e.key, e.sub.pendingPlan))}
                        style={{ ...primaryBtnStyle, opacity: busyKeys[e.key] ? 0.6 : 1 }}
                      >
                        {busyKeys[e.key] ? '...' : t.approve}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 10 }}>{t.allSubscriptions}</div>
            {others.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-sub)', padding: '24px' }}>
                {searchTerm || statusFilter !== 'all' ? t.noResultsFound : t.noSubscriptionsYet}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {others.map((e) => {
                  const revoked = e.sub.status === 'revoked'
                  const expired = isExpired(e.sub)
                  const canRevoke = !revoked && !expired
                  const badgeColor = revoked ? 'var(--red)' : expired ? 'var(--red)' : e.sub.plan === 'trial' ? 'var(--amber)' : 'var(--green-mid)'
                  const badgeBg = revoked ? 'var(--red-bg)' : expired ? 'var(--red-bg)' : e.sub.plan === 'trial' ? 'var(--amber-bg)' : 'var(--green-light)'
                  const statusLabel = revoked ? t.revoked : expired ? t.expired : e.sub.plan === 'trial' ? t.trial : t.active
                  return (
                    <div key={e.key} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {e.specialty && <i className={'fa-solid ' + e.specialty.icon} style={{ color: 'var(--green-dark)', fontSize: 14 }}></i>}
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.fullName ? `${e.fullName} — ${e.email}` : e.email}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 2 }}>{e.specialty ? e.specialty.name[lang] : ''}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                            <i className="fa-solid fa-phone" style={{ marginInlineEnd: 4, color: 'var(--green-mid)' }}></i>
                            {e.phone}
                          </div>
                          {e.secretaryName && (
                            <div style={{ fontSize: 11, color: 'var(--green-mid)', marginTop: 2 }}>
                              <i className="fa-solid fa-user-tie" style={{ marginInlineEnd: 4 }}></i>
                              {t.secretaryBadgePrefix}: {e.secretaryName}
                            </div>
                          )}
                          {e.referredBy && (
                            <div style={{ fontSize: 11, color: 'var(--green-dark)', marginTop: 2 }}>
                              <i className="fa-solid fa-user-plus" style={{ marginInlineEnd: 4 }}></i>
                              {t.referredByLabel}: {e.referredBy.email}{' '}
                              <span style={{ color: 'var(--text-sub)', direction: 'ltr', display: 'inline-block' }}>({e.referredBy.code})</span>
                            </div>
                          )}
                          {e.referredDoctors.length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 2 }}>
                              <i className="fa-solid fa-users" style={{ marginInlineEnd: 4 }}></i>
                              {t.referredDoctorsCount} {e.referredDoctors.length}:{' '}
                              <span style={{ color: 'var(--text-sub)' }}>{e.referredDoctors.map((r) => r.fullName || r.email).join('، ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {e.sub.endDate && <span style={{ fontSize: 11.5, color: 'var(--text-sub)' }}>{t.expiresOn} {e.sub.endDate}</span>}
                        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: badgeBg, color: badgeColor }}>{statusLabel}</span>
                        {revoked ? (
                          <button
                            type="button"
                            onClick={() => setActivateTarget(e)}
                            style={{ background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 'var(--radius-btn)', padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
                          >
                            <i className="fa-solid fa-rotate-left" style={{ marginInlineEnd: 6 }}></i>
                            {t.restoreSubscription}
                          </button>
                        ) : (
                          <button type="button" onClick={() => setActivateTarget(e)} style={{ ...primaryBtnStyle, padding: '6px 12px', fontSize: 12 }}>
                            <i className="fa-solid fa-bolt" style={{ marginInlineEnd: 6 }}></i>
                            {t.manualActivate}
                          </button>
                        )}
                        {canRevoke && (
                          <button type="button" onClick={() => setRevokeTarget(e)} style={{ ...dangerBtnStyle, padding: '6px 12px', fontSize: 12 }}>
                            <i className="fa-solid fa-ban" style={{ marginInlineEnd: 6 }}></i>
                            {t.revoke}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(e)}
                          style={{ background: 'transparent', color: 'var(--red)', border: '1.5px solid var(--red)', borderRadius: 'var(--radius-btn)', padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
                        >
                          <i className="fa-solid fa-trash" style={{ marginInlineEnd: 6 }}></i>
                          {t.deleteDoctorBtn}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {revokeTarget && (
        <ModalShell onClose={() => setRevokeTarget(null)}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fa-solid fa-ban" style={{ color: 'var(--red)', fontSize: 20 }}></i>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, marginBottom: 6 }}>{t.confirmRevoke}</p>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 22 }}>{revokeTarget.email}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" disabled={!!busyKeys[revokeTarget.key]} onClick={() => setRevokeTarget(null)} style={{ ...secondaryBtnStyle, flex: 1 }}>
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={!!busyKeys[revokeTarget.key]}
                onClick={() =>
                  withBusy(revokeTarget.key, async () => {
                    const ok = await revokeSubscription(revokeTarget.key)
                    if (ok) setRevokeTarget(null)
                  })
                }
                style={{ ...dangerBtnStyle, flex: 1, opacity: busyKeys[revokeTarget.key] ? 0.6 : 1 }}
              >
                {busyKeys[revokeTarget.key] ? '...' : t.revoke}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {deleteTarget && (
        <ModalShell onClose={() => setDeleteTarget(null)}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fa-solid fa-trash" style={{ color: 'var(--red)', fontSize: 20 }}></i>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, marginBottom: 6 }}>{t.deleteDoctorConfirm}</p>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 22 }}>{deleteTarget.email}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" disabled={!!busyKeys[deleteTarget.key]} onClick={() => setDeleteTarget(null)} style={{ ...secondaryBtnStyle, flex: 1 }}>
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={!!busyKeys[deleteTarget.key]}
                onClick={() =>
                  withBusy(deleteTarget.key, async () => {
                    const ok = await deleteDoctorAccount(deleteTarget.key)
                    if (ok) setDeleteTarget(null)
                  })
                }
                style={{ ...dangerBtnStyle, flex: 1, opacity: busyKeys[deleteTarget.key] ? 0.6 : 1 }}
              >
                {busyKeys[deleteTarget.key] ? '...' : t.deleteDoctorBtn}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {activateTarget && (
        <ManualActivateModal
          t={t}
          target={activateTarget}
          busy={!!busyKeys[activateTarget.key]}
          onClose={() => setActivateTarget(null)}
          onActivate={(plan) =>
            withBusy(activateTarget.key, async () => {
              const ok = await approveSubscription(activateTarget.key, plan)
              if (ok) setActivateTarget(null)
            })
          }
        />
      )}
    </div>
  )
}
