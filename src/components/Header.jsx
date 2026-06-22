import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, ShoppingBag } from 'lucide-react'

export default function Header() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cartItems = localStorage.getItem('cart_items')
        if (cartItems) {
          const items = JSON.parse(cartItems)
          const total = Array.isArray(items)
            ? items.reduce((sum, item) => sum + (item.quantity || 1), 0)
            : 0
          setCartCount(total)
        } else {
          setCartCount(0)
        }
      } catch {
        setCartCount(0)
      }
    }

    updateCartCount()

    const handleCartUpdate = () => updateCartCount()
    window.addEventListener('storage', updateCartCount)
    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [location])

  const languages = [
    { code: 'ar', label: 'AR' },
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
  ]

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
  }

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/shop', label: t('nav.shop') },
    { to: '/how-to-order', label: t('nav.howToOrder') },
  ]

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--white)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          height: 'var(--header-height)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          {/* Left - Mobile hamburger / Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isMobile ? (
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Open menu"
              >
                <Menu size={24} color="var(--text)" />
              </button>
            ) : (
              <nav style={{ display: 'flex', gap: '24px' }}>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      color: location.pathname === link.to ? 'var(--rose)' : 'var(--text)',
                      textDecoration: 'none',
                      fontWeight: location.pathname === link.to ? 600 : 400,
                      fontSize: '15px',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Center - Logo */}
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/WhatsApp_Image_2026-06-21_at_10.45.40.jpeg"
              alt="Be Princess Collection"
              style={{
                height: isMobile ? '44px' : '54px',
                width: 'auto',
                borderRadius: '50%',
                objectFit: 'cover',
                aspectRatio: '1',
              }}
            />
          </Link>

          {/* Right - Language toggle + Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Language toggle */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  style={{
                    background: i18n.language === lang.code ? 'var(--rose)' : 'transparent',
                    color: i18n.language === lang.code ? 'var(--white)' : 'var(--text-muted)',
                    border: 'none',
                    padding: '4px 8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Cart icon */}
            <Link
              to="/cart"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                textDecoration: 'none',
              }}
            >
              <ShoppingBag size={24} color="var(--text)" />
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    insetInlineEnd: '-6px',
                    backgroundColor: 'var(--rose)',
                    color: 'var(--white)',
                    fontSize: '11px',
                    fontWeight: 600,
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              insetInlineStart: 0,
              width: '100%',
              maxHeight: '100vh',
              backgroundColor: 'var(--white)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                Menu
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer',
                }}
                aria-label="Close menu"
              >
                <X size={24} color="var(--text)" />
              </button>
            </div>
            <nav style={{ padding: '16px' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 0',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontSize: '16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
