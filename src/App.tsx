import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PublicHome } from './pages/PublicHome';
import { StaffWorkspace } from './pages/StaffWorkspace';
import { AdminDashboard } from './pages/AdminDashboard';
import { SharedDocumentView } from './pages/SharedDocumentView';

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/staff" element={<StaffWorkspace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/share/:token" element={<SharedDocumentView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
export default App;
