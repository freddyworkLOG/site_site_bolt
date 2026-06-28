import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  const { t, i18n } = useTranslation()

  const name = product[`name_${i18n.language}`] || product.name_en || product.name
  const mainImage = product.images?.[0] || product.image || null
  const minPrice = product.minPrice ?? product.price

  return (
    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          backgroundColor: 'var(--white)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <div
          style={{
            aspectRatio: '3/4',
            backgroundColor: 'var(--beige)',
            overflow: 'hidden',
          }}
        >
          {mainImage ? (
            <img
              src={mainImage}
              alt={name}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '14px',
              }}
            >
              {t('common.viewProduct')}
            </div>
          )}
        </div>
        <div style={{ padding: '12px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: '6px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </h3>
          {minPrice != null && (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--gold)',
                fontWeight: 600,
              }}
            >
              {t('home.fromPrice', { price: minPrice.toLocaleString() })}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

// Skeleton version for loading states
export function ProductCardSkeleton() {
  return (
    <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div
        style={{
          aspectRatio: '3/4',
          backgroundColor: 'var(--border)',
          borderRadius: '12px',
          marginBottom: '12px',
        }}
      />
      <div
        style={{
          height: '18px',
          width: '70%',
          backgroundColor: 'var(--border)',
          borderRadius: '4px',
          marginBottom: '8px',
        }}
      />
      <div
        style={{
          height: '14px',
          width: '40%',
          backgroundColor: 'var(--border)',
          borderRadius: '4px',
        }}
      />
    </div>
  )
}
