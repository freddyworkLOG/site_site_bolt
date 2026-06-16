import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import Layout from '../components/Layout'

export default function Cart() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const items = JSON.parse(localStorage.getItem('cart_items') || '[]')
        setCartItems(Array.isArray(items) ? items : [])
      } catch {
        setCartItems([])
      } finally {
        setLoading(false)
      }
    }

    loadCart()

    const handleCartUpdate = () => loadCart()
    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [])

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  // Update item quantity
  const updateQuantity = (variantId, delta) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.variantId === variantId) {
          const newQty = Math.max(1, item.quantity + delta)
          return { ...item, quantity: newQty }
        }
        return item
      })
      localStorage.setItem('cart_items', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      return updated
    })
  }

  // Remove item
  const removeItem = (variantId) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.variantId !== variantId)
      localStorage.setItem('cart_items', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      return updated
    })
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('cart_items')
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  }

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '40px 16px', textAlign: 'center' }}>
          <p>{t('common.loading')}</p>
        </div>
      </Layout>
    )
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container" style={{ padding: '40px 16px', textAlign: 'center' }}>
          <ShoppingBag size={64} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h1
            style={{
              fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            {t('cart.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            {t('cart.empty')}
          </p>
          <Link
            to="/shop"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: 'var(--gold)',
              color: 'var(--white)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            {t('cart.continueShopping')}
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container" style={{ padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
              fontSize: 'clamp(24px, 5vw, 32px)',
              fontWeight: 600,
            }}
          >
            {t('cart.title')} ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} {t('cart.items')})
          </h1>
          <button
            onClick={clearCart}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--error)',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline',
            }}
          >
            {t('cart.remove')} all
          </button>
        </div>

        {/* Cart layout */}
        <div className="cart-layout">
          {/* Items list */}
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.variantId} className="cart-item">
                {/* Image */}
                <Link to={`/product/${item.productId}`} className="item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="no-image">
                      <ShoppingBag size={24} color="var(--text-muted)" />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="item-details">
                  <Link
                    to={`/product/${item.productId}`}
                    className="item-name"
                  >
                    {item.name}
                  </Link>
                  <div className="item-variant">
                    {item.size && <span>{item.size}</span>}
                    {item.size && item.color && <span> | </span>}
                    {item.color && <span>{item.color}</span>}
                  </div>
                  <div className="item-price">{item.price.toLocaleString()} DZD</div>
                </div>

                {/* Quantity controls */}
                <div className="item-quantity">
                  <button
                    onClick={() => updateQuantity(item.variantId, -1)}
                    disabled={item.quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.variantId, 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Item total */}
                <div className="item-total">
                  {(item.price * item.quantity).toLocaleString()} DZD
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="remove-btn"
                  aria-label="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary sidebar */}
          <div className="cart-summary">
            <h2 style={{
              fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '24px',
            }}>
              {t('checkout.orderSummary')}
            </h2>

            <div className="summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>{subtotal.toLocaleString()} DZD</span>
            </div>

            <div className="summary-row" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              <span>{t('checkout.delivery')}</span>
              <span>{t('checkout.codDesc')}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row total">
              <span>{t('common.total')}</span>
              <span>{subtotal.toLocaleString()} DZD</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="checkout-btn"
            >
              {t('cart.proceedToCheckout')}
            </button>

            <Link to="/shop" className="continue-link">
              <ArrowLeft size={16} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .cart-layout {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 80px 1fr auto auto auto;
          gap: 16px;
          align-items: center;
          padding: 16px;
          background: var(--white);
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .item-image {
          width: 80px;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--beige);
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-image .no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-details {
          min-width: 0;
        }

        .item-name {
          display: block;
          font-weight: 600;
          color: var(--text);
          text-decoration: none;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .item-name:hover {
          color: var(--gold);
        }

        .item-variant {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .item-price {
          font-size: 13px;
          color: var(--taupe);
        }

        .item-quantity {
          display: flex;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 6px;
        }

        .item-quantity button {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
        }

        .item-quantity button:disabled {
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .item-quantity span {
          width: 32px;
          text-align: center;
          font-weight: 500;
          font-size: 14px;
        }

        .item-total {
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
        }

        .remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 8px;
        }

        .remove-btn:hover {
          color: var(--error);
        }

        .cart-summary {
          background: var(--white);
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 15px;
        }

        .summary-row.total {
          font-size: 18px;
          font-weight: 600;
        }

        .summary-divider {
          height: 1px;
          background: var(--border);
          margin: 16px 0;
        }

        .checkout-btn {
          width: 100%;
          padding: 16px;
          background: var(--gold);
          color: var(--white);
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
          transition: background 0.2s ease;
        }

        .checkout-btn:hover {
          background: var(--gold-light);
        }

        .continue-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          text-align: center;
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
        }

        .continue-link:hover {
          color: var(--text);
        }

        @media (max-width: 767px) {
          .cart-item {
            grid-template-columns: 80px 1fr;
            grid-template-rows: auto auto auto;
            gap: 12px;
          }

          .item-details {
            grid-column: 2;
          }

          .item-quantity {
            grid-column: 1 / 2;
            justify-self: start;
          }

          .item-total {
            grid-column: 2;
            justify-self: end;
            grid-row: 2;
          }

          .remove-btn {
            grid-column: 2;
            justify-self: end;
            grid-row: 3;
          }
        }

        @media (min-width: 768px) {
          .cart-layout {
            flex-direction: row;
            align-items: flex-start;
          }

          .cart-items {
            flex: 1;
          }

          .cart-summary {
            flex: 0 0 320px;
            position: sticky;
            top: calc(var(--header-height) + 24px);
          }
        }
      `}</style>
    </Layout>
  )
}
