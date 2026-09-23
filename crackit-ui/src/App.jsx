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
import MyInterviewsPage from "./pages/MyInterviewsPage";
import { ToastProvider } from './components/ui/ToastProvider'


function PrivateRoute({ children }) {
    const { token } = useAuth()
    return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="jobs/:jobId" element={<JobDetail />} />
              <Route path="tracker" element={<Tracker />} />
              <Route path="resume" element={<ResumePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="jobs/:jobId/prep" element={<InterviewPrepPage />} />
              <Route path="discover" element={<DiscoverPage />} />
              <Route path="interviews" element={<MyInterviewsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}