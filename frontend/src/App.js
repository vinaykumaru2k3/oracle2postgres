import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showProductList, setShowProductList] = useState(true);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', isActive: true });
  const [updateInventory, setUpdateInventory] = useState({ productId: '', quantity: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchRecentInventory();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleToggleProducts = () => {
    if (!showProductList) {
      fetchProducts();
    }
    setShowProductList(prev => !prev);
  };

  const fetchRecentInventory = async () => {
    try {
      const response = await fetch('/api/inventory/recent');
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      alert('Please fill all fields');
      return;
    }
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      setNewProduct({ name: '', price: '', isActive: true });
      setSuccessMsg('Product added successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchProducts();
    } catch (err) {
      setErrorMsg('Failed to add product. Please try again.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    if (!updateInventory.productId || !updateInventory.quantity) {
      alert('Please fill all fields');
      return;
    }
    try {
      await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(updateInventory.productId),
          quantity: parseInt(updateInventory.quantity),
          lastUpdated: new Date().toISOString()
        })
      });
      setUpdateInventory({ productId: '', quantity: '' });
      setSuccessMsg('Inventory updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchRecentInventory();
    } catch (err) {
      setErrorMsg('Failed to update inventory. Please check product ID and try again.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="header-left">
          <h1>INVENTORY DASHBOARD</h1>
          <p className="subtitle">Global stock tracking | product ID assurance | live update</p>
        </div>
        <div className="header-right">
          <span>System status:</span>
          <span className="status-dot" />
          <span>Last refresh: {new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      {successMsg && <div className="success-message">{successMsg}</div>}
      {errorMsg && <div className="error-message">{errorMsg}</div>}

      <div className="container">
        {/* Add Product Section */}
        <section className="section">
          <h2>➕ Add New Product</h2>
          <p className="instruction">Create a new product in the inventory system</p>
          <form onSubmit={handleCreateProduct} className="form">
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                placeholder="e.g., iPhone 15"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g., 999.99"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary">Add Product</button>
          </form>
        </section>

        {/* View Products Section */}
        <section className="section">
          <div className="section-header">
            <h2>📋 All Products</h2>
            <button 
              className="btn-toggle"
              onClick={handleToggleProducts}
            >
              {showProductList ? '▼ Hide Products' : '▶ Show All Products & IDs'}
            </button>
          </div>
          {showProductList && (
            <div className="products-list">
              {products.length === 0 ? (
                <p className="no-data">No products found. Add one above!</p>
              ) : (
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td className="product-id"><strong>{product.id}</strong></td>
                        <td>{product.name}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>{product.isActive ? '✅ Active' : '❌ Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>

        {/* Update Inventory Section */}
        <section className="section">
          <h2>📊 Update Inventory Stock</h2>
          <p className="instruction">Select a product by ID (from "Show All Products & IDs" above) and update its stock quantity</p>
          <form onSubmit={handleUpdateInventory} className="form">
            <div className="form-group">
              <label>Product ID</label>
              <input
                type="number"
                placeholder="e.g., 1 (find the ID from the products list above)"
                value={updateInventory.productId}
                onChange={(e) => setUpdateInventory({ ...updateInventory, productId: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Quantity in Stock</label>
              <input
                type="number"
                placeholder="e.g., 50"
                value={updateInventory.quantity}
                onChange={(e) => setUpdateInventory({ ...updateInventory, quantity: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary">Update Stock</button>
          </form>
        </section>

        {/* Recent Updates Section */}
        <section className="section">
          <h2>🕐 Recent Stock Updates</h2>
          <p className="instruction">Shows the last 24 hours of inventory updates (latest first)</p>
          {inventory.length === 0 ? (
            <p className="no-data">No recent updates. Update inventory stock above!</p>
          ) : (
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Qty</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {[...inventory].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)).map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <tr key={item.id}>
                      <td>{item.productId}</td>
                      <td>{product?.name || 'Unknown product'}</td>
                      <td>{item.quantity}</td>
                      <td>{new Date(item.lastUpdated).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;