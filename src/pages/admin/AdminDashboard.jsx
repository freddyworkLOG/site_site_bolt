import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Package, ShoppingBag, Users, AlertCircle, LogOut, Plus, Edit2, Trash2,
  X, Check, Loader2, ChevronDown, Eye, FileText, Truck, Search
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const TABS = ['dashboard', 'products', 'orders']
const CATEGORIES = ['abayas', 'jilbabs', 'kimonos', 'ensembles', 'accessories']
const SIZES = ['S (36)', 'Taille 1 (38-40)', 'Taille 2 (42-44)', 'Taille 3 (Sur commande)']
const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

const MAIN_PALETTE = [
  { hex: '#1a1a1a', color_en: 'Black', color_fr: 'Noir', color_ar: 'أسود' },
  { hex: '#ffffff', color_en: 'White', color_fr: 'Blanc', color_ar: 'أبيض' },
  { hex: '#E3D3B5', color_en: 'Beige', color_fr: 'Beige', color_ar: 'بيج' },
  { hex: '#F5EFE0', color_en: 'Cream', color_fr: 'Crème', color_ar: 'كريم' },
  { hex: '#6B4226', color_en: 'Brown', color_fr: 'Marron', color_ar: 'بني' },
  { hex: '#C19A6B', color_en: 'Camel', color_fr: 'Camel', color_ar: 'كامل' },
  { hex: '#8C8C8C', color_en: 'Grey', color_fr: 'Gris', color_ar: 'رمادي' },
  { hex: '#36454F', color_en: 'Charcoal', color_fr: 'Anthracite', color_ar: 'فحمي' },
  { hex: '#1B2A4A', color_en: 'Navy', color_fr: 'Marine', color_ar: 'كحلي' },
  { hex: '#6B6E3A', color_en: 'Olive', color_fr: 'Olive', color_ar: 'زيتي' },
  { hex: '#5E2129', color_en: 'Burgundy', color_fr: 'Bordeaux', color_ar: 'عنابي' },
  { hex: '#C9A0A6', color_en: 'Dusty Rose', color_fr: 'Rose poudré', color_ar: 'وردي' },
]

const EXTENDED_PALETTE = [
  { hex: '#FFFFF0', color_en: 'Ivory', color_fr: 'Ivoire', color_ar: 'عاجي' },
  { hex: '#F8F4E9', color_en: 'Off White', color_fr: 'Blanc cassé', color_ar: 'أبيض مكسور' },
  { hex: '#D3D3D3', color_en: 'Light Grey', color_fr: 'Gris clair', color_ar: 'رمادي فاتح' },
  { hex: '#696969', color_en: 'Dark Grey', color_fr: 'Gris foncé', color_ar: 'رمادي غامق' },
  { hex: '#8B7D7B', color_en: 'Taupe', color_fr: 'Taupe', color_ar: 'تاوب' },
  { hex: '#C3B091', color_en: 'Khaki', color_fr: 'Kaki', color_ar: 'كاكي' },
  { hex: '#4169E1', color_en: 'Royal Blue', color_fr: 'Bleu royal', color_ar: 'أزرق ملكي' },
  { hex: '#87CEEB', color_en: 'Sky Blue', color_fr: 'Bleu ciel', color_ar: 'أزرق سماوي' },
  { hex: '#40E0D0', color_en: 'Turquoise', color_fr: 'Turquoise', color_ar: 'تركواز' },
  { hex: '#98FF98', color_en: 'Mint', color_fr: 'Menthe', color_ar: 'نعناعي' },
  { hex: '#9DC183', color_en: 'Sage', color_fr: 'Sauge', color_ar: 'أخضر مريمية' },
  { hex: '#228B22', color_en: 'Forest Green', color_fr: 'Vert forêt', color_ar: 'أخضر غابة' },
  { hex: '#50C878', color_en: 'Emerald', color_fr: 'Émeraude', color_ar: 'زمردي' },
  { hex: '#FFB6C1', color_en: 'Blush', color_fr: 'Blush', color_ar: 'وردي خفيف' },
  { hex: '#FF69B4', color_en: 'Hot Pink', color_fr: 'Rose vif', color_ar: 'وردي فاقع' },
  { hex: '#C7158A', color_en: 'Fuchsia', color_fr: 'Fuchsia', color_ar: 'فوشيا' },
  { hex: '#FF7F50', color_en: 'Coral', color_fr: 'Corail', color_ar: 'مرجاني' },
  { hex: '#FA8072', color_en: 'Salmon', color_fr: 'Saumon', color_ar: 'سلموني' },
  { hex: '#CC0000', color_en: 'Red', color_fr: 'Rouge', color_ar: 'أحمر' },
  { hex: '#CB4154', color_en: 'Brick', color_fr: 'Brique', color_ar: 'قرميدي' },
  { hex: '#C2B280', color_en: 'Sand', color_fr: 'Sable', color_ar: 'رملي' },
  { hex: '#FFDB58', color_en: 'Mustard', color_fr: 'Moutarde', color_ar: 'خردلي' },
  { hex: '#FFD700', color_en: 'Gold', color_fr: 'Doré', color_ar: 'ذهبي' },
  { hex: '#B87333', color_en: 'Copper', color_fr: 'Cuivre', color_ar: 'نحاسي' },
  { hex: '#E2725B', color_en: 'Terracotta', color_fr: 'Terracotta', color_ar: 'ترا كوتا' },
  { hex: '#3D1C02', color_en: 'Chocolate', color_fr: 'Chocolat', color_ar: 'شوكولاتة' },
  { hex: '#6F4E37', color_en: 'Coffee', color_fr: 'Café', color_ar: 'بني قهوة' },
  { hex: '#B7410E', color_en: 'Rust', color_fr: 'Rouille', color_ar: 'صدئي' },
  { hex: '#E6E6FA', color_en: 'Lavender', color_fr: 'Lavande', color_ar: 'خزامى' },
  { hex: '#C8A2C8', color_en: 'Lilac', color_fr: 'Lilas', color_ar: 'ليلكي' },
  { hex: '#800080', color_en: 'Purple', color_fr: 'Violet', color_ar: 'بنفسجي' },
  { hex: '#8E4585', color_en: 'Plum', color_fr: 'Prune', color_ar: 'برقوقي' },
  { hex: '#B784A7', color_en: 'Mauve', color_fr: 'Mauve', color_ar: 'موف' },
  { hex: '#008080', color_en: 'Teal', color_fr: 'Sarcelle', color_ar: 'تيل' },
  { hex: '#003366', color_en: 'Petrol', color_fr: 'Pétrole', color_ar: 'بترولي' },
  { hex: '#4B0082', color_en: 'Indigo', color_fr: 'Indigo', color_ar: 'نيلي' },
]

const COLOR_PALETTE = [...MAIN_PALETTE, ...EXTENDED_PALETTE]

function getEmptyColorGroup() {
  return {
    hex: '',
    color_en: '',
    color_fr: '',
    color_ar: '',
    showExtended: false,
    sizes: SIZES.map(s => ({ size: s, enabled: false, price_dzd: '', stock_quantity: '' }))
  }
}

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
      name_en: '', name_fr: '', name_ar: '',
      description_en: '', description_fr: '', description_ar: '',
      category: 'abayas',
      images: [],
      is_active: true,
      colorGroups: []
    }
  }

  const addColorGroup = () =>
    setProductForm(prev => ({ ...prev, colorGroups: [...prev.colorGroups, getEmptyColorGroup()] }))

  const removeColorGroup = (gi) =>
    setProductForm(prev => ({ ...prev, colorGroups: prev.colorGroups.filter((_, i) => i !== gi) }))

  const selectColor = (gi, color) =>
    setProductForm(prev => {
      const groups = prev.colorGroups.map((g, i) =>
        i !== gi ? g : { ...g, hex: color.hex, color_en: color.color_en, color_fr: color.color_fr, color_ar: color.color_ar, showExtended: false }
      )
      return { ...prev, colorGroups: groups }
    })

  const toggleExtended = (gi) =>
    setProductForm(prev => {
      const groups = prev.colorGroups.map((g, i) =>
        i !== gi ? g : { ...g, showExtended: !g.showExtended }
      )
      return { ...prev, colorGroups: groups }
    })

  const toggleSize = (gi, si) =>
    setProductForm(prev => {
      const groups = prev.colorGroups.map((g, i) =>
        i !== gi ? g : {
          ...g,
          sizes: g.sizes.map((s, j) => j !== si ? s : { ...s, enabled: !s.enabled })
        }
      )
      return { ...prev, colorGroups: groups }
    })

  const updateSize = (gi, si, field, value) =>
    setProductForm(prev => {
      const groups = prev.colorGroups.map((g, i) =>
        i !== gi ? g : {
          ...g,
          sizes: g.sizes.map((s, j) => j !== si ? s : { ...s, [field]: value })
        }
      )
      return { ...prev, colorGroups: groups }
    })

  const openProductModal = (product = null) => {
    if (product) {
      const groupMap = {}
      for (const v of (product.product_variants || [])) {
        if (!groupMap[v.color_en]) {
          const palette = COLOR_PALETTE.find(c => c.color_en === v.color_en)
          groupMap[v.color_en] = {
            hex: palette?.hex || '#cccccc',
            color_en: v.color_en,
            color_fr: v.color_fr,
            color_ar: v.color_ar,
            showExtended: false,
            sizes: SIZES.map(s => ({ size: s, enabled: false, price_dzd: '', stock_quantity: '' }))
          }
        }
        const sizeIdx = groupMap[v.color_en].sizes.findIndex(s => s.size === v.size)
        if (sizeIdx >= 0) {
          groupMap[v.color_en].sizes[sizeIdx].enabled = true
          groupMap[v.color_en].sizes[sizeIdx].price_dzd = v.price_dzd?.toString() || ''
          groupMap[v.color_en].sizes[sizeIdx].stock_quantity = v.stock_quantity?.toString() || ''
        }
      }
      setProductForm({ ...product, colorGroups: Object.values(groupMap) })
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

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      const productData = {
        name_en: productForm.name_en,
        name_fr: productForm.name_fr,
        name_ar: productForm.name_ar,
        description_en: productForm.description_en,
        description_fr: productForm.description_fr,
        description_ar: productForm.description_ar,
        category: productForm.category,
        images: productForm.images,
        is_active: productForm.is_active,
      }

      const variantsFlat = productForm.colorGroups.flatMap(group =>
        group.sizes
          .filter(s => s.enabled && group.color_en)
          .map(s => ({
            color_en: group.color_en,
            color_fr: group.color_fr,
            color_ar: group.color_ar,
            size: s.size,
            price_dzd: parseInt(s.price_dzd) || 0,
            stock_quantity: parseInt(s.stock_quantity) || 0,
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
      setShowProductModal(false)
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

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      loadOrders()
    } catch (err) {
      console.error('Error updating order:', err)
    }
  }

  // Filter orders
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
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <LogOut size={18} />
            {t('admin.signOut')}
          </button>
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
              {t(`admin.${tab}`)}
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
                <label>Nom (FR)</label>
                <input type="text" value={productForm.name_fr} onChange={e => setProductForm({ ...productForm, name_fr: e.target.value })} placeholder="Ex: Abaya Klassique" required />
              </div>
              <div className="form-group">
                <label>Nom (EN)</label>
                <input type="text" value={productForm.name_en} onChange={e => setProductForm({ ...productForm, name_en: e.target.value })} placeholder="Ex: Classic Abaya" />
              </div>
              <div className="form-group">
                <label>Nom (AR)</label>
                <input type="text" value={productForm.name_ar} onChange={e => setProductForm({ ...productForm, name_ar: e.target.value })} placeholder="مثال: عباية كلاسيكية" dir="rtl" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Catégorie</label>
                  <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{t(`shop.categories.${c}`)}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Statut</label>
                  <select value={productForm.is_active ? 'true' : 'false'} onChange={e => setProductForm({ ...productForm, is_active: e.target.value === 'true' })}>
                    <option value="true">Actif</option>
                    <option value="false">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Image URL</label>
                <input type="url" value={productForm.images?.[0] || ''} onChange={e => setProductForm({ ...productForm, images: [e.target.value] })} placeholder="https://images.pexels.com/..." />
              </div>
              {productForm.images?.[0] && (
                <img src={productForm.images[0]} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '8px' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '15px' }}>
                  {t('admin.variants')}
                </h4>

                {productForm.colorGroups.map((group, gi) => (
                  <div key={gi} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '12px', background: 'var(--beige)' }}>

                    {/* Color group header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {group.hex && (
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: group.hex, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>
                          {group.color_fr || 'Sélectionner une couleur'}
                        </span>
                      </div>
                      <button type="button" onClick={() => removeColorGroup(gi)} className="icon-btn danger">
                        <X size={16} />
                      </button>
                    </div>

                    {/* Main palette (12 colors) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      {MAIN_PALETTE.map(c => (
                        <button key={c.hex} type="button"
                          onClick={() => selectColor(gi, c)}
                          title={c.color_fr}
                          style={{
                            width: 28, height: 28, borderRadius: '50%', background: c.hex, cursor: 'pointer', flexShrink: 0,
                            border: group.color_en === c.color_en ? '3px solid var(--gold)' : '1px solid rgba(0,0,0,0.15)',
                            outline: group.color_en === c.color_en ? '2px solid white' : 'none',
                            outlineOffset: '-4px'
                          }}
                        />
                      ))}

                      {/* More colors button */}
                      <button type="button"
                        onClick={() => toggleExtended(gi)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: 'white', cursor: 'pointer',
                          border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', color: 'var(--gold)', fontWeight: 700, flexShrink: 0
                        }}
                      >+</button>
                    </div>

                    {/* Extended palette — shows when + is clicked */}
                    {group.showExtended && (
                      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Autres couleurs</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: '8px' }}>
                          {EXTENDED_PALETTE.map(c => (
                            <button key={c.hex} type="button"
                              onClick={() => selectColor(gi, c)}
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                                borderRadius: '6px',
                                outline: group.color_en === c.color_en ? '2px solid var(--gold)' : 'none'
                              }}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: '6px', background: c.hex, flexShrink: 0,
                                border: '1px solid rgba(0,0,0,0.1)'
                              }} />
                              <span style={{ fontSize: '10px', color: 'var(--text)', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>
                                {c.color_fr}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Size toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {group.sizes.map((s, si) => (
                        <div key={s.size}>
                          <button type="button"
                            onClick={() => toggleSize(gi, si)}
                            style={{
                              width: '100%', textAlign: 'left', padding: '10px 14px',
                              border: s.enabled ? '2px solid var(--gold)' : '1px solid var(--border)',
                              borderRadius: '8px', background: s.enabled ? 'rgba(201,160,166,0.1)' : 'white',
                              cursor: 'pointer', fontWeight: s.enabled ? 600 : 400,
                              color: s.enabled ? 'var(--gold)' : 'var(--text)', fontSize: '14px',
                              marginBottom: s.enabled ? '6px' : '0',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {s.size}
                          </button>
                          {s.enabled && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingLeft: '8px' }}>
                              <div>
                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                  Prix (DZD)
                                </label>
                                <input
                                  type="text" inputMode="numeric" pattern="[0-9]*"
                                  placeholder="Ex: 2500"
                                  value={s.price_dzd}
                                  onChange={e => updateSize(gi, si, 'price_dzd', e.target.value)}
                                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                  Stock
                                </label>
                                <input
                                  type="text" inputMode="numeric" pattern="[0-9]*"
                                  placeholder="Ex: 10"
                                  value={s.stock_quantity}
                                  onChange={e => updateSize(gi, si, 'stock_quantity', e.target.value)}
                                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addColorGroup}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    width: '100%', padding: '12px', border: '2px dashed var(--border)',
                    borderRadius: '8px', background: 'transparent', color: 'var(--gold)',
                    cursor: 'pointer', fontWeight: 500, fontSize: '14px'
                  }}
                >
                  <Plus size={16} /> Ajouter une couleur
                </button>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeProductModal} className="btn secondary">{t('common.cancel')}</button>
                <button type="submit" className="btn primary">{t('admin.saveProduct')}</button>
              </div>
            </form>
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
