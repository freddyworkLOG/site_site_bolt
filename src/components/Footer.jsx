import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/shop', label: t('nav.shop') },
    { to: '/how-to-order', label: t('nav.howToOrder') },
  ]

  return (
    <footer
      style={{
        backgroundColor: 'var(--beige)',
        borderTop: '1px solid var(--border)',
        padding: '32px 16px',
      }}
    >
      <div
        className="container"
        style={{
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <img
            src="/WhatsApp_Image_2026-06-21_at_10.45.40.jpeg"
            alt="Be Princess Collection"
            style={{
              height: '56px',
              width: '56px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '16px',
            letterSpacing: '0.05em',
          }}
        >
          Be Princess Collection
        </h2>

        <nav
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'color 0.2s ease',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}
        >
          © {new Date().getFullYear()} Be Princess Collection.
        </p>
      </div>
    </footer>
  )
}
