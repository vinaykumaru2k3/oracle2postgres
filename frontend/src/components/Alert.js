import React from 'react';
import '../styles/Alert.css';

function Alert({ message, type = 'success', onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">
        <span className="alert-icon">{type === 'success' ? '✓' : '✕'}</span>
        <span className="alert-message">{message}</span>
      </div>
      <button className="alert-close" onClick={onClose}>×</button>
    </div>
  );
}

export default Alert;

