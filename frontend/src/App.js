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

// SVG icons for stat cards
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

// Inventory table columns
const activeStockColumns = [
  { key: 'id',          label: 'ID',           width: '70px' },
  { key: 'name',        label: 'Product Name'               },
  { key: 'price',       label: 'Price',        width: '110px',
    render: v => `$${parseFloat(v).toFixed(2)}` },
  { key: 'quantity',    label: 'Quantity',     width: '110px',
    render: v => (
      <span style={{
        background: v < 10 ? '#ebebeb' : '#f0f0f0',
        color: v < 10 ? '#555' : '#1a1a1a',
        padding: '2px 10px', borderRadius: '10px',
        fontWeight: 600, fontSize: '0.8rem'
      }}>{v}</span>
    )},
  { key: 'lastUpdated', label: 'Last Updated', width: '180px',
    render: v => new Date(v).toLocaleString() },
];

const recentColumns = [
  { key: 'productId',   label: 'Product ID',   width: '100px' },
  { key: 'name',        label: 'Product Name'               },
  { key: 'quantity',    label: 'Quantity',     width: '100px', render: v => <strong>{v}</strong> },
  { key: 'lastUpdated', label: 'Updated At',   width: '180px',
    render: v => new Date(v).toLocaleString() },
];

function App() {
  const [activeTab, setActiveTab]       = useState('dashboard');
  const [searchQuery, setSearchQuery]   = useState('');
  const [products, setProducts]         = useState([]);
  const [inventory, setInventory]       = useState([]);
  const [totalValue, setTotalValue]     = useState(0);
  const [activeStock, setActiveStock]   = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [alert, setAlert]               = useState(null);

  const showAlert = (message, type = 'success') => setAlert({ message, type });

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try { setProducts(await (await fetch('/api/products')).json()); }
    catch (e) { console.error(e); }
    finally { setLoadingProducts(false); }
  }, []);

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try { setInventory(await (await fetch('/api/inventory/recent')).json()); }
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

  const refreshAll = useCallback(() => {
    fetchProducts(); fetchInventory(); fetchTotalValue(); fetchActiveStock();
  }, [fetchProducts, fetchInventory, fetchTotalValue, fetchActiveStock]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const handleCreateProduct = async (formData) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, isActive: true }),
      });
      if (!res.ok) throw new Error();
      showAlert('Product created successfully.');
      fetchProducts(); fetchTotalValue(); fetchActiveStock();
    } catch { showAlert('Failed to create product.', 'error'); }
  };

  const handleUpdateInventory = async (formData) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(formData.productId),
          quantity: parseInt(formData.quantity),
          lastUpdated: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      showAlert('Inventory updated successfully.');
      fetchInventory(); fetchTotalValue(); fetchActiveStock();
    } catch { showAlert('Failed to update inventory.', 'error'); }
  };

  const totalQtyInHand = activeStock.reduce((s, i) => s + (i.quantity || 0), 0);
  const lowStockItems  = activeStock.filter(i => i.quantity < 10).length;
  const activeItems    = products.filter(p => p.isActive).length;

  // Search filter — case-insensitive match on product name
  const q = searchQuery.trim().toLowerCase();
  const filteredProducts    = q ? products.filter(p => p.name.toLowerCase().includes(q)) : products;
  const filteredActiveStock = q ? activeStock.filter(i => i.name.toLowerCase().includes(q)) : activeStock;
  const filteredInventory   = q
    ? inventory.filter(i => {
        const name = products.find(p => p.id === i.productId)?.name || '';
        return name.toLowerCase().includes(q);
      })
    : inventory;

  // Enrich inventory rows with product name for the recent table
  const recentRows = [...filteredInventory]
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    .map(item => ({
      ...item,
      _key: item.id,
      name: products.find(p => p.id === item.productId)?.name || '—',
    }));

  const activeStockRows = filteredActiveStock.map(i => ({ ...i, _key: i.id }));

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-wrapper">
        <Header totalValue={totalValue} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="main-content">
          {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

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
                <StatCard icon={IconBox}    title="Total Products"    value={filteredProducts.length}  subtitle={`${activeItems} active`} />
                <StatCard icon={IconDollar} title="Inventory Value"   value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} subtitle="Active stock" />
                <StatCard icon={IconAlert}  title="Low Stock Items"   value={lowStockItems}    subtitle="Below 10 units" />
                <StatCard icon={IconClock}  title="Recent Updates"    value={filteredInventory.length} subtitle="Last 24 hours" />

                <div className="full-width">
                  <SalesActivity inventory={inventory} products={products} />
                </div>

                <InventorySummary data={{
                  quantityInHand: totalQtyInHand.toLocaleString(),
                  quantityToBeReceived: '—',
                  lowStockItems,
                  activeItems,
                }} />

                <ProductDetails data={{
                  lowStockItems, activeItems,
                  allItems: products.length,
                  unconfirmedItems: products.filter(p => !p.isActive).length,
                }} />

                <div className="full-width">
                  <TopSellingItems activeStock={activeStock} />
                </div>

                <div className="full-width">
                  <OrderTables inventory={inventory} products={products} />
                </div>
              </div>
            </>
          )}

          {/* ── PRODUCTS ── */}
          {activeTab === 'products' && (
            <>
              <div className="page-header">
                <h2>Items</h2>
              </div>
              <div className="products-page">
                <div id="product-form-section">
                  <ProductForm onSubmit={handleCreateProduct} loading={loadingProducts} />
                </div>
                <ProductList products={filteredProducts} loading={loadingProducts} />
              </div>
            </>
          )}

          {/* ── INVENTORY ── */}
          {activeTab === 'inventory' && (
            <>
              <div className="page-header"><h2>Inventory</h2></div>
              <div className="inventory-page">
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
                <StatCard icon={IconAlert}  title="Low Stock Alerts"      value={lowStockItems} subtitle="Items below 10 units" />
                <StatCard icon={IconClock}  title="Active Products"       value={activeItems}   subtitle={`of ${products.length} total`} />
                <div className="full-width">
                  <ProductDetails data={{
                    lowStockItems, activeItems,
                    allItems: products.length,
                    unconfirmedItems: products.filter(p => !p.isActive).length,
                  }} />
                </div>
                <div className="full-width">
                  <TopSellingItems activeStock={activeStock} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
