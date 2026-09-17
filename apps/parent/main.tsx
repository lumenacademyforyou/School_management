import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ParentApp } from '../../src/apps/parent/ParentApp';
import '../../src/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ParentApp />
  </StrictMode>,
);
