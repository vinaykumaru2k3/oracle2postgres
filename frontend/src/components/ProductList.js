import React from 'react';
import DataGrid from './DataGrid';
import '../styles/ProductList.css';

const columns = [
  { key: 'id',       label: 'ID',           width: '80px' },
  { key: 'name',     label: 'Product Name'               },
  { key: 'price',    label: 'Price',        width: '120px',
    render: v => `$${parseFloat(v).toFixed(2)}` },
  { key: 'isActive', label: 'Status',       width: '110px',
    render: v => (
      <span className={`status-badge ${v ? 'active' : 'inactive'}`}>
        {v ? 'Active' : 'Inactive'}
      </span>
    )},
];

function ProductList({ products, loading }) {
  const rows = products.map(p => ({ ...p, _key: p.id }));

  return (
    <section className="product-list card">
      <div className="product-list-header">
        <h2 className="section-title">All Products {!loading && `(${products.length})`}</h2>
      </div>
      <DataGrid
        columns={columns}
        rows={rows}
        pageSize={12}
        loading={loading}
        emptyText="No products found. Add one below!"
      />
    </section>
  );
}

export default ProductList;
