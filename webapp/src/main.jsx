import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppDataProvider } from './lib/AppData.jsx';
import './styles/app.css';

// 게시용 빌드(npm run build:artifact)는 주소창을 쓰지 않는 메모리 라우터를 사용한다
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </Router>
  </StrictMode>,
);
