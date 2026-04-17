import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 56px)' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/tickets" element={
              <PrivateRoute><Tickets /></PrivateRoute>
            } />
            <Route path="/tickets/new" element={
              <PrivateRoute><CreateTicket /></PrivateRoute>
            } />
            <Route path="/tickets/:id" element={
              <PrivateRoute><TicketDetail /></PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>
            } />
            <Route path="/notifications" element={
              <PrivateRoute><Notifications /></PrivateRoute>
            } />

            <Route path="/" element={<Navigate to="/tickets" replace />} />
            <Route path="*" element={<Navigate to="/tickets" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
