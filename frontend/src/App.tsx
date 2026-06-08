import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ToastContainer } from '@/components/ui/Toast';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { PassengerHome } from '@/pages/passenger/PassengerHome';
import { PassengerHistory } from '@/pages/passenger/PassengerHistory';
import { PassengerProfile } from '@/pages/passenger/PassengerProfile';
import { DriverDashboard } from '@/pages/driver/DriverDashboard';
import { DriverRequests } from '@/pages/driver/DriverRequests';
import { DriverAnalytics } from '@/pages/driver/DriverAnalytics';
import { DriverProfile } from '@/pages/driver/DriverProfile';

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: 'PASSENGER' | 'DRIVER';
}) {
  const { user, loading } = useAuthStore();

  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'DRIVER' ? '/driver' : '/passenger'} replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuthStore();

  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'DRIVER' ? '/driver' : '/passenger'} replace />;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) return <SplashScreen />;
  if (user) {
    return <Navigate to={user.role === 'DRIVER' ? '/driver' : '/passenger'} replace />;
  }
  return children;
}

export default function App() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <>
    <ToastContainer />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/login"
          element={
            <AuthRedirect>
              <LoginPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRedirect>
              <RegisterPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/passenger"
          element={
            <ProtectedRoute role="PASSENGER">
              <AppLayout role="PASSENGER" />
            </ProtectedRoute>
          }
        >
          <Route index element={<PassengerHome />} />
          <Route path="history" element={<PassengerHistory />} />
          <Route path="profile" element={<PassengerProfile />} />
        </Route>
        <Route
          path="/driver"
          element={
            <ProtectedRoute role="DRIVER">
              <AppLayout role="DRIVER" />
            </ProtectedRoute>
          }
        >
          <Route index element={<DriverDashboard />} />
          <Route path="requests" element={<DriverRequests />} />
          <Route path="analytics" element={<DriverAnalytics />} />
          <Route path="profile" element={<DriverProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}
