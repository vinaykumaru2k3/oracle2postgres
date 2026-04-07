import React from 'react';
import '../styles/InventoryForm.css';

function InventoryForm({ onSubmit, loading, products = [] }) {
  const [formData, setFormData] = React.useState({ productId: '', quantity: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ productId: '', quantity: '' });
  };

  return (
    <section className="inventory-form card">
      <h2 className="section-title">Update Inventory Stock</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Select Product</label>
          <select
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            required
          >
            <option value="">— Choose a product —</option>
            {products.filter(p => p.isActive).map(p => (
              <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quantity in Stock</label>
          <input
            type="number"
            min="0"
            placeholder="e.g., 50"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Stock'}
        </button>
      </form>
    </section>
  );
}

export default InventoryForm;
