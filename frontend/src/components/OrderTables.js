import React from 'react';
import '../styles/OrderTables.css';

function OrderTables({ inventory = [], products = [] }) {
  const totalQty = inventory.reduce((s, i) => s + (i.quantity || 0), 0);
  const totalCost = products.reduce((s, p) => {
    const stock = inventory.find(i => i.productId === p.id);
    return s + (p.price || 0) * (stock?.quantity || 0);
  }, 0);

  return (
    <section className="order-tables card">
      <div className="tables-grid">
        <div className="order-card">
          <div className="order-header">
            <h3>Stock Overview</h3>
            <span className="period-tag">Live</span>
          </div>
          <div className="order-stat">
            <div className="stat-item">
              <label>Total Quantity</label>
              <div className="stat-val blue">{totalQty.toLocaleString()}</div>
            </div>
            <div className="stat-item">
              <label>Total Value</label>
              <div className="stat-val green">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        <div className="order-card">
          <div className="order-header">
            <h3>Product Status</h3>
            <span className="period-tag">Live</span>
          </div>
          <div className="order-table-wrapper">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Active</th>
                  <th>Inactive</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Direct</td>
                  <td className="status-confirmed">{products.filter(p => p.isActive).length}</td>
                  <td className="status-inactive">{products.filter(p => !p.isActive).length}</td>
                  <td>{products.length}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrderTables;
