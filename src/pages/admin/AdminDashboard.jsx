import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Package, ShoppingBag, Users, AlertCircle, LogOut, Plus, Edit2, Trash2,
  X, Check, Loader2, ChevronDown, Eye, FileText, Truck, Search
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const TABS = ['dashboard', 'products', 'orders', 'sales']
const CATEGORIES = ['abayas', 'jilbabs', 'kimonos', 'ensembles', 'accessories']
const SIZES = ['S (36)', 'Taille 1 (38-40)', 'Taille 2 (42-44)', 'Taille 3 (Sur commande)']
const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

const COLOR_PALETTE = [
  { hex: '#1a1a1a', color_en: 'Black', color_fr: 'Noir', color_ar: 'أسود' },
  { hex: '#ffffff', color_en: 'White', color_fr: 'Blanc', color_ar: 'أبيض' },
  { hex: '#E3D3B5', color_en: 'Beige', color_fr: 'Beige', color_ar: 'بيج' },
  { hex: '#F5EFE0', color_en: 'Cream', color_fr: 'Crème', color_ar: 'كريمي' },
  { hex: '#6B4226', color_en: 'Brown', color_fr: 'Marron', color_ar: 'بني' },
  { hex: '#C19A6B', color_en: 'Camel', color_fr: 'Camel', color_ar: 'جملي' },
  { hex: '#8C8C8C', color_en: 'Grey', color_fr: 'Gris', color_ar: 'رمادي' },
  { hex: '#36454F', color_en: 'Charcoal', color_fr: 'Anthracite', color_ar: 'فحمي' },
  { hex: '#1B2A4A', color_en: 'Navy', color_fr: 'Bleu Marine', color_ar: 'كحلي' },
  { hex: '#6B6E3A', color_en: 'Olive', color_fr: 'Olive', color_ar: 'زيتي' },
  { hex: '#5E2129', color_en: 'Burgundy', color_fr: 'Bordeaux', color_ar: 'خمري' },
  { hex: '#C9A0A6', color_en: 'Dusty Rose', color_fr: 'Rose Poudré', color_ar: 'وردي ترابي' },
]

export default function AdminDashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  // Dashboard stats
  const [stats, setStats] = useState({ totalOrders: 0, totalProducts: 0, pendingOrders: 0 })

  // Products
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [productForm, setProductForm] = useState(getEmptyProduct())

  // Orders
  const [orders, setOrders] = useState([])
  // Manual sales
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [saleForm, setSaleForm] = useState({ product_id: '', variant_id: '', quantity: 1, unit_price: '', notes: '' })
  const [manualSales, setManualSales] = useState([])
  const [manualSalesLoading, setManualSalesLoading] = useState(false)

  
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Check auth on mount
  useEffect(() => {
    if (!supabase) {
      navigate('/admin/login')
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/admin/login')
      } else {
        setUser(session.user)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/admin/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  // Load data when tab changes
  useEffect(() => {
    if (loading || !user) return

    if (activeTab === 'dashboard') loadDashboard()
    else if (activeTab === 'products') loadProducts()
    else if (activeTab === 'orders') loadOrders()
    else if (activeTab === 'sales') { loadManualSales(); loadProducts() }
  }, [activeTab, loading, user])

  // Load dashboard stats
  const loadDashboard = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('id, status', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
      ])

      const pendingRes = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')

      setStats({
        totalOrders: ordersRes.count || 0,
        totalProducts: productsRes.count || 0,
        pendingOrders: pendingRes.count || 0,
      })
    } catch (err) {
      console.error('Error loading dashboard:', err)
    }
  }

  // Load products
  const loadProducts = async () => {
    setProductsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name_en, name_fr, name_ar,
          description_en, description_fr, description_ar,
          images, category, is_active,
          product_variants (id, sku, size, color_en, color_fr, color_ar, price_dzd, stock_quantity)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) setProducts(data)
    } catch (err) {
      console.error('Error loading products:', err)
    } finally {
      setProductsLoading(false)
    }
  }

  // Load orders
  const loadOrders = async () => {
    setOrdersLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (!error && data) setOrders(data)
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  // Product CRUD
  function getEmptyProduct() {
    return {
      name: '',
      description: '',
      price_dzd: '',
      category: 'abayas',
      images: [],
      is_active: true,
      selectedColors: {},
    }
  }

  // selectedColors shape: { color_en: { hex, color_fr, color_ar, sizes: { 'S (36)': { enabled, stock } } } }

  const openProductModal = (product = null) => {
    if (product) {
      const variants = product.product_variants || []
      const firstPrice = variants[0]?.price_dzd?.toString() || ''
      const selectedColors = {}
      for (const v of variants) {
        if (!selectedColors[v.color_en]) {
          const palette = COLOR_PALETTE.find(c => c.color_en === v.color_en)
          selectedColors[v.color_en] = {
            hex: palette?.hex || '#cccccc',
            color_fr: v.color_fr,
            color_ar: v.color_ar,
            sizes: Object.fromEntries(SIZES.map(s => [s, { enabled: false, stock: '' }]))
          }
        }
        if (selectedColors[v.color_en].sizes[v.size]) {
          selectedColors[v.color_en].sizes[v.size].enabled = true
          selectedColors[v.color_en].sizes[v.size].stock = v.stock_quantity?.toString() || ''
        }
      }
      setProductForm({
        name: product.name_en || '',
        description: product.description_en || '',
        price_dzd: firstPrice,
        category: product.category,
        images: product.images || [],
        is_active: product.is_active,
        selectedColors,
        _id: product.id
      })
      setEditingProduct(product)
    } else {
      setProductForm(getEmptyProduct())
      setEditingProduct(null)
    }
    setShowProductModal(true)
  }

  const closeProductModal = () => {
    setShowProductModal(false)
    setEditingProduct(null)
    setProductForm(getEmptyProduct())
  }

  const toggleColor = (c) => setProductForm(prev => {
    const sc = { ...prev.selectedColors }
    if (sc[c.color_en]) {
      delete sc[c.color_en]
    } else {
      sc[c.color_en] = {
        hex: c.hex, color_fr: c.color_fr, color_ar: c.color_ar,
        sizes: Object.fromEntries(SIZES.map(s => [s, { enabled: false, stock: '' }]))
      }
    }
    return { ...prev, selectedColors: sc }
  })

  const toggleSize = (colorEn, size) => setProductForm(prev => {
    const sc = { ...prev.selectedColors }
    sc[colorEn] = { ...sc[colorEn], sizes: { ...sc[colorEn].sizes, [size]: { ...sc[colorEn].sizes[size], enabled: !sc[colorEn].sizes[size].enabled } } }
    return { ...prev, selectedColors: sc }
  })

  const updateStock = (colorEn, size, value) => setProductForm(prev => {
    const sc = { ...prev.selectedColors }
    sc[colorEn] = { ...sc[colorEn], sizes: { ...sc[colorEn].sizes, [size]: { ...sc[colorEn].sizes[size], stock: value } } }
    return { ...prev, selectedColors: sc }
  })

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    const price = parseInt(productForm.price_dzd) || 0
    try {
      const productData = {
        name_en: productForm.name, name_fr: productForm.name, name_ar: productForm.name,
        description_en: productForm.description, description_fr: productForm.description, description_ar: productForm.description,
        category: productForm.category, images: productForm.images, is_active: productForm.is_active,
      }

      const variantsFlat = Object.entries(productForm.selectedColors).flatMap(([color_en, info]) =>
        SIZES.filter(s => info.sizes[s]?.enabled).map(s => ({
          color_en,
          color_fr: info.color_fr,
          color_ar: info.color_ar,
          size: s,
          price_dzd: price,
          stock_quantity: parseInt(info.sizes[s].stock) || 0,
          is_active: true
        }))
      )

      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id)
        if (error) throw error
        await supabase.from('product_variants').delete().eq('product_id', editingProduct.id)
        for (const v of variantsFlat) {
          const { error: ve } = await supabase.from('product_variants').insert({ product_id: editingProduct.id, ...v })
          if (ve) throw ve
        }
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(productData).select('id').single()
        if (error) throw error
        for (const v of variantsFlat) {
          const { error: ve } = await supabase.from('product_variants').insert({ product_id: newProduct.id, ...v })
          if (ve) throw ve
        }
      }

      loadProducts()
      closeProductModal()
    } catch (err) {
      console.error('Error saving product:', err)
      alert('Failed to save product: ' + err.message)
    }
  }

  const deleteProduct = async (productId) => {
    if (!window.confirm(t('admin.confirmDelete'))) return
    await supabase.from('products').delete().eq('id', productId)
    loadProducts()
  }

  // Load manual sales
  const loadManualSales = async () => {
    setManualSalesLoading(true)
    try {
      const { data, error } = await supabase
        .from('manual_sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (!error && data) setManualSales(data)
    } catch (err) {
      console.error(err)
    } finally {
      setManualSalesLoading(false)
    }
  }

  // Submit manual sale
  const handleManualSale = async () => {
    if (!saleForm.product_id || !saleForm.variant_id || !saleForm.quantity || !saleForm.unit_price) {
      alert(t('admin.salesPage.required'))
      return
    }
    try {
      const selectedProduct = products.find(p => p.id === saleForm.product_id)
      const selectedVariant = selectedProduct?.product_variants?.find(v => v.id === saleForm.variant_id)
      const qty = parseInt(saleForm.quantity)
      const price = parseFloat(saleForm.unit_price)
      const { error: saleError } = await supabase.from('manual_sales').insert({
        product_id: saleForm.product_id,
        variant_id: saleForm.variant_id,
        product_name: selectedProduct?.name_fr || selectedProduct?.name_en || '',
        size: selectedVariant?.size || '',
        color: selectedVariant?.color_fr || selectedVariant?.color_en || '',
        quantity: qty,
        unit_price: price,
        total_price: qty * price,
        notes: saleForm.notes.trim() || null
      })
      if (saleError) throw saleError
      const { error: stockError } = await supabase
        .from('product_variants')
        .update({ stock_quantity: Math.max(0, (selectedVariant?.stock_quantity || 0) - qty) })
        .eq('id', saleForm.variant_id)
      if (stockError) throw stockError
      setShowSaleModal(false)
      setSaleForm({ product_id: '', variant_id: '', quantity: 1, unit_price: '', notes: '' })
      loadManualSales()
      loadProducts()
      alert(t('admin.salesPage.success'))
    } catch (err) {
      alert('Erreur: ' + err.message)
    }
  }

  //Cancel ManualSale
  const cancelManualSale = async (saleId, variantId, quantity) => {
    if (!window.confirm(t('admin.salesPage.cancelConfirm'))) return
    try {
      const { data: variant } = await supabase
        .from('product_variants').select('stock_quantity').eq('id', variantId).single()
      await supabase
        .from('product_variants')
        .update({ stock_quantity: (variant?.stock_quantity || 0) + quantity })
        .eq('id', variantId)
      await supabase.from('manual_sales').delete().eq('id', saleId)
      loadManualSales()
      loadProducts()
    } catch (err) {
      alert('Erreur: ' + err.message)
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      loadOrders()
    } catch (err) {
      console.error('Error updating order:', err)
    }
  }  // Filter orders
  const filteredOrders = orders.filter(order =>
    !searchQuery ||
    order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_phone?.includes(searchQuery) ||
    order.id?.includes(searchQuery)
  )

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
        <Loader2 size={32} className="spin" color="var(--gold)" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--cream)' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--white)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1
            style={{
              fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            Be Princess Collection — Admin
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {['fr', 'ar', 'en'].map(lang => (
              <button key={lang} onClick={() => i18n.changeLanguage(lang)}
                style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: i18n.language === lang ? 'var(--gold)' : 'transparent', color: i18n.language === lang ? 'var(--white)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                {lang.toUpperCase()}
              </button>
            ))}
            <button
              onClick={handleSignOut}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
            >
              <LogOut size={18} />
              {t('admin.signOut')}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', padding: '12px 24px' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: activeTab === tab ? 'var(--gold)' : 'transparent',
                color: activeTab === tab ? 'var(--white)' : 'var(--text-muted)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
              }}
            >
              {tab === 'sales' ? 'Ventes' : t(`admin.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="container" style={{ padding: '24px 16px' }}>
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-icon orders"><Package size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalOrders}</span>
                <span className="stat-label">{t('admin.totalOrders')}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon products"><ShoppingBag size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalProducts}</span>
                <span className="stat-label">{t('admin.totalProducts')}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pending"><AlertCircle size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.pendingOrders}</span>
                <span className="stat-label">{t('admin.pendingOrders')}</span>
              </div>
            </div>
          </div>
        )}

      {/* Sales */}
        {activeTab === 'sales' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600 }}>{t('admin.salesPage.title')}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{t('admin.salesPage.subtitle')}</p>
              </div>
              <button onClick={() => { loadProducts(); setShowSaleModal(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'var(--gold)', color: 'var(--white)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <Plus size={18} /> {t('admin.salesPage.newSale')}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-value">{manualSales.length}</span>
                  <span className="stat-label">{t('admin.salesPage.registered')}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-value">{manualSales.reduce((s, v) => s + (v.quantity || 0), 0)}</span>
                  <span className="stat-label">{t('admin.salesPage.itemsSold')}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-value">{manualSales.reduce((s, v) => s + (v.total_price || 0), 0).toLocaleString()} DZD</span>
                  <span className="stat-label">{t('admin.salesPage.revenue')}</span>
                </div>
              </div>
            </div>

            {manualSalesLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spin" size={24} /></div>
            ) : manualSales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <ShoppingBag size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>{t('admin.salesPage.empty')}</p>
              </div>
            ) : (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Produit</th><th>Taille</th><th>Couleur</th><th>Qté</th><th>Prix unitaire</th><th>Total</th><th>Date</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualSales.map(sale => (
                      <tr key={sale.id}>
                        <td><strong>{sale.product_name}</strong>{sale.notes && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sale.notes}</div>}</td>
                        <td>{sale.size || '—'}</td>
                        <td>{sale.color || '—'}</td>
                        <td>{sale.quantity}</td>
                        <td>{sale.unit_price?.toLocaleString()} DZD</td>
                        <td><strong>{sale.total_price?.toLocaleString()} DZD</strong></td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(sale.created_at).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <button onClick={() => cancelManualSale(sale.id, sale.variant_id, sale.quantity)} className="icon-btn danger" title="Annuler">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>)}

        {/* Products */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600 }}>
                {t('admin.products')}
              </h2>
              <button
                onClick={() => openProductModal()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'var(--gold)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Plus size={18} />
                {t('admin.addProduct')}
              </button>
            </div>

            {productsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spin" size={24} /></div>
            ) : (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t('admin.productName')}</th>
                      <th>{t('admin.category')}</th>
                      <th>{t('admin.price')}</th>
                      <th>{t('common.stock')}</th>
                      <th style={{ textAlign: 'center' }}>{t('common.edit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt="" style={{ width: '48px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} />
                            )}
                            <div>
                              <div style={{ fontWeight: 500 }}>{product.name_en}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{product.name_ar}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge">{product.category}</span></td>
                        <td>
                          {Math.min(...(product.product_variants?.map(v => v.price_dzd) || [0])).toLocaleString()} DZD
                        </td>
                        <td>
                          {(product.product_variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => openProductModal(product)} className="icon-btn"><Edit2 size={16} /></button>
                          <button onClick={() => deleteProduct(product.id)} className="icon-btn danger"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Orders */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600 }}>
                {t('admin.orders')}
              </h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by name, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '8px 12px 8px 36px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(`admin.${s}`)}</option>)}
                </select>
              </div>
            </div>

            {ordersLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spin" size={24} /></div>
            ) : (
              <div className="orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>{t('checkout.name')}</th>
                      <th>{t('checkout.phone')}</th>
                      <th>{t('checkout.wilaya')}</th>
                      <th>{t('common.total')}</th>
                      <th>{t('admin.orderStatus')}</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td><code style={{ fontSize: '12px' }}>{order.id.slice(0, 8)}</code></td>
                        <td>{order.customer_name}</td>
                        <td>{order.customer_phone}</td>
                        <td>{order.wilaya}</td>
                        <td style={{ fontWeight: 600 }}>{order.total?.toLocaleString()} DZD</td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`status-select ${order.status}`}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(`admin.${s}`)}</option>)}
                          </select>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => setSelectedOrder(order)} className="icon-btn"><Eye size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? t('admin.editProduct') : t('admin.addProduct')}</h3>
              <button onClick={closeProductModal} className="icon-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="modal-body">
              <div className="form-group">
                <label>Nom du produit</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="Ex: Abaya Klassique" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Catégorie</label>
                  <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{t(`shop.categories.${c}`)}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Prix (DZD)</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={productForm.price_dzd} onChange={e => setProductForm({ ...productForm, price_dzd: e.target.value })} placeholder="Ex: 2500" required />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Image URL</label>
                <input type="url" value={productForm.images?.[0] || ''} onChange={e => setProductForm({ ...productForm, images: [e.target.value] })} placeholder="https://images.pexels.com/..." />
              </div>
              {productForm.images?.[0] && (
                <img src={productForm.images[0]} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />
              )}

              <div className="variants-section">
                <h4 style={{ marginBottom: '10px', fontWeight: 600, fontSize: '14px' }}>Couleurs disponibles</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Cliquez pour {t('admin.salesPage.selectVariant')}</p>
                <div className="color-swatches" style={{ marginBottom: '20px' }}>
                  {COLOR_PALETTE.map(c => (
                    <div key={c.hex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <button type="button"
                        className={`color-swatch ${productForm.selectedColors[c.color_en] ? 'active' : ''}`}
                        style={{ backgroundColor: c.hex, border: c.hex === '#ffffff' || c.hex === '#F5EFE0' ? '1px solid #ddd' : 'none' }}
                        title={c.color_fr}
                        onClick={() => toggleColor(c)}
                      />
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '36px', textAlign: 'center', lineHeight: 1.2 }}>{c.color_fr}</span>
                    </div>
                  ))}
                </div>

                {Object.entries(productForm.selectedColors).map(([colorEn, info]) => (
                  <div key={colorEn} style={{ marginBottom: '16px', background: 'var(--beige)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: info.hex, border: '1px solid #ccc', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{info.color_fr}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Cliquez sur une taille pour l'activer</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {SIZES.map(size => (
                        <div key={size}>
                          <button type="button"
                            className={`size-btn ${info.sizes[size]?.enabled ? 'active' : ''}`}
                            style={{ width: '100%', textAlign: 'left' }}
                            onClick={() => toggleSize(colorEn, size)}
                          >
                            {size}
                          </button>
                          {info.sizes[size]?.enabled && (
                            <div style={{ paddingLeft: '8px', marginTop: '4px' }}>
                              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quantité en stock</label>
                              <input
                                type="text" inputMode="numeric" pattern="[0-9]*"
                                placeholder="Ex: 10"
                                value={info.sizes[size].stock}
                                onChange={e => updateStock(colorEn, size, e.target.value)}
                                style={{ width: '140px', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', marginLeft: '8px' }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeProductModal} className="btn secondary">{t('common.cancel')}</button>
                <button type="submit" className="btn primary">{t('admin.saveProduct')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Sale Modal */}
      {showSaleModal && (
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{t('admin.salesPage.modalTitle')}</h3>
              <button onClick={() => setShowSaleModal(false)} className="icon-btn"><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Produit *</label>
                <select value={saleForm.product_id} onChange={e => setSaleForm({ ...saleForm, product_id: e.target.value, variant_id: '', unit_price: '' })}>
                  <option value="">{t('admin.salesPage.selectProduct')}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name_fr || p.name_en}</option>)}
                </select>
              </div>

              {saleForm.product_id && (
                <div className="form-group">
                  <label>Variante (taille / couleur) *</label>
                  <select value={saleForm.variant_id} onChange={e => {
                    const variant = products.find(p => p.id === saleForm.product_id)?.product_variants?.find(v => v.id === e.target.value)
                    setSaleForm({ ...saleForm, variant_id: e.target.value, unit_price: variant?.price_dzd?.toString() || '' })
                  }}>
                    <option value="">{t('admin.salesPage.selectVariant')}</option>
                    {products.find(p => p.id === saleForm.product_id)?.product_variants?.map(v => (
                      <option key={v.id} value={v.id}>{v.size} — {v.color_fr || v.color_en} (stock: {v.stock_quantity})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Quantité *</label>
                  <input type="text" inputMode="numeric" value={saleForm.quantity}
                    onChange={e => setSaleForm({ ...saleForm, quantity: e.target.value })} placeholder="1" />
                </div>
                <div className="form-group">
                  <label>Prix unitaire (DZD) *</label>
                  <input type="text" inputMode="numeric" value={saleForm.unit_price}
                    onChange={e => setSaleForm({ ...saleForm, unit_price: e.target.value })} placeholder="Ex: 2500" />
                </div>
              </div>

              {saleForm.quantity && saleForm.unit_price && (
                <div style={{ padding: '12px', background: 'var(--beige)', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>
                  Total: {(parseInt(saleForm.quantity) * parseFloat(saleForm.unit_price) || 0).toLocaleString()} DZD
                </div>
              )}

              <div className="form-group">
                <label>Notes (optionnel)</label>
                <input type="text" value={saleForm.notes}
                  onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })} placeholder="Ex: cliente régulière, remise..." />
              </div>

              <button onClick={handleManualSale}
                style={{ width: '100%', padding: '14px', background: 'var(--gold)', color: 'var(--white)', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}>
                Enregistrer la vente
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content order-detail" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order {selectedOrder.id.slice(0, 8).toUpperCase()}</h3>
              <button onClick={() => setSelectedOrder(null)} className="icon-btn"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="order-info-grid">
                <div>
                  <label>Customer</label>
                  <p><strong>{selectedOrder.customer_name}</strong></p>
                  <p>{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <label>Delivery</label>
                  <p>{selectedOrder.wilaya}, {selectedOrder.commune}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedOrder.address}</p>
                </div>
                <div>
                  <label>Method</label>
                  <p>{selectedOrder.delivery_method === 'yalidine' ? 'Yalidine' : 'ZR Express'}</p>
                </div>
                <div>
                  <label>Status</label>
                  <select value={selectedOrder.status} onChange={e => { updateOrderStatus(selectedOrder.id, e.target.value); setSelectedOrder({ ...selectedOrder, status: e.target.value }); }} className={`status-select ${selectedOrder.status}`}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(`admin.${s}`)}</option>)}
                  </select>
                </div>
              </div>

              <div className="order-items-list">
                <h4>Items</h4>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="order-item-row">
                    <span className="qty">{item.quantity}x</span>
                    <span className="name">{item.name}</span>
                    <span className="variant">{item.size} {item.color && `| ${item.color}`}</span>
                    <span className="price">{(item.price * item.quantity).toLocaleString()} DZD</span>
                  </div>
                ))}
              </div>

              <div className="order-totals">
                <div><span>Subtotal</span><span>{selectedOrder.subtotal?.toLocaleString()} DZD</span></div>
                <div><span>Delivery</span><span>{selectedOrder.delivery_fee?.toLocaleString()} DZD</span></div>
                <div className="total"><span>Total</span><span>{selectedOrder.total?.toLocaleString()} DZD</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: var(--white);
          padding: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.orders { background: rgba(201, 168, 124, 0.15); color: var(--gold); }
        .stat-icon.products { background: rgba(107, 158, 120, 0.15); color: var(--success); }
        .stat-icon.pending { background: rgba(201, 112, 112, 0.15); color: var(--error); }

        .stat-info { display: flex; flex-direction: column; }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-muted);
        }

        .products-table, .orders-table {
          background: var(--white);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .products-table table, .orders-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .products-table th, .orders-table th {
          background: var(--beige);
          padding: 16px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .products-table td, .orders-table td {
          padding: 16px;
          border-top: 1px solid var(--border);
          font-size: 14px;
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          background: var(--beige);
          border-radius: 20px;
          font-size: 12px;
          text-transform: capitalize;
          color: var(--text);
        }

        .icon-btn {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          border-radius: 6px;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }

        .icon-btn:hover { background: var(--beige); color: var(--text); }
        .icon-btn.danger:hover { background: rgba(201, 112, 112, 0.15); color: var(--error); }

        .status-select {
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 13px;
          cursor: pointer;
          text-transform: capitalize;
        }

        .status-select.pending { background: rgba(201, 168, 124, 0.15); border-color: var(--gold); color: var(--gold); }
        .status-select.confirmed { background: rgba(107, 158, 120, 0.15); border-color: var(--success); color: var(--success); }
        .status-select.shipped { background: rgba(156, 136, 120, 0.15); border-color: var(--taupe); color: var(--taupe); }
        .status-select.delivered { background: rgba(107, 158, 120, 0.15); border-color: var(--success); color: var(--success); }
        .status-select.cancelled { background: rgba(201, 112, 112, 0.15); border-color: var(--error); color: var(--error); }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .modal-content {
          background: var(--white);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content.order-detail { max-width: 600px; }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
          font-family: var(--font-display);
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 6px;
          color: var(--text-muted);
        }

        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
          background: var(--cream);
        }

        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: var(--gold);
        }

        .variants-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .variant-card {
          background: var(--cream);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .variant-card .variant-field {
          margin-bottom: 12px;
        }

        .variant-card .variant-field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .size-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .size-btn {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--white);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .size-btn:hover {
          border-color: var(--gold);
        }

        .size-btn.active {
          background: var(--gold);
          color: var(--white);
          border-color: var(--gold);
        }

        .color-swatches {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .color-swatch:hover {
          transform: scale(1.1);
        }

        .color-swatch.active {
          box-shadow: 0 0 0 3px var(--gold);
        }

        .selected-color-name {
          display: inline-block;
          margin-top: 8px;
          font-size: 13px;
          color: var(--text-muted);
          font-style: italic;
        }

        .variant-row-inline {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .variant-row-inline .variant-field {
          flex: 1;
          margin-bottom: 0;
        }

        .variant-row-inline input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
        }

        .variant-row {
          display: grid;
          grid-template-columns: 80px 1fr 100px 80px 40px;
          gap: 8px;
          margin-bottom: 8px;
        }

        .variant-row input, .variant-row select {
          padding: 8px;
          font-size: 13px;
          border: 1px solid var(--border);
          border-radius: 6px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn.primary { background: var(--gold); color: var(--white); }
        .btn.primary:hover { background: var(--gold-light); }
        .btn.secondary { background: var(--beige); color: var(--text); }
        .btn.secondary:hover { background: var(--beige-dark); }

        .order-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .order-info-grid label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 4px;
          text-transform: uppercase;
        }

        .order-info-grid p { margin: 2px 0; font-size: 14px; }

        .order-items-list {
          background: var(--cream);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .order-items-list h4 {
          font-size: 14px;
          margin-bottom: 12px;
        }

        .order-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }

        .order-item-row:last-child { border-bottom: none; }

        .order-item-row .qty { color: var(--text-muted); min-width: 30px; }
        .order-item-row .name { font-weight: 500; flex: 1; }
        .order-item-row .variant { color: var(--text-muted); }
        .order-item-row .price { font-weight: 500; margin-left: auto; }

        .order-totals div {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
        }

        .order-totals .total {
          font-size: 16px;
          font-weight: 600;
          border-top: 1px solid var(--border);
          margin-top: 8px;
          padding-top: 16px;
        }

        @media (max-width: 768px) {
          .variant-row { grid-template-columns: 1fr 1fr; }
          .order-info-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
