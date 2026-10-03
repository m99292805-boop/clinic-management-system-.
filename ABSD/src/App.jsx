import React, { useState, lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth.jsx'
import LoginScreen from './pages/LoginScreen.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PatientDetail from './pages/PatientDetail.jsx'
import TopBar from './components/TopBar.jsx'
import TrialBanner from './components/TrialBanner.jsx'
import AddPatientModal from './components/AddPatientModal.jsx'
import AddSessionModal from './components/AddSessionModal.jsx'
import AddPaymentModal from './components/AddPaymentModal.jsx'
import ConfirmModal from './components/ConfirmModal.jsx'
import Toast from './components/Toast.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import { daysLeft, isExpired } from './lib/utils'

// شاشات/نوافذ ثقيلة أو نادرة الاستخدام: تُحمَّل عند الحاجة فقط (يسرّع فتح التطبيق)
const SubscriptionExpiredScreen = lazy(() => import('./pages/SubscriptionExpiredScreen.jsx'))
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx'))
const AgentDashboard = lazy(() => import('./pages/AgentDashboard.jsx'))
const InvoiceModal = lazy(() => import('./components/InvoiceModal.jsx'))
const SettingsModal = lazy(() => import('./components/SettingsModal.jsx'))

function PageFallback() {
  return <div style={{ minHeight: '100vh', background: 'var(--bg-cream)' }} />
}

export default function App() {
  const {
    loaded,
    session,
    lang,
    setLang,
    t,
    profile,
    currentSpecialty,
    currentSub,
    specialties,
    patients,
    handleLogout,
    addPatient,
    addSession,
    addPayment,
    deletePatient,
    updatePatientField,
    updatePatientFieldDebounced,
    ensureSessionImagesLoaded,
    requestRenewal,
    toast
  } = useAuth()

  const [view, setView] = useState('dashboard') // dashboard | patient
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [showAddSession, setShowAddSession] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 26, color: 'var(--green-dark)', marginBottom: 10 }}></i>
          <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{t.loadingApp}</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <OfflineBanner t={t} />
        <LoginScreen />
      </>
    )
  }

  if (session.isAgent) {
    return (
      <Suspense fallback={<PageFallback />}>
        <AgentDashboard />
      </Suspense>
    )
  }

  if (session.isAdmin) {
    return (
      <Suspense fallback={<PageFallback />}>
        <AdminPanel />
      </Suspense>
    )
  }

  // فشل تحميل الاشتراك (شبكة ضعيفة): ما نعرض "منتهي" بالغلط، نعرض إعادة محاولة
  if (currentSub && currentSub.error) {
    const ar = lang === 'ar'
    return (
      <div dir={t.dir} style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 18, padding: 24, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 8 }}>
            {ar ? 'تعذّر تحميل بيانات الاشتراك' : "Couldn't load subscription data"}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 16 }}>{ar ? 'تأكد من اتصال الإنترنت ثم أعد المحاولة.' : 'Check your internet connection and try again.'}</div>
          <button onClick={() => window.location.reload()} style={{ background: 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 22px', fontSize: 14, marginInlineEnd: 8 }}>
            {ar ? 'إعادة المحاولة' : 'Retry'}
          </button>
          <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--text-sub)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 22px', fontSize: 14 }}>
            {ar ? 'تسجيل الخروج' : 'Log out'}
          </button>
        </div>
      </div>
    )
  }

  const subscriptionExpired = isExpired(currentSub)

  // السكرتيرة: لا خطط دفع أبداً. إذا اشتراك الطبيب منتهي بتنحجب ويطلع لها رسالة تراجع الطبيب فقط.
  if (subscriptionExpired && session.isSecretary) {
    return (
      <div dir={t.dir} style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 18, padding: 24, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 10 }}>{t.secretaryExpiredTitle}</div>
          <div style={{ fontSize: 13.5, color: 'var(--text-sub)', lineHeight: 1.8, marginBottom: 18 }}>{t.secretaryExpiredBody}</div>
          <button onClick={() => window.location.reload()} style={{ background: 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 22px', fontSize: 14, marginInlineEnd: 8 }}>
            {t.refreshBtn}
          </button>
          <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--text-sub)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 22px', fontSize: 14 }}>
            {t.logoutBtn}
          </button>
        </div>
      </div>
    )
  }

  if (subscriptionExpired) {
    return (
      <Suspense fallback={<PageFallback />}>
      <SubscriptionExpiredScreen
        t={t}
        lang={lang}
        setLang={setLang}
        session={session}
        specialty={currentSpecialty}
        sub={currentSub}
        onLogout={handleLogout}
        onRequestRenewal={requestRenewal}
      />
      </Suspense>
    )
  }

  const selectedPatient = selectedPatientId ? patients.find((p) => p.id === selectedPatientId) : null
  const showTrialBanner = !session.isSecretary && currentSub && currentSub.plan === 'trial' && daysLeft(currentSub) <= 2 && daysLeft(currentSub) >= 0

  async function handleDeletePatient(id) {
    const ok = await deletePatient(id)
    if (ok) {
      setConfirmDeleteId(null)
      setView('dashboard')
      setSelectedPatientId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
      <OfflineBanner t={t} />
      <TopBar
        t={t}
        lang={lang}
        setLang={setLang}
        session={session}
        specialty={currentSpecialty}
        patients={patients}
        onLogout={handleLogout}
        onSettings={() => setShowSettings(true)}
        onLogo={() => {
          setView('dashboard')
          setSelectedPatientId(null)
        }}
      />

      {showTrialBanner && (
        <TrialBanner t={t} lang={lang} sub={currentSub} session={session} specialty={currentSpecialty} onRequestRenewal={requestRenewal} />
      )}

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 60px' }}>
        {view === 'dashboard' && (
          <Dashboard
            t={t}
            lang={lang}
            specialty={currentSpecialty}
            patients={patients}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddPatient={() => setShowAddPatient(true)}
            onSelectPatient={(id) => {
              setSelectedPatientId(id)
              setView('patient')
              ensureSessionImagesLoaded(id)
            }}
          />
        )}
        {view === 'patient' && selectedPatient && (
          <PatientDetail
            t={t}
            lang={lang}
            specialty={currentSpecialty}
            patient={selectedPatient}
            onBack={() => {
              setView('dashboard')
              setSelectedPatientId(null)
            }}
            onDelete={() => setConfirmDeleteId(selectedPatient.id)}
            onPrint={() => setShowInvoice(true)}
            onAddSession={() => setShowAddSession(true)}
            onAddPayment={() => setShowAddPayment(true)}
            onUpdateField={(field, val) => updatePatientField(selectedPatient.id, field, val)}
            onUpdateFieldDebounced={(field, val) => updatePatientFieldDebounced(selectedPatient.id, field, val)}
          />
        )}
      </div>

      {showAddPatient && (
        <AddPatientModal
          t={t}
          onClose={() => setShowAddPatient(false)}
          onSave={async (data) => {
            const ok = await addPatient(data)
            if (ok) setShowAddPatient(false)
          }}
        />
      )}

      {showAddSession && selectedPatient && (
        <AddSessionModal
          t={t}
          lang={lang}
          specialty={currentSpecialty}
          onClose={() => setShowAddSession(false)}
          onSave={async (data) => {
            const ok = await addSession(selectedPatient.id, data)
            if (ok) setShowAddSession(false)
          }}
        />
      )}

      {showAddPayment && selectedPatient && (
        <AddPaymentModal
          t={t}
          lang={lang}
          onClose={() => setShowAddPayment(false)}
          onSave={async (data) => {
            const ok = await addPayment(selectedPatient.id, data)
            if (ok) setShowAddPayment(false)
          }}
        />
      )}

      {showInvoice && selectedPatient && (
        <Suspense fallback={null}>
          <InvoiceModal t={t} lang={lang} specialty={currentSpecialty} patient={selectedPatient} onClose={() => setShowInvoice(false)} />
        </Suspense>
      )}

      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal t={t} lang={lang} specialties={specialties} referralCode={profile ? profile.referral_code : null} onClose={() => setShowSettings(false)} />
        </Suspense>
      )}

      {confirmDeleteId && (
        <ConfirmModal t={t} message={t.confirmDelete} onCancel={() => setConfirmDeleteId(null)} onConfirm={() => handleDeletePatient(confirmDeleteId)} />
      )}

      <Toast message={toast} />
    </div>
  )
}
