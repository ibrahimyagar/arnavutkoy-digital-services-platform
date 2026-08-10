import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppShell } from './components/AppShell'
import { DebtsPage } from './pages/DebtsPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PanelPage, RequireAuth } from './pages/PanelPage'
import { AnnouncementsPage, BusLinesPage } from './pages/PublicPages'
import { RequestsPage } from './pages/RequestsPage'
import { TransportPage } from './pages/TransportPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="giris" element={<LoginPage />} />
            <Route path="duyurular" element={<AnnouncementsPage />} />
            <Route path="hatlar" element={<BusLinesPage />} />
            <Route path="panel" element={<RequireAuth><PanelPage /></RequireAuth>} />
            <Route path="borclar" element={<DebtsPage />} />
            <Route path="talepler" element={<RequestsPage />} />
            <Route path="ulasim" element={<TransportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
