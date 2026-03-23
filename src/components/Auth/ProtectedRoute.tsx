import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../../lib/store';

const ProtectedRoute: React.FC = () => {
  const { session, isAuthLoading } = useStore();

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-main font-semibold">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
