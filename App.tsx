import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './components/Auth';
import AppLayout from './components/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VentasPage from './pages/VentasPage';
import InventarioPage from './pages/InventarioPage';
import ConsultasIAPage from './pages/ConsultasIAPage';
import CajaPage from './pages/CajaPage';
import AlmacenPage from './pages/AlmacenPage';
import KardexPage from './pages/KardexPage';
import ProveedoresPage from './pages/ProveedoresPage';
import ClientesPage from './pages/ClientesPage';
import UsuariosPage from './pages/UsuariosPage';
import ConfiguracionesPage from './pages/ConfiguracionesPage';
import SedesPage from './pages/SedesPage';
import AdministracionPage from './pages/AdministracionPage';
import PromocionesPage from './pages/PromocionesPage';
import RegistrosPage from './pages/RegistrosPage';
import ComisionesPage from './pages/ComisionesPage';
import PedidosPage from './pages/PedidosPage';
import GastosPage from './pages/GastosPage';
import { ThemeProvider } from './components/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<LandingPage />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/app/dashboard" element={<DashboardPage />} />
                <Route path="/app/ventas" element={<VentasPage />} />
                <Route path="/app/inventario" element={<InventarioPage />} />
                <Route path="/app/consultas-ia" element={<ConsultasIAPage />} />
                <Route path="/app/caja" element={<CajaPage />} />
                <Route path="/app/almacen" element={<AlmacenPage />} />
                <Route path="/app/kardex" element={<KardexPage />} />
                <Route path="/app/proveedores" element={<ProveedoresPage />} />
                <Route path="/app/clientes" element={<ClientesPage />} />
                <Route path="/app/usuarios" element={<UsuariosPage />} />
                <Route path="/app/configuraciones" element={<ConfiguracionesPage />} />
                <Route path="/app/sedes" element={<SedesPage />} />
                <Route path="/app/administracion" element={<AdministracionPage />} />
                <Route path="/app/promociones" element={<PromocionesPage />} />
                <Route path="/app/pedidos" element={<PedidosPage />} />
                <Route path="/app/registros" element={<RegistrosPage />} />
                <Route path="/app/comisiones" element={<ComisionesPage />} />
                <Route path="/app/gastos" element={<GastosPage />} />
                 {/* Redirect /app to dashboard */}
                <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
              </Route>
            </Route>
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
