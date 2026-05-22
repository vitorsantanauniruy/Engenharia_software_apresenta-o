import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  allowedRoles: ('CLIENTE' | 'PROMOTOR' | 'ADMIN')[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="p-10 text-center font-bold text-gray-500">Verificando crachá de acesso...</div>;
  }

  // Se não estiver logado ou o papel não for permitido, volta para a Home
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}