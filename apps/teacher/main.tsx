import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TeacherApp } from './TeacherApp';
import { registerServiceWorker } from '../shared/webApp';
import '../../src/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TeacherApp />
  </StrictMode>,
);

registerServiceWorker();
