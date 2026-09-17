import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ParentApp } from './ParentApp';
import '../../src/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ParentApp />
  </StrictMode>,
);
