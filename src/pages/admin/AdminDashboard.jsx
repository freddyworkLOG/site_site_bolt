import { useTranslation } from 'react-i18next'

export default function AdminDashboard() {
  const { t } = useTranslation()

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--cream)',
        padding: '40px 16px',
      }}
    >
      <div className="container">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '24px',
          }}
        >
          {t('admin.dashboard')}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>— coming soon</p>
      </div>
    </div>
  )
}
