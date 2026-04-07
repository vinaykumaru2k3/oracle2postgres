import React from 'react';
import '../styles/SalesActivity.css';

function SalesActivity({ inventory = [], products = [] }) {
  const totalQty = inventory.reduce((s, i) => s + (i.quantity || 0), 0);
  const activeProducts = products.filter(p => p.isActive).length;
  const inactiveProducts = products.filter(p => !p.isActive).length;

  const cards = [
    {
      label: 'Total Stock Qty', value: totalQty, unit: 'Units',
      icon: <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    },
    {
      label: 'Active Products', value: activeProducts, unit: 'Items',
      icon: <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    },
    {
      label: 'Inactive Products', value: inactiveProducts, unit: 'Items',
      icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    },
    {
      label: 'Recent Updates', value: inventory.length, unit: 'Logs',
      icon: <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    },
  ];

  return (
    <section className="sales-activity card">
      <h2 className="section-title">Sales Activity</h2>
      <div className="sales-grid">
        {cards.map(item => (
          <div key={item.label} className="sales-card">
            <div className="sales-icon">{item.icon}</div>
            <div className="sales-value">{item.value}</div>
            <div className="sales-unit">{item.unit}</div>
            <div className="sales-label">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SalesActivity;
