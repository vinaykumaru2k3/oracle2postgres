import React from 'react';
import '../styles/InventorySummary.css';

function InventorySummary({ data }) {
  const items = [
    { label: 'Quantity in Hand',      value: data.quantityInHand || '0' },
    { label: 'To Be Received',        value: data.quantityToBeReceived || '—' },
    { label: 'Low Stock Items',       value: data.lowStockItems ?? 0, critical: true },
    { label: 'Active Items',          value: data.activeItems ?? 0 },
  ];

  return (
    <section className="inventory-summary card">
      <h2 className="section-title">Inventory Summary</h2>
      <div className="summary-grid">
        {items.map(item => (
          <div key={item.label} className="summary-item">
            <div className="summary-label">{item.label}</div>
            <div className={`summary-value${item.critical ? ' critical' : ''}`}>{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default InventorySummary;
