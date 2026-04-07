import React, { useState } from 'react';
import DataGrid from './DataGrid';
import '../styles/ProductList.css';

function ProductList({ products, loading, onUpdate, onDelete }) {
  const [editId, setEditId]     = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving]     = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const startEdit = (product) => {
    setEditId(product.id);
    setEditData({ name: product.name, price: product.price });
  };

  const cancelEdit = () => { setEditId(null); setEditData({}); };

  const saveEdit = async () => {
    setSaving(true);
    await onUpdate(editId, editData);
    setEditId(null);
    setEditData({});
    setSaving(false);
  };

  const columns = [
    { key: 'id',       label: 'ID',           width: '70px',  sortable: true },
    {
      key: 'name', label: 'Product Name', sortable: true,
      render: (v, row) => editId === row.id
        ? <input className="inline-input" value={editData.name}
            onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
        : v,
    },
    {
      key: 'price', label: 'Price', width: '120px', sortable: true,
      render: (v, row) => editId === row.id
        ? <input className="inline-input" type="number" step="0.01" value={editData.price}
            onChange={e => setEditData(d => ({ ...d, price: e.target.value }))} />
        : `$${parseFloat(v).toFixed(2)}`,
    },
    {
      key: 'isActive', label: 'Status', width: '100px',
      render: v => (
        <span className={`status-badge ${v ? 'active' : 'inactive'}`}>
          {v ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: '_actions', label: '', width: '120px',
      render: (_, row) => editId === row.id
        ? (
          <div className="row-actions">
            <button className="act-btn save" onClick={saveEdit} disabled={saving}>
              {saving ? '…' : '✓'}
            </button>
            <button className="act-btn cancel" onClick={cancelEdit}>✕</button>
          </div>
        ) : (
          <div className="row-actions">
            <button className="act-btn edit" onClick={() => startEdit(row)} title="Edit">
              <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button className="act-btn delete" onClick={() => setConfirmId(row.id)} title="Delete">
              <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        ),
    },
  ];

  const rows = products.map(p => ({ ...p, _key: p.id, _actions: null }));

  return (
    <section className="product-list card">
      <div className="product-list-header">
        <h2 className="section-title">All Products {!loading && `(${products.length})`}</h2>
      </div>

      <DataGrid columns={columns} rows={rows} pageSize={12} loading={loading} emptyText="No products found." />

      {/* Confirm delete modal */}
      {confirmId && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>Deactivate product <strong>#{confirmId}</strong>?</p>
            <p className="confirm-sub">This will set the product as inactive.</p>
            <div className="confirm-actions">
              <button className="act-btn cancel" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="act-btn delete-confirm" onClick={() => { onDelete(confirmId); setConfirmId(null); }}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProductList;
