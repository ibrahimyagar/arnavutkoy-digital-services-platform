import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppShell } from './components/AppShell'
import { BusLineDetailPage, BusLinesPage } from './pages/BusLinesPages'
import { AnnouncementsManagePage } from './pages/AnnouncementsManagePage'
import { DebtsPage } from './pages/DebtsPage'
import { GeographyAdminPage } from './pages/GeographyAdminPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PanelPage, RequireAuth } from './pages/PanelPage'
import { PropertiesPage, WaterPage } from './pages/PropertiesWaterPages'
import { AnnouncementsPage } from './pages/PublicPages'
import { RequestDetailPage } from './pages/RequestDetailPage'
import { RequestsPage } from './pages/RequestsPage'
import { SocialAssistancePage } from './pages/SocialAssistancePage'
import { StaffDeskPage } from './pages/StaffDeskPage'
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
            <Route path="duyuru-yonetimi" element={<AnnouncementsManagePage />} />
            <Route path="hatlar" element={<BusLinesPage />} />
            <Route path="hatlar/:id" element={<BusLineDetailPage />} />
            <Route path="panel" element={<RequireAuth><PanelPage /></RequireAuth>} />
            <Route path="borclar" element={<DebtsPage />} />
            <Route path="talepler" element={<RequestsPage />} />
            <Route path="talepler/:id" element={<RequestDetailPage />} />
            <Route path="ulasim" element={<TransportPage />} />
            <Route path="mulkler" element={<PropertiesPage />} />
            <Route path="su" element={<WaterPage />} />
            <Route path="yardim" element={<SocialAssistancePage />} />
            <Route path="personel" element={<StaffDeskPage />} />
            <Route path="cografya" element={<GeographyAdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
