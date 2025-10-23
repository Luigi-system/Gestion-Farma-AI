import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { Sale, CompletedSaleInfo } from '../types';
import { supabase } from '../services/supabaseClient';
import SaleDetailModal from '../components/SaleDetailModal';
import { EyeIcon } from '../components/icons';
import { generateReceiptHtml } from '../services/receiptService';
import { useAuth } from '../components/Auth';

const PrintIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
);

const statusBadge = (status?: string | null) => {
    if (!status) return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200">N/A</span>;

    const lowerStatus = status.toLowerCase();
    let classes = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200'; // Default
    
    if (lowerStatus === 'completada' || lowerStatus === 'pagado') {
        classes = 'bg-green-100 text-pharmacy-green dark:bg-green-900/50 dark:text-green-300';
    } else if (lowerStatus === 'pendiente') {
        classes = 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300';
    } else if (lowerStatus === 'cancelada' || lowerStatus === 'anulada') {
        classes = 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300';
    }

    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}`}>{status}</span>
}

const VentasPage: React.FC = () => {
  const { sede, empresa } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [reprinting, setReprinting] = useState<number | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
        if (!sede || !empresa) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('ventas')
            .select('*')
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .order('fecha_venta', { ascending: false });

        if (error) {
            console.error('Error fetching ventas:', error);
            setError(`Error al cargar ventas: ${error.message}. Asegúrate de que la tabla "ventas" exista y tenga una política de RLS que permita la lectura.`);
        } else {
            setSales((data as Sale[]) || []);
            setError(null);
        }
        setLoading(false);
    };

    fetchSales();
  }, [sede, empresa]);
  
  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
  };

  const handleReprint = async (sale: Sale) => {
    setReprinting(sale.id);
    try {
        const { data: details, error } = await supabase
            .from('detalle_ventas')
            .select('*')
            .eq('venta_id', sale.id);

        if (error) throw error;
        
        // Reconstruct totals for the receipt
        const subtotal = sale.total;
        const totalAPagar = sale.total_a_pagar || sale.total;
        
        let totalDiscount = 0;
        if (sale.descuento_soles) {
            totalDiscount = sale.descuento_soles;
        } else if (sale.descuento_porcentaje) {
            totalDiscount = subtotal * (sale.descuento_porcentaje / 100);
        } else {
             totalDiscount = subtotal - totalAPagar; // Approximation
        }
        
        const baseImponible = totalAPagar / 1.18;
        const igv = totalAPagar - baseImponible;

        const saleInfo: CompletedSaleInfo = {
            saleData: sale,
            details: details as any, // Cast for simplicity, structure is compatible
            clientName: sale.cliente || 'Cliente Varios',
            totals: {
                subtotal,
                totalDiscount,
                baseImponible,
                igv,
                redondeo: totalAPagar - (subtotal - totalDiscount), // Approximation
                totalAPagar,
                vuelto: 0, // Not available on reprint
            },
        };

        const receiptHtml = generateReceiptHtml(saleInfo, sale.documento_tipo || 'boleta');
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    } catch (err: any) {
        setError(`Error al reimprimir: ${err.message}`);
    } finally {
        setReprinting(null);
    }
  };

  const saleColumns = [
    { header: 'ID Venta', accessor: 'id' as keyof Sale },
    { header: 'Fecha', accessor: 'fecha_venta' as keyof Sale, render: (item: Sale) => item.fecha_venta ? new Date(item.fecha_venta).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '-' },
    { header: 'Cliente', accessor: 'cliente' as keyof Sale },
    { header: 'Usuario', accessor: 'usuario' as keyof Sale },
    { header: 'Tipo Pago', accessor: 'tipo_pago' as keyof Sale },
    { header: 'Total', accessor: 'total' as keyof Sale, render: (item: Sale) => `S/ ${item.total.toFixed(2)}` },
    { header: 'Estado', accessor: 'estado' as keyof Sale, render: (item: Sale) => statusBadge(item.estado) },
    {
      header: 'Acciones',
      accessor: 'id' as keyof Sale,
      render: (item: Sale) => (
        <div className="flex justify-center items-center space-x-2">
            <button 
                onClick={() => handleViewSale(item)} 
                className="text-gray-500 hover:text-clinical-blue p-1 rounded-full hover:bg-blue-100 transition-colors dark:text-gray-400 dark:hover:bg-gray-700"
                title="Ver Detalle"
            >
                <EyeIcon className="w-5 h-5" />
            </button>
             <button 
                onClick={() => handleReprint(item)}
                disabled={reprinting === item.id}
                className="text-gray-500 hover:text-clinical-blue p-1 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-wait dark:text-gray-400 dark:hover:bg-gray-700"
                title="Reimprimir Documento"
            >
                {reprinting === item.id 
                    ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-clinical-blue"></div> 
                    : <PrintIcon className="w-5 h-5" />
                }
            </button>
        </div>
      )
    }
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
    <div>
      <DataTable<Sale>
        title="Historial de Ventas"
        columns={saleColumns}
        data={sales}
      />
       <SaleDetailModal 
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
};

export default VentasPage;