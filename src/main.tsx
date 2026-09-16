import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { registerOfflineSupport } from './utils/offline';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerOfflineSupport();
