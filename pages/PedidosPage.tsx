import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Backorder } from '../types';
import DataTable from '../components/DataTable';
import { ClipboardListIcon } from '../components/icons';
import { useAuth } from '../components/Auth';

const PedidosPage: React.FC = () => {
    const { sede, empresa } = useAuth();
    const [pedidos, setPedidos] = useState<Backorder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPedidos = useCallback(async () => {
        if (!sede || !empresa) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('pedidos_clientes')
            .select('*')
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .order('created_at', { ascending: false });

        if (error) {
            setError(`Error al cargar pedidos: ${error.message}`);
        } else {
            setPedidos((data as Backorder[]) || []);
        }
        setLoading(false);
    }, [sede, empresa]);

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    const handleUpdateStatus = async (id: number, estado: Backorder['estado']) => {
        const { error } = await supabase
            .from('pedidos_clientes')
            .update({ estado })
            .eq('id', id);

        if (error) {
            alert(`Error al actualizar estado: ${error.message}`);
        } else {
            fetchPedidos();
        }
    };

    const statusBadge = (status: Backorder['estado']) => {
        const base = 'px-2 py-1 text-xs font-semibold rounded-full';
        if (status === 'Pendiente') return <span className={`${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200`}>Pendiente</span>;
        if (status === 'Notificado') return <span className={`${base} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200`}>Notificado</span>;
        if (status === 'Completado') return <span className={`${base} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`}>Completado</span>;
        return null;
    };

    const columns = [
        { header: 'Fecha', accessor: 'created_at' as keyof Backorder, render: (item: Backorder) => new Date(item.created_at!).toLocaleString('es-PE') },
        { header: 'Cliente', accessor: 'cliente_nombre' as keyof Backorder, render: (item: Backorder) => item.cliente_nombre || 'No especificado' },
        { header: 'Producto Solicitado', accessor: 'producto_nombre' as keyof Backorder },
        { header: 'Cantidad', accessor: 'cantidad' as keyof Backorder },
        { header: 'Notas', accessor: 'notas' as keyof Backorder },
        { header: 'Estado', accessor: 'estado' as keyof Backorder, render: (item: Backorder) => statusBadge(item.estado) },
        {
            header: 'Acciones',
            accessor: 'id' as keyof Backorder,
            render: (item: Backorder) => (
                <div className="flex items-center space-x-2">
                    {item.estado === 'Pendiente' && (
                        <button onClick={() => handleUpdateStatus(item.id, 'Notificado')} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Notificar</button>
                    )}
                    {item.estado !== 'Completado' && (
                        <button onClick={() => handleUpdateStatus(item.id, 'Completado')} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Completar</button>
                    )}
                </div>
            )
        }
    ];

    if (loading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>;
    if (error) return <div className="text-red-500 bg-red-100 p-4 rounded-lg dark:bg-red-900/40 dark:text-red-300">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <ClipboardListIcon className="h-8 w-8 text-gray-700 dark:text-gray-200" />
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Pedidos de Clientes (Faltantes)</h2>
                    <p className="text-gray-600 dark:text-gray-400">Aquí se registran los productos que los clientes solicitaron y no tenías en stock.</p>
                </div>
            </div>
            <DataTable<Backorder>
                title="Listado de Pedidos Pendientes"
                columns={columns}
                data={pedidos}
            />
        </div>
    );
};

export default PedidosPage;