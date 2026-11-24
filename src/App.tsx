import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { PublicHome } from './pages/PublicHome';
import { StaffWorkspace } from './pages/StaffWorkspace';
import { AdminDashboard } from './pages/AdminDashboard';
import { SharedDocumentView } from './pages/SharedDocumentView';

function AppLayout() {
  const { pathname } = useLocation();
  const hideChrome = pathname.startsWith('/share');

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {!hideChrome && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/staff" element={<StaffWorkspace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/share/:token" element={<SharedDocumentView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
