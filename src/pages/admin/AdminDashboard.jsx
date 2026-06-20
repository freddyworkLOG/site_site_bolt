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
const SIZES = ['S', 'M', 'L', 'XL', 'Free Size']
const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

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
          product_variants (id, sku, size, color_en, price_dzd, stock_quantity)
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
      variants: [{ size: 'M', color_en: '', price_dzd: 0, stock_quantity: 0 }]
    }
  }

  const openProductModal = (product = null) => {
    if (product) {
      setProductForm({
        ...product,
        variants: product.product_variants?.length ? product.product_variants : [getEmptyProduct().variants[0]]
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

      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(productData).select('id').single()
        if (error) throw error
        if (newProduct) {
          for (const variant of productForm.variants) {
            const { error: variantError } = await supabase.from('product_variants').insert({
              product_id: newProduct.id,
              ...variant
            })
            if (variantError) throw variantError
          }
        }
      }

      loadProducts()
      closeProductModal()
    } catch (err) {
      console.error('Error saving product:', err)
      alert('Failed to save product: ' + (err.message || 'unknown error'))
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
            Nouara Admin
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
              <div className="form-tabs">
                <div className="form-group">
                  <label>Name (EN)</label>
                  <input type="text" value={productForm.name_en} onChange={e => setProductForm({ ...productForm, name_en: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Name (FR)</label>
                  <input type="text" value={productForm.name_fr} onChange={e => setProductForm({ ...productForm, name_fr: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Name (AR)</label>
                  <input type="text" value={productForm.name_ar} onChange={e => setProductForm({ ...productForm, name_ar: e.target.value })} dir="rtl" />
                </div>
                <div className="form-group">
                  <label>{t('admin.category')}</label>
                  <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{t(`shop.categories.${c}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input type="url" value={productForm.images?.[0] || ''} onChange={e => setProductForm({ ...productForm, images: [e.target.value] })} placeholder="https://..." />
                </div>
                {productForm.images?.[0] && (
                  <img src={productForm.images[0]} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                )}
              </div>

              <div className="variants-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4>{t('admin.variants')}</h4>
                  <button type="button" onClick={() => setProductForm({ ...productForm, variants: [...productForm.variants, getEmptyProduct().variants[0]] })} className="icon-btn"><Plus size={18} /></button>
                </div>
                {productForm.variants.map((v, i) => (
                  <div key={i} className="variant-row">
                    <select value={v.size} onChange={e => { const newVariants = [...productForm.variants]; newVariants[i].size = e.target.value; setProductForm({ ...productForm, variants: newVariants }); }}>
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="text" placeholder="Color" value={v.color_en || ''} onChange={e => { const newVariants = [...productForm.variants]; newVariants[i].color_en = e.target.value; setProductForm({ ...productForm, variants: newVariants }); }} />
                    <input type="number" placeholder="Price" value={v.price_dzd || ''} onChange={e => { const newVariants = [...productForm.variants]; newVariants[i].price_dzd = parseInt(e.target.value) || 0; setProductForm({ ...productForm, variants: newVariants }); }} />
                    <input type="number" placeholder="Stock" value={v.stock_quantity || ''} onChange={e => { const newVariants = [...productForm.variants]; newVariants[i].stock_quantity = parseInt(e.target.value) || 0; setProductForm({ ...productForm, variants: newVariants }); }} />
                    {productForm.variants.length > 1 && (
                      <button type="button" onClick={() => setProductForm({ ...productForm, variants: productForm.variants.filter((_, idx) => idx !== i) })} className="icon-btn danger"><X size={16} /></button>
                    )}
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
