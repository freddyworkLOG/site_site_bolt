import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Truck, Banknote, BadgeCheck, ArrowLeft } from 'lucide-react'
import Layout from '../components/Layout'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import { supabase } from '../lib/supabase'

export default function Home() {
  const { t, i18n } = useTranslation()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const isRTL = i18n.language === 'ar'

  useEffect(() => {
    async function fetchProducts() {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name_en,
            name_fr,
            name_ar,
            images,
            created_at,
            product_variants (
              price_dzd
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6)

        if (!error && data) {
          const formatted = data.map(product => {
            const prices = product.product_variants?.map(v => v.price_dzd) || []
            const minPrice = prices.length > 0 ? Math.min(...prices) : null

            return {
              id: product.id,
              name_en: product.name_en,
              name_fr: product.name_fr,
              name_ar: product.name_ar,
              images: product.images,
              minPrice,
            }
          })
          setProducts(formatted)
        }
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <Layout>
      {/* HERO SECTION */}
      <section
        style={{
          position: 'relative',
          minHeight: '70vh',
          height: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, var(--beige) 0%, var(--cream) 50%, var(--beige-dark) 100%)`,
          overflow: 'hidden',
        }}
      >
        {/* Decorative pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            textAlign: 'center',
            padding: '32px 16px',
          }}
        >
          <h1
            style={{
              fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
              fontSize: 'clamp(28px, 6vw, 52px)',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '16px',
              letterSpacing: isRTL ? '0' : '0.03em',
            }}
          >
            {t('home.heroTitle')}
          </h1>
          <p
            style={{
              fontSize: 'clamp(16px, 3vw, 20px)',
              color: 'var(--text-muted)',
              maxWidth: '500px',
              marginInline: 'auto',
              marginBottom: '32px',
              lineHeight: 1.5,
            }}
          >
            {t('home.heroSubtitle')}
          </p>
          <Link
            to="/shop"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 32px',
              backgroundColor: 'var(--rose)',
              color: 'var(--white)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            {t('home.shopNow')}
            {!isRTL && <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />}
            {isRTL && <ArrowLeft size={18} />}
          </Link>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ padding: '48px 0', backgroundColor: 'var(--beige)' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <h2
              style={{
                fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
                fontSize: 'clamp(24px, 5vw, 32px)',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              {t('home.featuredTitle')}
            </h2>
            <Link
              to="/shop"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--rose)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {t('home.viewAll')}
              {!isRTL && <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />}
              {isRTL && <ArrowLeft size={16} />}
            </Link>
          </div>

          {loading ? (
            // Skeleton loading
            <div className="products-grid">
              {[...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            // Empty state
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
                {t('home.noProducts')}
              </p>
            </div>
          ) : (
            // Products grid
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Desktop products grid styles */}
      <style>{`
        .products-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (min-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 24px !important;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* TRUST / USP STRIP */}
      <section style={{ padding: '48px 0', backgroundColor: 'var(--white)' }}>
        <div className="container">
          <div className="trust-strip">
            {/* Cash on Delivery */}
            <div className="trust-item">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--beige)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--rose)',
                }}
              >
                <Banknote size={24} />
              </div>
              <div>
                <h3 className="trust-title">
                  {t('home.trust.cashOnDelivery')}
                </h3>
                <p className="trust-desc">
                  {t('home.trust.cashOnDeliveryDesc')}
                </p>
              </div>
            </div>

            {/* Delivery Nationwide */}
            <div className="trust-item">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--beige)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--rose)',
                }}
              >
                <Truck size={24} />
              </div>
              <div>
                <h3 className="trust-title">
                  {t('home.trust.nationwideDelivery')}
                </h3>
                <p className="trust-desc">
                  {t('home.trust.nationwideDeliveryDesc')}
                </p>
              </div>
            </div>

            {/* Quality Guaranteed */}
            <div className="trust-item">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--beige)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--rose)',
                }}
              >
                <BadgeCheck size={24} />
              </div>
              <div>
                <h3 className="trust-title">
                  {t('home.trust.qualityGuaranteed')}
                </h3>
                <p className="trust-desc">
                  {t('home.trust.qualityGuaranteedDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip styles */}
      <style>{`
        .trust-strip {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .trust-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .trust-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }
        .trust-desc {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        [dir="rtl"] .trust-item {
          text-align: right;
        }
        @media (min-width: 768px) {
          .trust-strip {
            flex-direction: row !important;
            justify-content: space-between;
            gap: 24px !important;
          }
          .trust-item {
            flex: 1;
            max-width: 280px;
            text-align: center !important;
            flex-direction: column;
            align-items: center !important;
          }
          [dir="rtl"] .trust-item {
            text-align: center !important;
          }
        }
      `}</style>
    </Layout>
  )
}
