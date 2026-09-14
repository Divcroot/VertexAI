import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { ProjectProvider } from './context/ProjectContext.tsx';
import { FileProvider } from './context/FileContext.tsx';

const savedTheme = localStorage.getItem("theme");
const isDark = savedTheme === null || savedTheme === "dark";

document.documentElement.classList.toggle("dark", isDark);

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <ProjectProvider>
      <FileProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </FileProvider>
    </ProjectProvider>
  </AuthProvider>,
)
