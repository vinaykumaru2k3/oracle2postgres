import React from 'react';
import '../styles/ProductDetails.css';

function ProductDetails({ data }) {
  const total = (data.activeItems || 0) + (data.unconfirmedItems || 0);
  const activePct = total > 0 ? Math.round((data.activeItems / total) * 100) : 0;
  const circumference = 2 * Math.PI * 38;
  const activeArc = (activePct / 100) * circumference;

  const cards = [
    { label: 'Low Stock',    value: data.lowStockItems ?? 0 },
    { label: 'Active Items', value: data.activeItems ?? 0 },
    { label: 'All Items',    value: data.allItems ?? 0 },
    { label: 'Inactive',     value: data.unconfirmedItems ?? 0 },
  ];

  return (
    <section className="product-details card">
      <h2 className="section-title">Product Details</h2>
      <div className="details-grid">
        {cards.map(c => (
          <div key={c.label} className="detail-card">
            <div className="detail-label">{c.label}</div>
            <div className="detail-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <h3>Active vs Inactive</h3>
        <div className="pie-chart">
          <svg viewBox="0 0 100 100" className="pie-svg">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#e8e8e8" strokeWidth="14" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#1a1a1a" strokeWidth="14"
              strokeDasharray={`${activeArc} ${circumference}`} strokeLinecap="round" />
          </svg>
          <div className="pie-text">
            <div className="percentage">{activePct}%</div>
            <div className="pie-label">Active</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductDetails;
