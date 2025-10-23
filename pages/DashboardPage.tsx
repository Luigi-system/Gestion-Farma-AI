import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import DashboardCard from '../components/DashboardCard';
import SalesChart from '../components/SalesChart';
import DataTable from '../components/DataTable';
import { supabase } from '../services/supabaseClient';
import { SalesData } from '../types';
import { CashRegisterIcon, PackageIcon } from '../components/icons';
import { useAuth } from '../components/Auth';
import { useTheme } from '../components/ThemeContext';

// Icons for cards
const DollarSignIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const AwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 22 12 17 17 22 15.79 13.88"/></svg>
);


// --- NEW CHART COMPONENTS ---

// Pie Chart for Payment Methods
const PaymentPieChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
    const { theme } = useTheme();
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
    const tooltipBg = theme === 'dark' ? '#1F2937' : '#FFFFFF';
    const tooltipBorder = theme === 'dark' ? '#374151' : '#E5E7EB';

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm h-96 dark:bg-gray-800 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 dark:text-gray-100">Ventas por Método de Pago</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '0.5rem', border: `1px solid ${tooltipBorder}`, backgroundColor: tooltipBg }} labelStyle={{ color: tickColor }} formatter={(value: number) => `S/ ${value.toFixed(2)}`} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

// Progress Bars for Top Products by Revenue
const TopProductsByRevenue: React.FC<{ data: { name: string; revenue: number }[] }> = ({ data }) => {
    const maxRevenue = Math.max(...data.map(d => d.revenue), 0);
    const PROGRESS_COLORS = ['bg-blue-500', 'bg-blue-400', 'bg-blue-300', 'bg-sky-300', 'bg-sky-200'];

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm h-96 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 dark:text-gray-100">Top 5 Productos por Ingresos</h3>
            <div className="space-y-4">
                {data.map((item, index) => (
                    <div key={item.name}>
                        <div className="flex justify-between items-center mb-1 text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">S/ {item.revenue.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div
                                className={`h-2.5 rounded-full ${PROGRESS_COLORS[index % PROGRESS_COLORS.length]}`}
                                style={{ width: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                 {data.length === 0 && <p className="text-center text-sm text-gray-500 pt-10">No hay datos de ingresos para mostrar.</p>}
            </div>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---

const DashboardPage: React.FC = () => {
  const { profile, user: authUser, sede, empresa } = useAuth(); // Use `profile` from useAuth
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User-specific stats
  const [userStats, setUserStats] = useState({ 
    totalSalesToday: 0, 
    totalRevenueToday: 0,
    totalCommissionsMonth: 0,
  });
  
  // Global stats
  const [globalStats, setGlobalStats] = useState({
      lowStock: 0
  });

  // Data for charts and tables
  const [topSellingProducts, setTopSellingProducts] = useState<SalesData[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<{ name: string; value: number }[]>([]);
  const [topRevenueProducts, setTopRevenueProducts] = useState<{ name: string; revenue: number }[]>([]);
  const [topAttendedClients, setTopAttendedClients] = useState<{ cliente: string; visitas: number }[]>([]);
  
  const fetchData = useCallback(async () => {
    if (!authUser || !profile || !sede || !empresa) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      today.setHours(0,0,0,0);
      const todayISO = today.toISOString();
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      
      const [
          salesTodayRes,
          commissionsRes,
          allUserSalesDetailsRes,
          allUserSalesRes,
          lowStockRes
      ] = await Promise.all([
        supabase.from('ventas').select('total').eq('usuario', authUser.email).gte('fecha_venta', todayISO).eq('sede_id', sede.id).eq('empresa_id', empresa.id),
        supabase.from('comisiones_generadas').select('monto_comision').eq('usuario_id', profile.id).gte('fecha_generacion', startOfMonth).eq('sede_id', sede.id).eq('empresa_id', empresa.id),
        supabase.from('detalle_ventas').select('producto_nombre, subtotal, cantidad').eq('usuario', authUser.email).eq('sede_id', sede.id).eq('empresa_id', empresa.id),
        supabase.from('ventas').select('cliente, tipo_pago, total').eq('usuario', authUser.email).eq('sede_id', sede.id).eq('empresa_id', empresa.id),
        supabase.from('productos').select('stock_unid, stock_min').eq('sede_id', sede.id).eq('empresa_id', empresa.id),
      ]);

      if (salesTodayRes.error) throw new Error(`Ventas Hoy: ${salesTodayRes.error.message}`);
      if (commissionsRes.error) throw new Error(`Comisiones: ${commissionsRes.error.message}`);
      if (allUserSalesDetailsRes.error) throw new Error(`Detalle Ventas: ${allUserSalesDetailsRes.error.message}`);
      if (allUserSalesRes.error) throw new Error(`Ventas Generales: ${allUserSalesRes.error.message}`);
      if (lowStockRes.error) throw new Error(`Stock Bajo: ${lowStockRes.error.message}`);
      
      // -- Process Data --
      
      // 1. User Stats
      const totalRevenueToday = (salesTodayRes.data || []).reduce((sum: number, sale) => sum + (sale.total || 0), 0);
      const totalCommissionsMonth = (commissionsRes.data || []).reduce((sum: number, c) => sum + (c.monto_comision || 0), 0);
      setUserStats({
          totalSalesToday: (salesTodayRes.data || []).length,
          totalRevenueToday,
          totalCommissionsMonth
      });
      
      // Calculate low stock count on the client as a workaround for the query error.
      const lowStockCount = (lowStockRes.data || []).filter(p => 
        p.stock_unid != null && p.stock_min != null && p.stock_unid <= p.stock_min
      ).length;
      setGlobalStats({ lowStock: lowStockCount });

      // 2. Top Selling Products (by quantity)
// FIX: Explicitly type the accumulator of the reduce function to ensure correct type inference for 'productCounts' and subsequently 'ventas'.
      const productCounts = (allUserSalesDetailsRes.data || []).reduce((acc: {[key: string]: number}, detail) => {
          if (detail.producto_nombre) {
            acc[detail.producto_nombre] = (acc[detail.producto_nombre] || 0) + (detail.cantidad || 0);
          }
          return acc;
      }, {});
      const topProducts = Object.entries(productCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 7)
          .map(([name, ventas]) => ({ name: name.split(' ')[0], ventas }));
      setTopSellingProducts(topProducts);

      // 3. Payment Method Distribution (Pie Chart)
// FIX: Explicitly type the accumulator of the reduce function to ensure correct type inference for 'paymentData' and subsequently 'value'.
      const paymentData = (allUserSalesRes.data || []).reduce((acc: {[key: string]: number}, sale) => {
          const method = sale.tipo_pago || 'Efectivo';
          acc[method] = (acc[method] || 0) + (sale.total || 0);
          return acc;
      }, {});
      setPaymentMethodData(Object.entries(paymentData).map(([name, value]) => ({ name, value })));

      // 4. Top Products by Revenue (Progress Bars)
      // FIX: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type. Explicitly typing the accumulator of the reduce function ensures that 'acc[detail.producto_nombre]' is treated as a number. This also fixes the subsequent error where 'revenue' was inferred as 'unknown'.
      const productRevenue = (allUserSalesDetailsRes.data || []).reduce((acc: {[key: string]: number}, detail) => {
          if(detail.producto_nombre) {
            acc[detail.producto_nombre] = (acc[detail.producto_nombre] || 0) + (detail.subtotal || 0);
          }
          return acc;
      }, {});
      const topRevenue = Object.entries(productRevenue)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, revenue]) => ({ name, revenue }));
      setTopRevenueProducts(topRevenue);

      // 5. Top Attended Clients
      // FIX: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type. Explicitly typing the accumulator of the reduce function ensures that 'acc[client]' is treated as a number. This also fixes the subsequent error where 'visitas' was inferred as 'unknown'.
      const clientCounts = (allUserSalesRes.data || []).reduce((acc: {[key: string]: number}, sale) => {
          const client = sale.cliente || 'Cliente Varios';
          acc[client] = (acc[client] || 0) + 1;
          return acc;
      }, {});
      const topClients = Object.entries(clientCounts)
          .filter(([name]) => name !== 'Cliente Varios')
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([cliente, visitas]) => ({ cliente, visitas }));
      setTopAttendedClients(topClients);

    } catch (err: any) {
      setError(`Error al cargar datos del dashboard: ${err.message}`);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [authUser, profile, sede, empresa]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clientColumns = [
    { header: 'Cliente', accessor: 'cliente' as keyof { cliente: string; visitas: number } },
    { header: 'N° de Ventas', accessor: 'visitas' as keyof { cliente: string; visitas: number } },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 bg-red-100 p-4 rounded-lg dark:bg-red-900/40 dark:text-red-300">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Mis Ventas del Día" 
          value={userStats.totalSalesToday} 
          icon={<CashRegisterIcon className="w-6 h-6"/>}
          color="blue"
        />
        <DashboardCard 
          title="Mis Ingresos del Día" 
          value={`S/ ${userStats.totalRevenueToday.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          icon={<DollarSignIcon />}
          color="green"
        />
        <DashboardCard 
          title="Mis Comisiones (Mes)" 
          value={`S/ ${userStats.totalCommissionsMonth.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          icon={<AwardIcon />}
          color="yellow"
        />
        <DashboardCard 
          title="Productos con Stock Bajo" 
          value={globalStats.lowStock} 
          icon={<PackageIcon className="w-6 h-6" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart data={topSellingProducts} />
          <PaymentPieChart data={paymentMethodData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsByRevenue data={topRevenueProducts} />
        <DataTable<{ cliente: string; visitas: number }> 
            title="Clientes Más Atendidos" 
            columns={clientColumns} 
            data={topAttendedClients}
        />
      </div>
    </div>
  );
};

export default DashboardPage;