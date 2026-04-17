import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Global reset
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
  a { text-decoration: none; }
  input:focus, textarea:focus, select:focus { outline: 2px solid #2563eb; outline-offset: 1px; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
