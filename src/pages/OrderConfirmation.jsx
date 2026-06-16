import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Package, Truck, Phone, MapPin, ShoppingBag, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function OrderConfirmation() {
  const { t, i18n } = useTranslation()
  const { orderId } = useParams()
  const isRTL = i18n.language === 'ar'

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchOrder() {
      if (!supabase || !orderId) {
        setError('No order ID')
        setLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (fetchError) throw fetchError
        if (!data) throw new Error('Order not found')

        setOrder(data)
      } catch (err) {
        console.error('Error fetching order:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

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

  // Error state
  if (error || !order) {
    return (
      <Layout>
        <div className="container" style={{ padding: '40px 16px', textAlign: 'center' }}>
          <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '8px' }}>
            {error || t('common.error')}
          </h1>
          <Link
            to="/shop"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: 'var(--gold)',
              color: 'var(--white)',
              borderRadius: '8px',
              textDecoration: 'none',
              marginTop: '16px',
            }}
          >
            {t('confirmation.continueShopping')}
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container" style={{ padding: '24px 16px' }}>
        {/* Success banner */}
        <div className="success-banner">
          <div className="success-icon">
            <CheckCircle size={48} />
          </div>
          <h1
            style={{
              fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 36px)',
              fontWeight: 600,
              marginBottom: '8px',
              color: 'var(--success)',
            }}
          >
            {t('confirmation.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
            {t('confirmation.subtitle')}
          </p>
        </div>

        {/* Order number */}
        <div className="order-number-card">
          <span className="label">{t('confirmation.orderNumber')}</span>
          <span className="value">{order.id.slice(0, 8).toUpperCase()}</span>
        </div>

        {/* Main content */}
        <div className="confirmation-layout">
          {/* Order details */}
          <div className="details-section">
            {/* Items */}
            <div className="details-card">
              <h2
                style={{
                  fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                {t('confirmation.summary')}
              </h2>

              <div className="items-list">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <div className="item-image">
                      <ShoppingBag size={20} color="var(--text-muted)" />
                    </div>
                    <div className="item-details">
                      <span className="item-name">{item.name}</span>
                      <span className="item-variant">
                        {item.size}{item.size && item.color && ' | '}{item.color}
                      </span>
                    </div>
                    <div className="item-qty">x{item.quantity}</div>
                    <div className="item-price">{(item.price * item.quantity).toLocaleString()} DZD</div>
                  </div>
                ))}
              </div>

              <div className="totals">
                <div className="total-row">
                  <span>{t('cart.subtotal')}</span>
                  <span>{order.subtotal?.toLocaleString()} DZD</span>
                </div>
                <div className="total-row">
                  <span>{t('checkout.delivery')}</span>
                  <span>{order.delivery_fee?.toLocaleString()} DZD</span>
                </div>
                <div className="total-row final">
                  <span>{t('common.total')}</span>
                  <span>{order.total?.toLocaleString()} DZD</span>
                </div>
              </div>
            </div>

            {/* Customer info */}
            <div className="details-card">
              <h2
                style={{
                  fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                {t('checkout.personalInfo')}
              </h2>

              <div className="info-row">
                <span className="info-label">{t('checkout.name')}</span>
                <span className="info-value">{order.customer_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('checkout.phone')}</span>
                <span className="info-value">{order.customer_phone}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('checkout.wilaya')}</span>
                <span className="info-value">{order.wilaya}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('checkout.commune')}</span>
                <span className="info-value">{order.commune}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('checkout.address')}</span>
                <span className="info-value">{order.address}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('checkout.deliveryMethod')}</span>
                <span className="info-value">
                  {order.delivery_method === 'yalidine' ? 'Yalidine' : 'ZR Express'}
                </span>
              </div>
            </div>
          </div>

          {/* What next */}
          <div className="next-steps">
            <h2
              style={{
                fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              {t('confirmation.whatNext')}
            </h2>

            <div className="steps">
              <div className="step">
                <div className="step-icon">
                  <Phone size={20} />
                </div>
                <div className="step-content">
                  <h3>{t('confirmation.step1')}</h3>
                </div>
              </div>

              <div className="step">
                <div className="step-icon">
                  <Package size={20} />
                </div>
                <div className="step-content">
                  <h3>{t('confirmation.step2')}</h3>
                </div>
              </div>

              <div className="step">
                <div className="step-icon">
                  <Truck size={20} />
                </div>
                <div className="step-content">
                  <h3>{t('confirmation.step3')}</h3>
                </div>
              </div>
            </div>

            <div className="cod-reminder">
              <Truck size={24} />
              <div>
                <strong>{t('checkout.cod')}</strong>
                <p>{t('checkout.codDesc')}</p>
              </div>
            </div>

            <Link to="/shop" className="continue-btn">
              {t('confirmation.continueShopping')}
            </Link>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .success-banner {
          text-align: center;
          padding: 32px 16px;
          margin-bottom: 24px;
        }

        .success-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--success);
          color: var(--white);
          margin-bottom: 16px;
        }

        .order-number-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          background: var(--beige);
          border-radius: 12px;
          margin-bottom: 32px;
        }

        .order-number-card .label {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .order-number-card .value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
          font-family: monospace;
          letter-spacing: 2px;
        }

        .confirmation-layout {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .details-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .details-card {
          background: var(--white);
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .order-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--cream);
          border-radius: 8px;
        }

        .item-image {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          background: var(--beige);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-details {
          flex: 1;
          min-width: 0;
        }

        .item-name {
          display: block;
          font-weight: 500;
          font-size: 14px;
          color: var(--text);
        }

        .item-variant {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
        }

        .item-qty {
          font-size: 14px;
          color: var(--text-muted);
        }

        .item-price {
          font-weight: 500;
          font-size: 14px;
          white-space: nowrap;
        }

        .totals {
          border-top: 1px solid var(--border);
          padding-top: 16px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .total-row.final {
          font-size: 18px;
          font-weight: 600;
          margin-top: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          color: var(--text-muted);
        }

        .info-value {
          font-weight: 500;
          text-align: end;
        }

        .next-steps {
          background: var(--white);
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .steps {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }

        .step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .step-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--beige);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gold);
          flex-shrink: 0;
        }

        .step-content h3 {
          font-size: 14px;
          font-weight: 400;
          color: var(--text-muted);
          margin: 8px 0 0 0;
          line-height: 1.5;
        }

        .cod-reminder {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: var(--beige);
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .cod-reminder strong {
          display: block;
          font-size: 15px;
          margin-bottom: 4px;
          color: var(--text);
        }

        .cod-reminder p {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }

        .continue-btn {
          display: block;
          width: 100%;
          padding: 16px;
          background: var(--gold);
          color: var(--white);
          text-align: center;
          text-decoration: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          transition: background 0.2s ease;
        }

        .continue-btn:hover {
          background: var(--gold-light);
        }

        @media (min-width: 768px) {
          .confirmation-layout {
            flex-direction: row;
            align-items: flex-start;
          }

          .details-section {
            flex: 1;
          }

          .next-steps {
            flex: 0 0 320px;
            position: sticky;
            top: calc(var(--header-height) + 24px);
          }
        }
      `}</style>
    </Layout>
  )
}
