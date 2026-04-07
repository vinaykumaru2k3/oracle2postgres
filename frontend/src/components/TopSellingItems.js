import React from 'react';
import '../styles/TopSellingItems.css';

function TopSellingItems({ activeStock = [] }) {
  const topItems = [...activeStock]
    .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
    .slice(0, 5);

  return (
    <section className="top-selling-items card">
      <div className="items-header">
        <h2 className="section-title">Top Stock Items</h2>
        <span className="items-badge">By Quantity</span>
      </div>

      {topItems.length === 0 ? (
        <div style={{ color: '#bbb', textAlign: 'center', padding: '24px', fontSize: '0.875rem' }}>
          No stock data available.
        </div>
      ) : (
        <div className="items-list">
          {topItems.map((item, i) => (
            <div key={item.id || i} className="item-row">
              <div className="item-rank">#{i + 1}</div>
              <div className="item-icon">
                <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <div className="item-info">
                <div className="item-name">{item.name}</div>
                <div className="item-meta">${parseFloat(item.price || 0).toFixed(2)} per unit</div>
              </div>
              <div className="qty-badge">{item.quantity} units</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default TopSellingItems;
