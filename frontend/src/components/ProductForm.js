import React from 'react';
import '../styles/ProductForm.css';

function ProductForm({ onSubmit, loading }) {
  const [formData, setFormData] = React.useState({ name: '', price: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', price: '' });
  };

  return (
    <section className="product-form card">
      <h2 className="section-title">Add New Product</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Product Name</label>
          <input
            type="text"
            placeholder="e.g., Wireless Headphones"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g., 99.99"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Adding...' : '+ Add Product'}
        </button>
      </form>
    </section>
  );
}

export default ProductForm;
