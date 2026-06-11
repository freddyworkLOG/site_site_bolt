import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function AdminLogin() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // Will be wired up in Section 8
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--cream)',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--white)',
          borderRadius: '12px',
          padding: '32px 24px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: '8px',
            color: 'var(--text)',
          }}
        >
          {t('admin.login')}
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '24px',
          }}
        >
          Nouara Admin
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '6px',
                color: 'var(--text)',
              }}
            >
              {t('admin.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '15px',
                backgroundColor: 'var(--cream)',
                color: 'var(--text)',
                outline: 'none',
              }}
              placeholder="admin@example.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '6px',
                color: 'var(--text)',
              }}
            >
              {t('admin.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '15px',
                backgroundColor: 'var(--cream)',
                color: 'var(--text)',
                outline: 'none',
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'var(--gold)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? t('admin.signingIn') : t('admin.signIn')}
          </button>
        </form>
      </div>
    </div>
  )
}
