import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck, CreditCard, AlertCircle, Check, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

// Algerian wilayas list
const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Bejaia', 'Biskra', 'Bechar',
  'Blida', 'Bouira', 'Tamanrasset', 'Tebessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
  'Djelfa', 'Jijel', 'Setif', 'Saida', 'Skikda', 'Sidi Bel Abbes', 'Annaba', 'Guelma',
  'Constantine', 'Medea', 'Mostaganem', 'MSila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
  'Illizi', 'Bordj Bou Arreridj', 'Boumerdes', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
  'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Ain Defla', 'Naama', 'Ain Temouchent',
  'Ghardaia', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Beni Abbes',
  'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El MGhair', 'El Meniaa'
]

export default function Checkout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const [cartItems, setCartItems] = useState([])
const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    customer_phone: '',
    customer_phone_2: '',
    customer_height: '',
    delivery_type: 'home',
    wilaya: '',
    commune: '',
    address: '',
    delivery_method: 'yalidine',
  })

  // Load cart
  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem('cart_items') || '[]')
      if (!items.length) {
        navigate('/cart')
        return
      }
      setCartItems(Array.isArray(items) ? items : [])
    } catch {
      navigate('/cart')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  const deliveryFee = useMemo(() => {
    if (subtotal === 0) return 0
    if (subtotal >= 10000) return 300
    return 500
  }, [subtotal])

  const total = subtotal + deliveryFee

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  // Validate phone number (Algerian format)
  const validatePhone = (phone) => {
    return /^0[5-7][0-9]{8}$/.test(phone.replace(/\s/g, ''))
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('checkout.required')
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t('checkout.required')
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = t('checkout.required')
    } else if (!validatePhone(formData.customer_phone)) {
      newErrors.customer_phone = t('checkout.invalidPhone')
    }

    if (formData.customer_phone_2.trim() && !validatePhone(formData.customer_phone_2)) {
      newErrors.customer_phone_2 = t('checkout.invalidPhone')
    }

    if (!formData.customer_height.trim()) {
      newErrors.customer_height = t('checkout.required')
    }

    if (!formData.wilaya) {
      newErrors.wilaya = t('checkout.required')
    }

    if (!formData.commune.trim()) {
      newErrors.commune = t('checkout.required')
    }

    if (formData.delivery_type === 'home' && !formData.address.trim()) {
      newErrors.address = t('checkout.required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit order
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!supabase) {
      setErrors({ submit: 'Database not configured' })
      return
    }

    setSubmitting(true)

    try {
      const orderData = {
        customer_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        customer_phone: formData.customer_phone.replace(/\s/g, ''),
        customer_phone_2: formData.customer_phone_2.trim() ? formData.customer_phone_2.replace(/\s/g, '') : null,
        wilaya: formData.wilaya,
        commune: formData.commune.trim(),
        address: formData.delivery_type === 'home' ? formData.address.trim() : null,
        delivery_type: formData.delivery_type,
        delivery_method: formData.delivery_method,
        customer_height: formData.customer_height.trim() || null,
        items: cartItems.map(item => ({
          variantId: item.variantId,
          productId: item.productId,
          name: item.name,
          size: item.size,
          color: item.color,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: 'pending',
      }

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id')
        .single()

      if (insertError) throw insertError

      // Clear cart
      localStorage.removeItem('cart_items')
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      // Navigate to confirmation
      navigate(`/order-confirmation/${data.id}`)
    } catch (err) {
      console.error('Error submitting order:', err)
      setErrors({ submit: t('common.error') })
    } finally {
      setSubmitting(false)
    }
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

  return (
    <Layout>
      <div className="container" style={{ padding: '24px 16px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/cart')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            marginBottom: '24px',
            fontSize: '14px',
          }}
        >
          <ArrowLeft size={18} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
          {t('common.backToShop')}
        </button>

        {/* Title */}
        <h1
          style={{
            fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
            fontSize: 'clamp(24px, 5vw, 32px)',
            fontWeight: 600,
            marginBottom: '32px',
          }}
        >
          {t('checkout.title')}
        </h1>

        <form onSubmit={handleSubmit} className="checkout-form">
          {/* Main content */}
          <div className="checkout-main">
            {/* Personal info */}
            <section className="form-section">
              <h2 className="section-title">
                <span className="section-icon">1</span>
                {t('checkout.personalInfo')}
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">{t('checkout.firstName')} *</label>
                  <input
                    type="text"
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder={t('checkout.firstName')}
                    className={errors.first_name ? 'error' : ''}
                  />
                  {errors.first_name && (
                    <span className="error-message">{errors.first_name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">{t('checkout.lastName')} *</label>
                  <input
                    type="text"
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder={t('checkout.lastName')}
                    className={errors.last_name ? 'error' : ''}
                  />
                  {errors.last_name && (
                    <span className="error-message">{errors.last_name}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">{t('checkout.phone')} *</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.customer_phone}
                  onChange={(e) => handleChange('customer_phone', e.target.value)}
                  placeholder="0555 123 456"
                  className={errors.customer_phone ? 'error' : ''}
                />
                <span className="hint">{t('checkout.phoneHint')}</span>
                {errors.customer_phone && (
                  <span className="error-message">{errors.customer_phone}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone2">{t('checkout.phone2')}</label>
                <input
                  type="tel"
                  id="phone2"
                  value={formData.customer_phone_2}
                  onChange={(e) => handleChange('customer_phone_2', e.target.value)}
                  placeholder="0555 123 456"
                  className={errors.customer_phone_2 ? 'error' : ''}
                />
                <span className="hint">{t('checkout.phone2Hint')}</span>
                {errors.customer_phone_2 && (
                  <span className="error-message">{errors.customer_phone_2}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="customer_height">Votre taille (cm) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="customer_height"
                  value={formData.customer_height}
                  onChange={(e) => handleChange('customer_height', e.target.value)}
                  placeholder="Ex: 165"
                  className={errors.customer_height ? 'error' : ''}
                />
                {errors.customer_height && (
                  <span className="error-message">{errors.customer_height}</span>
                )}
              </div>
            </section>

            {/* Delivery */}
            <section className="form-section">
              <h2 className="section-title">
                <span className="section-icon">2</span>
                {t('checkout.delivery')}
              </h2>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Type de livraison *</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <label className={`radio-option ${formData.delivery_type === 'agency' ? 'selected' : ''}`} style={{ flex: 1, cursor: 'pointer' }}>
                    <input type="radio" name="delivery_type" value="agency"
                      checked={formData.delivery_type === 'agency'}
                      onChange={() => handleChange('delivery_type', 'agency')}
                      style={{ display: 'none' }}
                    />
                    <div className="radio-content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                      <strong style={{ fontSize: '14px' }}>📦 Retrait en agence</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vous retirez chez Yalidine / ZR</span>
                    </div>
                  </label>
                  <label className={`radio-option ${formData.delivery_type === 'home' ? 'selected' : ''}`} style={{ flex: 1, cursor: 'pointer' }}>
                    <input type="radio" name="delivery_type" value="home"
                      checked={formData.delivery_type === 'home'}
                      onChange={() => handleChange('delivery_type', 'home')}
                      style={{ display: 'none' }}
                    />
                    <div className="radio-content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                      <strong style={{ fontSize: '14px' }}>🚪 Livraison à domicile</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Livré directement chez vous</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="wilaya">{t('checkout.wilaya')} *</label>
                  <select
                    id="wilaya"
                    value={formData.wilaya}
                    onChange={(e) => handleChange('wilaya', e.target.value)}
                    className={errors.wilaya ? 'error' : ''}
                  >
                    <option value="">{t('checkout.wilaya')}</option>
                    {WILAYAS.map((w, i) => (
                      <option key={i} value={w}>{w}</option>
                    ))}
                  </select>
                  {errors.wilaya && (
                    <span className="error-message">{errors.wilaya}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="commune">{t('checkout.commune')} *</label>
                  <input
                    type="text"
                    id="commune"
                    value={formData.commune}
                    onChange={(e) => handleChange('commune', e.target.value)}
                    placeholder={t('checkout.commune')}
                    className={errors.commune ? 'error' : ''}
                  />
                  {errors.commune && (
                    <span className="error-message">{errors.commune}</span>
                  )}
                </div>
              </div>

              {formData.delivery_type === 'home' && (
                <div className="form-group">
                  <label htmlFor="address">{t('checkout.address')} *</label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder={t('checkout.addressHint')}
                    rows={3}
                    className={errors.address ? 'error' : ''}
                  />
                  {errors.address && (
                    <span className="error-message">{errors.address}</span>
                  )}
                </div>
              )}
            </section>

            {/* Delivery method */}
            <section className="form-section">
              <h2 className="section-title">
                <span className="section-icon">3</span>
                {t('checkout.deliveryMethod')}
              </h2>
              <p className="section-hint">{t('checkout.deliveryMethodHint')}</p>

              <div className="radio-group">
                <label className={`radio-option ${formData.delivery_method === 'yalidine' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="delivery_method"
                    value="yalidine"
                    checked={formData.delivery_method === 'yalidine'}
                    onChange={() => handleChange('delivery_method', 'yalidine')}
                  />
                  <div className="radio-content">
                    <Truck size={20} />
                    <span className="radio-label">{t('checkout.yalidine')}</span>
                  </div>
                </label>

                <label className={`radio-option ${formData.delivery_method === 'zr' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="delivery_method"
                    value="zr"
                    checked={formData.delivery_method === 'zr'}
                    onChange={() => handleChange('delivery_method', 'zr')}
                  />
                  <div className="radio-content">
                    <Truck size={20} />
                    <span className="radio-label">{t('checkout.zr')}</span>
                  </div>
                </label>
              </div>
            </section>

            {/* Payment */}
            <section className="form-section">
              <h2 className="section-title">
                <span className="section-icon">4</span>
                {t('checkout.paymentMethod')}
              </h2>

              <div className="cod-info">
                <CreditCard size={24} />
                <div>
                  <strong>{t('checkout.cod')}</strong>
                  <p>{t('checkout.codDesc')}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Summary sidebar */}
          <div className="checkout-sidebar">
            <div className="summary-card">
              <h2 style={{
                fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
              }}>
                {t('checkout.orderSummary')}
              </h2>

              {/* Items preview */}
              <div className="items-preview">
                {cartItems.map(item => (
                  <div key={item.variantId} className="preview-item">
                    <span className="preview-qty">{item.quantity}x</span>
                    <span className="preview-name">{item.name}</span>
                    <span className="preview-price">{(item.price * item.quantity).toLocaleString()} DZD</span>
                  </div>
                ))}
              </div>

              <div className="summary-divider" />

              <div className="summary-row">
                <span>{t('cart.subtotal')}</span>
                <span>{subtotal.toLocaleString()} DZD</span>
              </div>

              <div className="summary-row">
                <span>{t('checkout.delivery')}</span>
                <span>{deliveryFee.toLocaleString()} DZD</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-row total">
                <span>{t('common.total')}</span>
                <span>{total.toLocaleString()} DZD</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="submit-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    {t('checkout.placeOrder')}
                  </>
                )}
              </button>

              {errors.submit && (
                <div className="submit-error">
                  <AlertCircle size={16} />
                  {errors.submit}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Styles */}
      <style>{`
        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .checkout-main {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-section {
          background: var(--white);
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          font-family: var(--font-display);
        }

        [dir="rtl"] .section-title {
          font-family: var(--font-arabic);
        }

        .section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--gold);
          color: var(--white);
          border-radius: 50%;
          font-size: 14px;
          font-weight: 600;
        }

        .section-hint {
          color: var(--text-muted);
          font-size: 13px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--text);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 15px;
          background: var(--white);
          color: var(--text);
          transition: border-color 0.2s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--gold);
        }

        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
          border-color: var(--error);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-group .hint {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .error-message {
          display: block;
          font-size: 12px;
          color: var(--error);
          margin-top: 4px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .radio-option {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 2px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .radio-option.selected {
          border-color: var(--gold);
          background: var(--cream);
        }

        .radio-option input {
          display: none;
        }

        .radio-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .radio-label {
          font-weight: 500;
        }

        .cod-info {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: var(--beige);
          border-radius: 12px;
        }

        .cod-info strong {
          display: block;
          margin-bottom: 4px;
          color: var(--text);
        }

        .cod-info p {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }

        /* Sidebar */
        .checkout-sidebar {
          order: -1;
        }

        .summary-card {
          background: var(--white);
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .items-preview {
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .preview-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px solid var(--border);
        }

        .preview-item:last-child {
          border-bottom: none;
        }

        .preview-qty {
          color: var(--text-muted);
          min-width: 24px;
        }

        .preview-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .preview-price {
          font-weight: 500;
          white-space: nowrap;
        }

        .summary-divider {
          height: 1px;
          background: var(--border);
          margin: 16px 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .summary-row.total {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
        }

        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: var(--gold);
          color: var(--white);
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 24px;
          transition: background 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--gold-light);
        }

        .submit-btn:disabled {
          background: var(--taupe);
          cursor: not-allowed;
        }

        .submit-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
          color: var(--error);
          font-size: 14px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (min-width: 768px) {
          .checkout-form {
            flex-direction: row;
            gap: 32px;
          }

          .checkout-main {
            flex: 1;
          }

          .checkout-sidebar {
            order: 1;
            flex: 0 0 320px;
          }

          .summary-card {
            position: sticky;
            top: calc(var(--header-height) + 24px);
          }

          .form-row {
            grid-template-columns: 1fr 1fr;
          }

          .radio-group {
            flex-direction: row;
          }

          .radio-option {
            flex: 1;
          }
        }
      `}</style>
    </Layout>
  )
}
