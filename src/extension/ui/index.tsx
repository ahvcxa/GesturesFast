// Dosya: src/extension/ui/index.tsx (Güncelle)
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Options } from './Options';
import './style.css'; // <-- BU SATIRI EKLEDİK

const container = document.getElementById('root');

if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <Options />
        </React.StrictMode>
    );
}