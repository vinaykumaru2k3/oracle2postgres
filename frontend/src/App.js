import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import SalesActivity from './components/SalesActivity';
import InventorySummary from './components/InventorySummary';
import TopSellingItems from './components/TopSellingItems';
import OrderTables from './components/OrderTables';
import ProductDetails from './components/ProductDetails';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import InventoryForm from './components/InventoryForm';
import DataGrid from './components/DataGrid';
import Alert from './components/Alert';

const IconBox = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconDollar = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconAlert = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconClock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

function App() {
  const [activeTab, setActiveTab]         = useState('dashboard');
  const [searchQuery, setSearchQuery]     = useState('');
  const [threshold, setThreshold]         = useState(10);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const [products, setProducts]           = useState([]);
  const [inventory, setInventory]         = useState([]);
  const [totalValue, setTotalValue]       = useState(0);
  const [activeStock, setActiveStock]     = useState([]);
  const [lowStock, setLowStock]           = useState([]);

  const [loadingProducts, setLoadingProducts]   = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [alert, setAlert]                       = useState(null);

  const showAlert = (message, type = 'success') => setAlert({ message, type });

  // ── Fetchers ──────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try { 
      const res = await fetch('/api/products');
      if (res.ok) setProducts((await res.json()) || []);
    }
    catch (e) { console.error(e); }
    finally { setLoadingProducts(false); }
  }, []);

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try { 
      const res = await fetch('/api/inventory/recent');
      if (res.ok) setInventory((await res.json()) || []);
    }
    catch (e) { console.error(e); }
    finally { setLoadingInventory(false); }
  }, []);

  const fetchTotalValue = useCallback(async () => {
    try {
      const res = await fetch('/api/value');
      if (res.ok) setTotalValue((await res.json()) || 0);
    } catch (e) { console.error(e); }
  }, []);

  const fetchActiveStock = useCallback(async () => {
    try {
      const res = await fetch('/api/active-stock');
      if (res.ok) setActiveStock((await res.json()) || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchLowStock = useCallback(async (t) => {
    try {
      const res = await fetch(`/api/inventory/low-stock?threshold=${t}`);
      if (res.ok) setLowStock((await res.json()) || []);
    } catch (e) { console.error(e); }
  }, []);

  const refreshAll = useCallback(() => {
    fetchProducts();
    fetchInventory();
    fetchTotalValue();
    fetchActiveStock();
    fetchLowStock(threshold);
  }, [fetchProducts, fetchInventory, fetchTotalValue, fetchActiveStock, fetchLowStock, threshold]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // Re-fetch low stock when threshold changes
  useEffect(() => {
    fetchLowStock(threshold);
    setBannerDismissed(false);
  }, [threshold, fetchLowStock]);

  // ── Handlers ──────────────────────────────────────────────

  const handleCreateProduct = async (formData) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, isActive: true }),
      });
      if (!res.ok) throw new Error();
      showAlert('Product created successfully.');
      fetchProducts(); fetchTotalValue(); fetchActiveStock(); fetchLowStock(threshold);
    } catch { showAlert('Failed to create product.', 'error'); }
  };

  const handleUpdateProduct = async (id, data) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      showAlert('Product updated.');
      fetchProducts(); fetchTotalValue(); fetchActiveStock(); fetchLowStock(threshold);
    } catch { showAlert('Failed to update product.', 'error'); }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showAlert('Product deactivated.');
      fetchProducts(); fetchTotalValue(); fetchActiveStock(); fetchLowStock(threshold);
    } catch { showAlert('Failed to deactivate product.', 'error'); }
  };

  const handleUpdateInventory = async (formData) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: { id: parseInt(formData.productId) },
          quantity: parseInt(formData.quantity),
          lastUpdated: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      showAlert('Inventory updated successfully.');
      fetchInventory(); fetchTotalValue(); fetchActiveStock(); fetchLowStock(threshold);
    } catch { showAlert('Failed to update inventory.', 'error'); }
  };

  // ── Derived data ──────────────────────────────────────────

  const totalQtyInHand = (activeStock || []).reduce((s, i) => s + (i.quantity || 0), 0);
  const activeItems    = (products || []).filter(p => p.isActive).length;

  const q = searchQuery.trim().toLowerCase();
  const filteredProducts    = q ? (products || []).filter(p => p.name.toLowerCase().includes(q)) : (products || []);
  const filteredActiveStock = q ? (activeStock || []).filter(i => i.name.toLowerCase().includes(q)) : (activeStock || []);
  const filteredInventory   = q
    ? (inventory || []).filter(i => {
        const productId = i.product?.id || i.productId;
        const name = (products || []).find(p => p.id === productId)?.name || '';
        return name.toLowerCase().includes(q);
      })
    : (inventory || []);

  const recentRows = [...(filteredInventory || [])]
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    .map(item => {
      const productId = item.product?.id || item.productId;
      return {
        ...item,
        productId,
        _key: item.id,
        name: (products || []).find(p => p.id === productId)?.name || '—',
      };
    });

  // Active stock rows — add totalValue column (price × quantity)
  const activeStockRows = (filteredActiveStock || []).map(i => ({
    ...i,
    _key: i.id,
    totalValue: (parseFloat(i.price || 0) * (i.quantity || 0)).toFixed(2),
  }));

  // ── Table column definitions ──────────────────────────────

  const activeStockColumns = [
    { key: 'id',          label: 'ID',            width: '70px',  sortable: true },
    { key: 'name',        label: 'Product Name',                  sortable: true },
    { key: 'price',       label: 'Price',         width: '100px', sortable: true,
      render: v => `$${parseFloat(v).toFixed(2)}` },
    { key: 'quantity',    label: 'Quantity',      width: '100px', sortable: true,
      render: (v) => (
        <span style={{
          background: v < threshold ? '#ebebeb' : '#f0f0f0',
          color: v < threshold ? '#555' : '#1a1a1a',
          padding: '2px 10px', borderRadius: '10px',
          fontWeight: 600, fontSize: '0.8rem',
        }}>{v}</span>
      )},
    { key: 'totalValue',  label: 'Total Value',   width: '120px', sortable: true,
      render: v => `$${parseFloat(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { key: 'lastUpdated', label: 'Last Updated',  width: '170px', sortable: true,
      render: v => new Date(v).toLocaleString() },
  ];

  const recentColumns = [
    { key: 'productId',   label: 'Product ID',   width: '100px', sortable: true },
    { key: 'name',        label: 'Product Name',                  sortable: true },
    { key: 'quantity',    label: 'Quantity',     width: '100px', sortable: true,
      render: v => <strong>{v}</strong> },
    { key: 'lastUpdated', label: 'Updated At',   width: '170px', sortable: true,
      render: v => new Date(v).toLocaleString() },
  ];

  // ── Low stock banner ──────────────────────────────────────

  const showBanner = !bannerDismissed && lowStock.length > 0;

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-wrapper">
        <Header totalValue={totalValue} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="main-content">
          {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

          {/* Low stock banner — shown on all tabs */}
          {showBanner && (
            <div className="low-stock-banner">
              <div className="low-stock-banner-left">
                <svg viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <strong>{lowStock.length} item{lowStock.length > 1 ? 's' : ''} below threshold ({threshold} units)</strong>
                  <div className="low-stock-banner-items">
                    {lowStock.slice(0, 5).map(i => (
                      <span key={i.id} className="low-stock-tag">{i.name} — {i.quantity}</span>
                    ))}
                    {lowStock.length > 5 && <span className="low-stock-tag">+{lowStock.length - 5} more</span>}
                  </div>
                </div>
              </div>
              <button className="low-stock-banner-close" onClick={() => setBannerDismissed(true)}>✕</button>
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <>
              <div className="page-header">
                <h2>Dashboard</h2>
                <div className="header-actions">
                  <button className="btn-secondary" onClick={refreshAll}>↻ Refresh</button>
                </div>
              </div>
              <div className="dashboard-grid">
                <StatCard icon={IconBox}    title="Total Products"  value={filteredProducts.length} subtitle={`${activeItems} active`} />
                <StatCard icon={IconDollar} title="Inventory Value" value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} subtitle="Active stock" />
                <StatCard icon={IconAlert}  title="Low Stock Items" value={lowStock.length} subtitle={`Below ${threshold} units`} />
                <StatCard icon={IconClock}  title="Recent Updates"  value={filteredInventory.length} subtitle="Last 24 hours" />
                <div className="full-width">
                  <SalesActivity inventory={inventory} products={products} />
                </div>
                <InventorySummary data={{
                  quantityInHand: totalQtyInHand.toLocaleString(),
                  quantityToBeReceived: '—',
                  lowStockItems: lowStock.length,
                  activeItems,
                }} />
                <ProductDetails data={{
                  lowStockItems: lowStock.length, activeItems,
                  allItems: products.length,
                  unconfirmedItems: products.filter(p => !p.isActive).length,
                }} />
                <div className="full-width"><TopSellingItems activeStock={activeStock} /></div>
                <div className="full-width"><OrderTables inventory={inventory} products={products} /></div>
              </div>
            </>
          )}

          {/* ── ITEMS ── */}
          {activeTab === 'products' && (
            <>
              <div className="page-header"><h2>Items</h2></div>
              <div className="products-page">
                <ProductForm onSubmit={handleCreateProduct} loading={loadingProducts} />
                <ProductList
                  products={filteredProducts}
                  loading={loadingProducts}
                  onUpdate={handleUpdateProduct}
                  onDelete={handleDeleteProduct}
                />
              </div>
            </>
          )}

          {/* ── INVENTORY ── */}
          {activeTab === 'inventory' && (
            <>
              <div className="page-header"><h2>Inventory</h2></div>
              <div className="inventory-page">
                {/* Threshold config */}
                <div className="threshold-row">
                  <span>Low stock threshold:</span>
                  <input
                    type="number" min="1" value={threshold}
                    onChange={e => setThreshold(Number(e.target.value) || 1)}
                  />
                  <span>units</span>
                </div>

                <InventoryForm onSubmit={handleUpdateInventory} loading={loadingInventory} products={products} />

                <div className="card">
                  <p className="section-title">Active Stock ({activeStock.length})</p>
                  <DataGrid
                    columns={activeStockColumns}
                    rows={activeStockRows}
                    pageSize={12}
                    loading={loadingInventory}
                    emptyText="No active stock found."
                  />
                </div>

                <div className="card">
                  <p className="section-title">Recent Stock Updates</p>
                  <DataGrid
                    columns={recentColumns}
                    rows={recentRows}
                    pageSize={12}
                    loading={loadingInventory}
                    emptyText="No recent updates in the last 24 hours."
                  />
                </div>
              </div>
            </>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'reports' && (
            <>
              <div className="page-header"><h2>Reports</h2></div>
              <div className="dashboard-grid">
                <StatCard icon={IconDollar} title="Total Inventory Value" value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} subtitle="All active products" />
                <StatCard icon={IconBox}    title="Total Stock Units"     value={totalQtyInHand.toLocaleString()} subtitle="Across all products" />
                <StatCard icon={IconAlert}  title="Low Stock Alerts"      value={lowStock.length} subtitle={`Below ${threshold} units`} />
                <StatCard icon={IconClock}  title="Active Products"       value={activeItems} subtitle={`of ${products.length} total`} />
                <div className="full-width">
                  <ProductDetails data={{
                    lowStockItems: lowStock.length, activeItems,
                    allItems: products.length,
                    unconfirmedItems: products.filter(p => !p.isActive).length,
                  }} />
                </div>
                <div className="full-width"><TopSellingItems activeStock={activeStock} /></div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
