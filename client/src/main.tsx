import React from 'react';
import ReactDOM from 'react-dom/client';
// Self-hosted fonts (no external Google Fonts request).
// Display = Marcellus (single 400 weight by design). Body = Inter. Numerals = JetBrains Mono (tabular).
import '@fontsource/marcellus/400.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import App from './App.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
