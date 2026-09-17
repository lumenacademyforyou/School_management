import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TeacherApp } from '../../src/apps/teacher/TeacherApp';
import '../../src/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TeacherApp />
  </StrictMode>,
);
