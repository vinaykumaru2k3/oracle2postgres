import React, { useState } from 'react';
import '../styles/DataGrid.css';

const PAGE_SIZE = 12;

function DataGrid({ columns, rows, pageSize = PAGE_SIZE, loading, emptyText = 'No data found.' }) {
  const [page, setPage] = useState(1);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  // Reset to page 1 when rows change
  React.useEffect(() => { setPage(1); }, [rows.length]);

  if (loading) return <div className="dg-loading">Loading...</div>;
  if (total === 0) return <div className="dg-empty">{emptyText}</div>;

  return (
    <div className="dg-wrapper">
      <div className="dg-scroll">
        <table className="dg-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={{ width: col.width }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={row._key ?? i}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dg-footer">
        <span className="dg-info">
          {start + 1}–{Math.min(start + pageSize, total)} of {total}
        </span>
        <div className="dg-pagination">
          <button className="dg-btn" onClick={() => goTo(1)} disabled={page === 1}>«</button>
          <button className="dg-btn" onClick={() => goTo(page - 1)} disabled={page === 1}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...'
                ? <span key={`e${i}`} className="dg-ellipsis">…</span>
                : <button key={p} className={`dg-btn${page === p ? ' active' : ''}`} onClick={() => goTo(p)}>{p}</button>
            )}
          <button className="dg-btn" onClick={() => goTo(page + 1)} disabled={page === totalPages}>›</button>
          <button className="dg-btn" onClick={() => goTo(totalPages)} disabled={page === totalPages}>»</button>
        </div>
      </div>
    </div>
  );
}

export default DataGrid;
