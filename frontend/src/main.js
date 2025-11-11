import { jsx as _jsx } from "react/jsx-runtime";
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// frontend/src/main.tsx
import 'leaflet/dist/leaflet.css'; // ✅ Leaflet地図用スタイル
import './styles/global.css'; // （あれば）
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
