import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import WorkOrders from './pages/WorkOrders';
import POS from './pages/POS';
import TimelineTracker from './pages/TimelineTracker';
import Warranties from './pages/Warranties';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Technicians from './pages/Technicians';
import { syncEvolutionMessages } from './lib/evolution';
import { useStore } from './lib/store';

function App() {
  const { fetchData, isLoading } = useStore();

  useEffect(() => {
    // Busca inicial de dados da Nuvem Supabase
    fetchData();

    // Poll Evolution API for new WhatsApp messages every 15 seconds
    const interval = setInterval(() => {
      syncEvolutionMessages();
    }, 15000);

    // Initial fetch
    syncEvolutionMessages();

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-main font-semibold">Conectando ao Banco de Dados...</p>
        </div>
      </div>
    );
  }

  const error = useStore.getState().error;
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg border border-red-100">
          <h2 className="text-xl font-bold text-red-700 mb-2">Erro de Conexão</h2>
          <p className="text-gray-600 mb-4">
            Não foi possível carregar os dados do banco de dados. Isso geralmente acontece se as tabelas ainda não foram criadas no Supabase.
          </p>
          <div className="bg-red-50 p-3 rounded text-xs text-red-800 font-mono mb-4 break-words">
            {error}
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/rastreio/:id" element={<TimelineTracker />} />

        {/* Admin Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="produtos" element={<Products />} />
          <Route path="tecnicos" element={<Technicians />} />
          <Route path="os" element={<WorkOrders />} />
          <Route path="mensagens" element={<Chat />} />
          <Route path="pdv" element={<POS />} />
          <Route path="garantias" element={<Warranties />} />
          <Route path="financeiro" element={<Finance />} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
