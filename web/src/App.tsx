import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppShell } from './components/AppShell'
import { ScrollToTop } from './components/ScrollToTop'
import { BusLineDetailPage, BusLinesPage } from './pages/BusLinesPages'
import { BusLinesManagePage } from './pages/BusLinesManagePage'
import { AnnouncementsManagePage } from './pages/AnnouncementsManagePage'
import { BoardingSimulatorPage } from './pages/BoardingSimulatorPage'
import { SettingsPage } from './pages/SettingsPage'
import { DebtsPage } from './pages/DebtsPage'
import { DigitalCashDeskPage } from './pages/DigitalCashDeskPage'
import { GeographyAdminPage } from './pages/GeographyAdminPage'
import { HeadmensDetailPage, HeadmensPage } from './pages/HeadmensPage'
import { HomePage } from './pages/HomePage'
import { HrDepartmentPage, HrDirectoryPage } from './pages/HrDirectoryPage'
import { HrManagePage } from './pages/HrManagePage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { PanelPage, RequireAuth } from './pages/PanelPage'
import { PropertiesPage, WaterPage } from './pages/PropertiesWaterPages'
import { AnnouncementDetailPage, AnnouncementsPage } from './pages/PublicPages'
import { EventsDetailPage, EventsPage, MyEventsPage } from './pages/EventsPages'
import { ProjectsDetailPage, ProjectsPage } from './pages/ProjectsPages'
import { RegisterPage } from './pages/RegisterPage'
import { RequestDetailPage } from './pages/RequestDetailPage'
import { RequestsPage } from './pages/RequestsPage'
import { SocialAssistancePage } from './pages/SocialAssistancePage'
import { StaffDeskPage } from './pages/StaffDeskPage'
import { StaffPropertyPage } from './pages/StaffPropertyPage'
import { StaffWaterPage } from './pages/StaffWaterPage'
import { TransportNetworkPage } from './pages/TransportNetworkPage'
import { TransportPage } from './pages/TransportPage'
import { CorporatePage } from './pages/CorporatePage'
import { MayorPage } from './pages/MayorPage'
import { NewsDetailPage, NewsPage } from './pages/NewsPages'
import { CultureDetailPage, CulturePage } from './pages/CulturePages'
import { EBelediyeHubPage } from './pages/EBelediyePage'
import {
  ContactPage,
  DocumentApplicationsPage,
  MarriagePage,
  SportsAppointmentPage,
  TrackingPage,
  ZoningPage,
} from './pages/MunicipalPages'
import { ServiceGuideDetailPage, ServiceGuidePage } from './pages/ServiceGuidePages'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="giris" element={<LoginPage />} />
            <Route path="kayit" element={<RegisterPage />} />
            <Route path="sifremi-unuttum" element={<ForgotPasswordPage />} />
            <Route path="duyurular" element={<AnnouncementsPage />} />
            <Route path="duyurular/:id" element={<AnnouncementDetailPage />} />
            <Route path="duyuru-yonetimi" element={<AnnouncementsManagePage />} />
            <Route path="haberler" element={<NewsPage />} />
            <Route path="haberler/:id" element={<NewsDetailPage />} />
            <Route path="etkinlikler" element={<EventsPage />} />
            <Route path="etkinlikler/:id" element={<EventsDetailPage />} />
            <Route path="etkinliklerim" element={<RequireAuth><MyEventsPage /></RequireAuth>} />
            <Route path="faaliyetler" element={<ProjectsPage />} />
            <Route path="faaliyetler/:id" element={<ProjectsDetailPage />} />
            <Route path="kultur" element={<CulturePage />} />
            <Route path="kultur/:id" element={<CultureDetailPage />} />
            <Route path="hizmet-rehberi" element={<ServiceGuidePage />} />
            <Route path="hizmet-rehberi/:id" element={<ServiceGuideDetailPage />} />
            <Route path="baskan" element={<MayorPage />} />
            <Route path="kurumsal" element={<CorporatePage />} />
            <Route path="e-belediye" element={<EBelediyeHubPage />} />
            <Route path="iletisim" element={<ContactPage />} />
            <Route path="basvuru-takip" element={<TrackingPage />} />
            <Route path="basvurular" element={<RequireAuth><DocumentApplicationsPage /></RequireAuth>} />
            <Route path="nikah" element={<RequireAuth><MarriagePage /></RequireAuth>} />
            <Route path="imar" element={<ZoningPage />} />
            <Route path="spor-randevu" element={<RequireAuth><SportsAppointmentPage /></RequireAuth>} />
            <Route path="hatlar" element={<BusLinesPage />} />
            <Route path="hatlar/:id" element={<BusLineDetailPage />} />
            <Route path="ulasim-agi" element={<TransportNetworkPage />} />
            <Route path="hat-yonetimi" element={<BusLinesManagePage />} />
            <Route path="muhtarliklar" element={<HeadmensPage />} />
            <Route path="muhtarliklar/:id" element={<HeadmensDetailPage />} />
            <Route path="birimler" element={<HrDirectoryPage />} />
            <Route path="birimler/:id" element={<HrDepartmentPage />} />
            <Route path="birim-yonetimi" element={<HrManagePage />} />
            <Route path="panel" element={<RequireAuth><PanelPage /></RequireAuth>} />
            <Route path="ayarlar" element={<SettingsPage />} />
            <Route path="parola" element={<Navigate to="/ayarlar" replace />} />
            <Route path="vezne" element={<DigitalCashDeskPage />} />
            <Route path="borclar" element={<DebtsPage />} />
            <Route path="talepler" element={<RequestsPage />} />
            <Route path="talepler/:id" element={<RequestDetailPage />} />
            <Route path="ulasim" element={<TransportPage />} />
            <Route path="binis" element={<BoardingSimulatorPage />} />
            <Route path="mulkler" element={<PropertiesPage />} />
            <Route path="su" element={<WaterPage />} />
            <Route path="yardim" element={<SocialAssistancePage />} />
            <Route path="personel" element={<StaffDeskPage />} />
            <Route path="su-yonetimi" element={<StaffWaterPage />} />
            <Route path="mulk-yonetimi" element={<StaffPropertyPage />} />
            <Route path="cografya" element={<GeographyAdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
