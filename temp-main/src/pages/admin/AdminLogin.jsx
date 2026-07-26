import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!supabase) {
      setError('Database not configured')
      setLoading(false)
      return
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError(t('admin.invalidCredentials'))
        } else {
          setError(signInError.message)
        }
        return
      }

      navigate('/admin')
    } catch (err) {
      console.error('Login error:', err)
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
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
          borderRadius: '16px',
          padding: '40px 32px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
              marginBottom: '16px',
            }}
          >
            <Lock size={28} color="var(--white)" />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '8px',
            }}
          >
            {t('admin.login')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Nouara Admin Panel
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 16px',
              backgroundColor: 'rgba(201, 112, 112, 0.1)',
              border: '1px solid var(--error)',
              borderRadius: '10px',
              marginBottom: '20px',
              color: 'var(--error)',
              fontSize: '14px',
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                color: 'var(--text)',
              }}
            >
              {t('admin.email')}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  backgroundColor: 'var(--cream)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                placeholder="admin@nouara.dz"
              />
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                color: 'var(--text)',
              }}
            >
              {t('admin.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  backgroundColor: 'var(--cream)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: 'var(--gold)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spin" />
                {t('admin.signingIn')}
              </>
            ) : (
              t('admin.signIn')
            )}
          </button>
        </form>

        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  )
}
