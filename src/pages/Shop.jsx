import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import Layout from '../components/Layout'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import { supabase } from '../lib/supabase'

// Category list (must match Home.jsx)
const CATEGORY_SLUGS = ['abayas', 'jilbabs', 'kimonos', 'ensembles', 'accessories']

export default function Shop() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isRTL = i18n.language === 'ar'

  // State
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Filters - initialize from URL
  const [selectedCategory, setSelectedCategory] = useState(() =>
    searchParams.get('category') || ''
  )
  const [selectedSizes, setSelectedSizes] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [sortBy, setSortBy] = useState('newest')

  // Available filter options (derived from products)
  const [availableSizes, setAvailableSizes] = useState([])
  const [availableColors, setAvailableColors] = useState([])

  // Fetch products on mount
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
            category,
            created_at,
            product_variants (
              size,
              color_en,
              color_fr,
              color_ar,
              price_dzd,
              is_active
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setAllProducts(data)

          // Extract unique sizes and colors from active variants
          const sizes = new Set()
          const colorsMap = new Map()

          data.forEach(product => {
            product.product_variants?.forEach(variant => {
              if (variant.is_active !== false && variant.size) {
                sizes.add(variant.size)
              }
              if (variant.is_active !== false && variant.color_en) {
                colorsMap.set(variant.color_en, {
                  en: variant.color_en,
                  fr: variant.color_fr || variant.color_en,
                  ar: variant.color_ar || variant.color_en,
                })
              }
            })
          })

          const sizeOrder = ['S', 'M', 'L', 'XL', 'Free Size']
          const sortedSizes = Array.from(sizes).sort((a, b) => {
            const aIdx = sizeOrder.indexOf(a)
            const bIdx = sizeOrder.indexOf(b)
            if (aIdx === -1 && bIdx === -1) return a.localeCompare(b)
            if (aIdx === -1) return 1
            if (bIdx === -1) return -1
            return aIdx - bIdx
          })
          setAvailableSizes(sortedSizes)
          setAvailableColors(Array.from(colorsMap.values()))
        }
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Update URL when category changes from URL param
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam && CATEGORY_SLUGS.includes(categoryParam)) {
      setSelectedCategory(categoryParam)
    }
  }, [searchParams])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = allProducts.map(product => {
      const activeVariants = product.product_variants?.filter(v => v.is_active !== false) || []
      const prices = activeVariants.map(v => v.price_dzd)
      const minPrice = prices.length > 0 ? Math.min(...prices) : null

      return {
        ...product,
        minPrice,
        activeVariants,
      }
    }).filter(product => product.minPrice !== null)

    // Filter by category
    if (selectedCategory) {
      result = result.filter(product => product.category === selectedCategory)
    }

    // Filter by sizes
    if (selectedSizes.length > 0) {
      result = result.filter(product =>
        product.activeVariants.some(v => selectedSizes.includes(v.size))
      )
    }

    // Filter by colors
    if (selectedColors.length > 0) {
      result = result.filter(product =>
        product.activeVariants.some(v =>
          selectedColors.some(c => v.color_en === c || v.color_fr === c || v.color_ar === c)
        )
      )
    }

    // Sort
    switch (sortBy) {
      case 'priceLowHigh':
        result.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0))
        break
      case 'priceHighLow':
        result.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0))
        break
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
    }

    return result
  }, [allProducts, selectedCategory, selectedSizes, selectedColors, sortBy])

  // Handlers
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category)
    if (category) {
      setSearchParams({ category })
    } else {
      setSearchParams({})
    }
  }, [setSearchParams])

  const toggleSize = useCallback((size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }, [])

  const toggleColor = useCallback((colorEn) => {
    setSelectedColors(prev =>
      prev.includes(colorEn) ? prev.filter(c => c !== colorEn) : [...prev, colorEn]
    )
  }, [])

  const clearAllFilters = useCallback(() => {
    setSelectedCategory('')
    setSelectedSizes([])
    setSelectedColors([])
    setSearchParams({})
  }, [setSearchParams])

  const hasActiveFilters = selectedCategory || selectedSizes.length > 0 || selectedColors.length > 0

  // Filter panel content (shared between mobile and desktop)
  const FilterContent = ({ inDrawer = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Category filter */}
      <div>
        <h4 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '12px',
        }}>
          {t('common.filter')}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: !selectedCategory ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            <input
              type="radio"
              name="category"
              checked={!selectedCategory}
              onChange={() => handleCategoryChange('')}
              style={{ accentColor: 'var(--gold)' }}
            />
            {t('shop.allCategories')}
          </label>
          {CATEGORY_SLUGS.map(slug => (
            <label
              key={slug}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: selectedCategory === slug ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              <input
                type="radio"
                name="category"
                checked={selectedCategory === slug}
                onChange={() => handleCategoryChange(slug)}
                style={{ accentColor: 'var(--gold)' }}
              />
              {t(`shop.categories.${slug}`)}
            </label>
          ))}
        </div>
      </div>

      {/* Size filter */}
      {availableSizes.length > 0 && (
        <div>
          <h4 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '12px',
          }}>
            {t('common.size')}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                style={{
                  padding: '8px 16px',
                  border: selectedSizes.includes(size) ? '2px solid var(--gold)' : '1px solid var(--border)',
                  borderRadius: '20px',
                  backgroundColor: selectedSizes.includes(size) ? 'var(--cream)' : 'var(--white)',
                  color: selectedSizes.includes(size) ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {size === 'Free Size' ? t('shop.sizes.freeSize') : size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color filter */}
      {availableColors.length > 0 && (
        <div>
          <h4 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '12px',
          }}>
            {t('common.color')}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {availableColors.map(color => (
              <button
                key={color.en}
                onClick={() => toggleColor(color.en)}
                style={{
                  padding: '8px 16px',
                  border: selectedColors.includes(color.en) ? '2px solid var(--gold)' : '1px solid var(--border)',
                  borderRadius: '20px',
                  backgroundColor: selectedColors.includes(color.en) ? 'var(--cream)' : 'var(--white)',
                  color: selectedColors.includes(color.en) ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {color[i18n.language === 'ar' ? 'ar' : i18n.language === 'fr' ? 'fr' : 'en']}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          style={{
            padding: '12px',
            border: 'none',
            backgroundColor: 'var(--beige)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {t('shop.clearAll')}
        </button>
      )}
    </div>
  )

  return (
    <Layout>
      {/* Page header */}
      <div className="container" style={{ paddingTop: '24px' }}>
        <h1
          style={{
            fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
            fontSize: 'clamp(28px, 5vw, 36px)',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '24px',
          }}
        >
          {t('shop.title')}
        </h1>
      </div>

      {/* Main layout */}
      <div className="shop-layout">
        {/* Desktop filter sidebar */}
        <aside className="filter-sidebar">
          <FilterContent />
        </aside>

        {/* Product grid area */}
        <main>
          {/* Mobile filter bar + sort */}
          <div className="mobile-controls">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                backgroundColor: 'var(--white)',
                color: 'var(--text)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={18} />
              {t('shop.filters')}
              {hasActiveFilters && (
                <span
                  style={{
                    backgroundColor: 'var(--gold)',
                    color: 'var(--white)',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {[selectedCategory, ...selectedSizes, ...selectedColors].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Sort dropdown */}
            <div className="sort-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '10px 32px 10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--white)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238C7B6B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: isRTL ? '12px center' : 'calc(100% - 12px) center',
                }}
              >
                <option value="newest">{t('shop.newest')}</option>
                <option value="priceLowHigh">{t('shop.priceLowHigh')}</option>
                <option value="priceHighLow">{t('shop.priceHighLow')}</option>
              </select>
            </div>
          </div>

          {/* Desktop sort */}
          <div className="desktop-sort">
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {filteredProducts.length} {t('cart.items').toLowerCase()}
            </span>
            <div className="sort-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 28px 8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--white)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238C7B6B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: isRTL ? '12px center' : 'calc(100% - 12px) center',
                }}
              >
                <option value="newest">{t('shop.newest')}</option>
                <option value="priceLowHigh">{t('shop.priceLowHigh')}</option>
                <option value="priceHighLow">{t('shop.priceHighLow')}</option>
              </select>
            </div>
          </div>

          {/* Products grid */}
          {loading ? (
            <div className="products-grid">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                {t('shop.noProducts')}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    backgroundColor: 'var(--gold)',
                    color: 'var(--white)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {t('shop.clearFilters')}
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              insetInline: 0,
              backgroundColor: 'var(--white)',
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}>
              <h3 style={{
                fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text)',
              }}>
                {t('shop.filters')}
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  border: 'none',
                  backgroundColor: 'var(--beige)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} color="var(--text)" />
              </button>
            </div>

            {/* Filters */}
            <FilterContent inDrawer />

            {/* Apply button */}
            <button
              onClick={() => setMobileFiltersOpen(false)}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px',
                border: 'none',
                backgroundColor: 'var(--gold)',
                color: 'var(--white)',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('shop.apply')}
            </button>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .shop-layout {
          display: flex;
          gap: 32px;
          padding-bottom: 48px;
        }
        .filter-sidebar {
          display: none;
          flex-shrink: 0;
          width: 240px;
        }
        .mobile-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .desktop-sort {
          display: none;
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 16px;
          text-align: center;
        }

        @media (min-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
        }

        @media (min-width: 1024px) {
          .shop-layout {
            padding-inline-start: 32px;
            padding-inline-end: 32px;
          }
          .filter-sidebar {
            display: block;
          }
          .mobile-controls {
            display: none;
          }
          .desktop-sort {
            display: flex;
          }
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .products-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .filter-sidebar {
            width: 280px;
          }
        }

        [dir="rtl"] .sort-wrapper select {
          padding: 10px 12px 10px 32px;
          background-position: 12px center !important;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Layout>
  )
}
