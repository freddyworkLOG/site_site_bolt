import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShoppingBag, AlertCircle, Check } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

const COLOR_PALETTE = [
  { hex: '#1a1a1a', color_en: 'Black' },
  { hex: '#ffffff', color_en: 'White' },
  { hex: '#E3D3B5', color_en: 'Beige' },
  { hex: '#F5EFE0', color_en: 'Cream' },
  { hex: '#6B4226', color_en: 'Brown' },
  { hex: '#C19A6B', color_en: 'Camel' },
  { hex: '#8C8C8C', color_en: 'Grey' },
  { hex: '#36454F', color_en: 'Charcoal' },
  { hex: '#1B2A4A', color_en: 'Navy' },
  { hex: '#6B6E3A', color_en: 'Olive' },
  { hex: '#5E2129', color_en: 'Burgundy' },
  { hex: '#C9A0A6', color_en: 'Dusty Rose' },
  { hex: '#FFFFF0', color_en: 'Ivory' },
  { hex: '#F8F4E9', color_en: 'Off White' },
  { hex: '#D3D3D3', color_en: 'Light Grey' },
  { hex: '#696969', color_en: 'Dark Grey' },
  { hex: '#8B7D7B', color_en: 'Taupe' },
  { hex: '#C3B091', color_en: 'Khaki' },
  { hex: '#4169E1', color_en: 'Royal Blue' },
  { hex: '#87CEEB', color_en: 'Sky Blue' },
  { hex: '#40E0D0', color_en: 'Turquoise' },
  { hex: '#98FF98', color_en: 'Mint' },
  { hex: '#9DC183', color_en: 'Sage' },
  { hex: '#228B22', color_en: 'Forest Green' },
  { hex: '#50C878', color_en: 'Emerald' },
  { hex: '#FFB6C1', color_en: 'Blush' },
  { hex: '#FF69B4', color_en: 'Hot Pink' },
  { hex: '#C7158A', color_en: 'Fuchsia' },
  { hex: '#FF7F50', color_en: 'Coral' },
  { hex: '#FA8072', color_en: 'Salmon' },
  { hex: '#CC0000', color_en: 'Red' },
  { hex: '#CB4154', color_en: 'Brick' },
  { hex: '#C2B280', color_en: 'Sand' },
  { hex: '#FFDB58', color_en: 'Mustard' },
  { hex: '#FFD700', color_en: 'Gold' },
  { hex: '#B87333', color_en: 'Copper' },
  { hex: '#E2725B', color_en: 'Terracotta' },
  { hex: '#3D1C02', color_en: 'Chocolate' },
  { hex: '#6F4E37', color_en: 'Coffee' },
  { hex: '#B7410E', color_en: 'Rust' },
  { hex: '#E6E6FA', color_en: 'Lavender' },
  { hex: '#C8A2C8', color_en: 'Lilac' },
  { hex: '#800080', color_en: 'Purple' },
  { hex: '#8E4585', color_en: 'Plum' },
  { hex: '#B784A7', color_en: 'Mauve' },
  { hex: '#008080', color_en: 'Teal' },
  { hex: '#003366', color_en: 'Petrol' },
  { hex: '#4B0082', color_en: 'Indigo' },
]

export default function ProductPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      if (!supabase || !id) {
        setError('No product ID')
        setLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            id,
            name_en,
            name_fr,
            name_ar,
            description_en,
            description_fr,
            description_ar,
            images,
            category,
            product_variants (
              id,
              sku,
              size,
              color_en,
              color_fr,
              color_ar,
              price_dzd,
              stock_quantity,
              is_active
            )
          `)
          .eq('id', id)
          .eq('is_active', true)
          .single()

        if (fetchError) throw fetchError
        if (!data) throw new Error('Product not found')

        setProduct(data)
        setVariants(data.product_variants?.filter(v => v.is_active !== false) || [])
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  // Derived data
  const name = product ? (product[`name_${i18n.language}`] || product.name_en) : ''
  const description = product ? (product[`description_${i18n.language}`] || product.description_en) : ''
  const images = product?.images || []

  // Available sizes from variants
  const availableSizes = useMemo(() => {
    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
    const sizeOrder = ['S', 'M', 'L', 'XL', 'Free Size']
    return sizes.sort((a, b) => {
      const aIdx = sizeOrder.indexOf(a)
      const bIdx = sizeOrder.indexOf(b)
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b)
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    })
  }, [variants])

  // Available colors based on selected size
  const availableColors = useMemo(() => {
    let filtered = variants
    if (selectedSize) {
      filtered = filtered.filter(v => v.size === selectedSize)
    }
    const colorMap = new Map()
    filtered.forEach(v => {
      if (v.color_en) {
        colorMap.set(v.color_en, {
          en: v.color_en,
          fr: v.color_fr || v.color_en,
          ar: v.color_ar || v.color_en,
        })
      }
    })
    return Array.from(colorMap.values())
  }, [variants, selectedSize])

  // Selected variant
  const selectedVariant = useMemo(() => {
    if (!selectedSize) return null
    return variants.find(v =>
      v.size === selectedSize &&
      (!selectedColor || v.color_en === selectedColor)
    )
  }, [variants, selectedSize, selectedColor])

  // Price display
  const priceDisplay = useMemo(() => {
    if (!variants.length) return null
    const prices = variants.map(v => v.price_dzd)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    if (selectedVariant) {
      return `${selectedVariant.price_dzd.toLocaleString()} DZD`
    }

    if (minPrice === maxPrice) {
      return `${minPrice.toLocaleString()} DZD`
    }
    return `${t('common.from')} ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} DZD`
  }, [variants, selectedVariant, t])

  // Stock status
  const stockStatus = useMemo(() => {
    if (!selectedVariant) return null
    const stock = selectedVariant.stock_quantity || 0
    if (stock === 0) return { status: 'out', label: t('common.outOfStock') }
    if (stock <= 5) return { status: 'low', label: `${stock} ${t('common.inStock')}` }
    return { status: 'ok', label: t('common.inStock') }
  }, [selectedVariant, t])

  // Reset color when size changes
  useEffect(() => {
    if (selectedSize && selectedColor) {
      const colorsForSize = variants
        .filter(v => v.size === selectedSize)
        .map(v => v.color_en)
      if (!colorsForSize.includes(selectedColor)) {
        setSelectedColor(null)
      }
    }
  }, [selectedSize, variants, selectedColor])

  // Add to cart
  const handleAddToCart = async () => {
    if (!selectedVariant) return

    setAddingToCart(true)
    try {
      const cartItems = JSON.parse(localStorage.getItem('cart_items') || '[]')

      const existingIndex = cartItems.findIndex(item => item.variantId === selectedVariant.id)

      const cartItem = {
        variantId: selectedVariant.id,
        productId: product.id,
        name: name,
        image: images[0] || null,
        size: selectedVariant.size,
        color: selectedColor ? (i18n.language === 'ar'
          ? (availableColors.find(c => c.en === selectedColor)?.ar || selectedColor)
          : i18n.language === 'fr'
            ? (availableColors.find(c => c.en === selectedColor)?.fr || selectedColor)
            : selectedColor) : null,
        price: selectedVariant.price_dzd,
        quantity: existingIndex >= 0 ? cartItems[existingIndex].quantity + quantity : quantity,
      }

      if (existingIndex >= 0) {
        cartItems[existingIndex] = cartItem
      } else {
        cartItems.push(cartItem)
      }

      localStorage.setItem('cart_items', JSON.stringify(cartItems))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    } catch (err) {
      console.error('Error adding to cart:', err)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleQuantityChange = (delta) => {
    const maxStock = selectedVariant?.stock_quantity || 99
    setQuantity(prev => Math.max(1, Math.min(prev + delta, maxStock)))
  }

  const canAddToCart = selectedVariant && (selectedVariant.stock_quantity || 0) > 0

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '40px 16px' }}>
          <div className="product-skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-content">
              <div className="skeleton-title" />
              <div className="skeleton-price" />
              <div className="skeleton-text" />
              <div className="skeleton-text" />
              <div className="skeleton-chips" />
              <div className="skeleton-button" />
            </div>
          </div>
          <style>{`
            .product-skeleton { display: flex; flex-direction: column; gap: 24px; }
            .skeleton-image { aspect-ratio: 3/4; background: var(--border); border-radius: 12px; max-width: 400px; margin: 0 auto; width: 100%; }
            .skeleton-content { flex: 1; }
            .skeleton-title { height: 28px; width: 70%; background: var(--border); border-radius: 4px; margin-bottom: 12px; }
            .skeleton-price { height: 24px; width: 40%; background: var(--border); border-radius: 4px; margin-bottom: 24px; }
            .skeleton-text { height: 16px; width: 100%; background: var(--border); border-radius: 4px; margin-bottom: 8px; }
            .skeleton-chips { display: flex; gap: 8px; margin-top: 24px; }
            .skeleton-chips > div { height: 40px; width: 60px; background: var(--border); border-radius: 20px; }
            .skeleton-button { height: 48px; width: 200px; background: var(--border); border-radius: 8px; margin-top: 24px; }
            @media (min-width: 768px) {
              .product-skeleton { flex-direction: row; gap: 48px; }
              .skeleton-image { max-width: 500px; }
            }
          `}</style>
        </div>
      </Layout>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <Layout>
        <div className="container" style={{ padding: '40px 16px', textAlign: 'center' }}>
          <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '8px' }}>
            {error || t('common.error')}
          </h1>
          <button
            onClick={() => navigate('/shop')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--gold)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '16px',
            }}
          >
            {t('common.backToShop')}
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container" style={{ padding: '24px 16px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
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

        {/* Product layout */}
        <div className="product-layout">
          {/* Images */}
          <div className="product-images">
            <div className="main-image">
              {images[currentImageIndex] ? (
                <img src={images[currentImageIndex]} alt={name} />
              ) : (
                <div className="no-image">
                  <ShoppingBag size={48} color="var(--text-muted)" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="image-thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={currentImageIndex === idx ? 'active' : ''}
                  >
                    <img src={img} alt={`${name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="product-info">
            {/* Category */}
            {product.category && (
              <span className="category-badge">
                {t(`shop.categories.${product.category}`)}
              </span>
            )}

            {/* Name */}
            <h1
              style={{
                fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
                fontSize: 'clamp(24px, 5vw, 32px)',
                fontWeight: 600,
                color: 'var(--text)',
                marginTop: '12px',
                marginBottom: '8px',
              }}
            >
              {name}
            </h1>

            {/* Price */}
            <p
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--gold)',
                marginBottom: '24px',
              }}
            >
              {priceDisplay}
            </p>

            {/* Size selector */}
            {availableSizes.length > 0 && (
              <div className="selector-section">
                <label className="selector-label">{t('common.size')}</label>
                <div className="chips">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`chip ${selectedSize === size ? 'selected' : ''}`}
                    >
                      {size === 'Free Size' ? t('shop.sizes.freeSize') : size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selector */}
            {availableColors.length > 0 && selectedSize && (
              <div className="selector-section">
                <label className="selector-label">{t('common.color')}</label>
                <div className="chips">
                  {availableColors.map(color => {
                    const palette = COLOR_PALETTE.find(c => c.color_en === color.en)
                    const colorName = i18n.language === 'ar' ? color.ar : i18n.language === 'fr' ? color.fr : color.en
                    return (
                      <button
                        key={color.en}
                        onClick={() => setSelectedColor(color.en)}
                        className={`color-option ${selectedColor === color.en ? 'selected' : ''}`}
                      >
                        <span className="color-dot" style={{
                          width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                          backgroundColor: palette?.hex || '#cccccc',
                          border: (palette?.hex === '#ffffff' || palette?.hex === '#F5EFE0') ? '1px solid #ddd' : '1px solid rgba(0,0,0,0.08)'
                        }} />
                        <span>{colorName}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Stock status */}
            {stockStatus && (
              <div
                className={`stock-status ${stockStatus.status}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '16px',
                  fontSize: '14px',
                }}
              >
                {stockStatus.status === 'out' && <AlertCircle size={16} />}
                {stockStatus.status !== 'out' && <Check size={16} />}
                {stockStatus.label}
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="action-section" style={{ marginTop: '24px' }}>
              {/* Quantity */}
              <div className="quantity-selector">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={18} />
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={!selectedVariant || quantity >= (selectedVariant?.stock_quantity || 99)}
                  aria-label="Increase quantity"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart || addingToCart}
                className={`add-to-cart-btn ${addedToCart ? 'added' : ''}`}
              >
                {addedToCart ? (
                  <>
                    <Check size={20} />
                    {t('common.viewProduct')}
                  </>
                ) : addingToCart ? (
                  t('common.loading')
                ) : !selectedVariant ? (
                  t('product.selectVariantFirst')
                ) : !canAddToCart ? (
                  t('product.outOfStock')
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    {t('product.addToCart')}
                  </>
                )}
              </button>
            </div>

            {/* Description */}
            {description && (
              <div className="description-section" style={{ marginTop: '32px' }}>
                <h2
                  style={{
                    fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}
                >
                  {t('product.description')}
                </h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .product-layout {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .main-image {
          aspect-ratio: 3/4;
          background: var(--beige);
          border-radius: 12px;
          overflow: hidden;
        }

        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .main-image .no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-thumbnails {
          display: flex;
          gap: 12px;
          margin-top: 12px;
          overflow-x: auto;
        }

        .image-thumbnails button {
          width: 70px;
          height: 90px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid transparent;
          background: none;
          cursor: pointer;
          flex-shrink: 0;
          padding: 0;
        }

        .image-thumbnails button.active {
          border-color: var(--gold);
        }

        .image-thumbnails img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .category-badge {
          display: inline-block;
          padding: 6px 12px;
          background: var(--beige);
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-radius: 20px;
        }

        .selector-section {
          margin-bottom: 16px;
        }

        .selector-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 8px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chip {
          padding: 10px 20px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: var(--white);
          color: var(--text-muted);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .chip:hover {
          border-color: var(--gold-light);
        }

        .chip.selected {
          border: 2px solid var(--gold);
          color: var(--text);
          background: var(--cream);
        }

        .color-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--white);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          transition: border-color 0.2s ease;
        }
        .color-option.selected {
          border-color: var(--gold);
          background: var(--cream);
        }
        .color-option:hover {
          border-color: var(--gold-light);
        }

        .stock-status.ok { color: var(--success); }
        .stock-status.low { color: var(--taupe); }
        .stock-status.out { color: var(--error); }

        .action-section {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--white);
        }

        .quantity-selector button {
          width: 44px;
          height: 44px;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
        }

        .quantity-selector button:disabled {
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .quantity-selector span {
          width: 44px;
          text-align: center;
          font-weight: 500;
          font-size: 16px;
        }

        .add-to-cart-btn {
          flex: 1;
          min-width: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 32px;
          background: var(--gold);
          color: var(--white);
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-to-cart-btn:hover:not(:disabled) {
          background: var(--gold-light);
        }

        .add-to-cart-btn:disabled {
          background: var(--border);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .add-to-cart-btn.added {
          background: var(--success);
        }

        @media (min-width: 768px) {
          .product-layout {
            flex-direction: row;
            gap: 48px;
          }

          .product-images {
            flex: 0 0 45%;
            max-width: 500px;
          }

          .product-info {
            flex: 1;
          }

          .action-section {
            flex-wrap: nowrap;
          }

          .add-to-cart-btn {
            flex: 1;
          }
        }
      `}</style>
    </Layout>
  )
}
