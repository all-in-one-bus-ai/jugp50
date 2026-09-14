import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import LoadingScreen from '@/components/ui/LoadingScreen';

const HomePage = lazy(() => import('@/pages/HomePage'));
const ParticipantsPage = lazy(() => import('@/pages/ParticipantsPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ConfirmationPage = lazy(() => import('@/pages/ConfirmationPage'));
const TicketPage = lazy(() => import('@/pages/TicketPage'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminParticipants = lazy(() => import('@/pages/admin/AdminParticipants'));
const TicketManagement = lazy(() => import('@/pages/admin/TicketManagement'));
const TicketVerification = lazy(() => import('@/pages/admin/TicketVerification'));
const EventsPage = lazy(() => import('@/pages/admin/EventsPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/participants" element={<ParticipantsPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/confirmation/:registrationId" element={<ConfirmationPage />} />
          <Route path="/ticket/:registrationId" element={<TicketPage />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="tickets" element={<TicketManagement />} />
          <Route path="verification" element={<TicketVerification />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
