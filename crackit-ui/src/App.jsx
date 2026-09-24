import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Tracker from './pages/Tracker'
import ResumePage from "./pages/ResumePage";
import ProfilePage from "./pages/ProfilePage";
import InterviewPrepPage from "./pages/InterviewPrepPage";
import DiscoverPage from "./pages/DiscoverPage";
import RoadmapPage from "./pages/RoadmapPage";
import LandingPage from "./pages/LandingPage";
import MyInterviewsPage from "./pages/MyInterviewsPage";
import { ToastProvider } from './components/ui/ToastProvider'
import ErrorBoundary from './components/ui/ErrorBoundary'
import NotFoundPage from './pages/NotFoundPage'


function PrivateRoute({ children }) {
    const { token } = useAuth()
    return token ? children : <Navigate to="/" replace />
}

function HomeRoute() {
    const { token } = useAuth()
    return token ? <Navigate to="/dashboard" /> : <LandingPage />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Root Route: Landing Page for guests, Dashboard redirect for logged-in users */}
              <Route path="/" element={<HomeRoute />} />

              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="roadmap" element={<RoadmapPage />} />
                <Route path="jobs" element={<Jobs />} />
                <Route path="jobs/:jobId" element={<JobDetail />} />
                <Route path="tracker" element={<Tracker />} />
                <Route path="resume" element={<ResumePage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="jobs/:jobId/prep" element={<InterviewPrepPage />} />
                <Route path="discover" element={<DiscoverPage />} />
                <Route path="interviews" element={<MyInterviewsPage />} />
              </Route>

              {/* Catch-all Creative 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}