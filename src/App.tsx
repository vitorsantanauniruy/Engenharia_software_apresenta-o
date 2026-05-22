import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout'; // Se estiver a usar um layout
import { Home } from './pages/Home';
import { EventDetails } from './pages/EventDetails';
import { Checkout } from './pages/Checkout';
import { MyTickets } from './pages/MyTickets';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          {/* A TAG MÃE COMEÇA AQUI */}
          <Routes> 
            
            <Route path="/" element={<Home />} />
            <Route path="/evento/:id" element={<EventDetails />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/meus-ingressos" element={<MyTickets />} />
            <Route path="/login" element={<Login />} />
            {/* A NOVA ROTA TEM DE ESTAR AQUI DENTRO! */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['PROMOTOR', 'ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

          {/* A TAG MÃE FECHA AQUI */}
          </Routes> 
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}