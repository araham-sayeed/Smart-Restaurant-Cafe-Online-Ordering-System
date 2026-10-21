const show = (msg) => {
  document.body.innerHTML = `<pre style="padding:16px;color:#b00;white-space:pre-wrap">${msg}</pre>`;
};
window.addEventListener("error", (e) => show(`${e.message}\n${e.filename}:${e.lineno}`));
window.addEventListener("unhandledrejection", (e) => show(String(e.reason)));

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
