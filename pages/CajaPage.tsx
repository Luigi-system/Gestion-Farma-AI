import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Caja } from '../types';
import PuntoDeVenta from '../components/PuntoDeVenta';
import DataTable from '../components/DataTable';
import { useAuth } from '../components/Auth';


const HistorialCajasView: React.FC = () => {
    const { user: authUser, sede, empresa } = useAuth();
    const [history, setHistory] = useState<Caja[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!authUser || !sede || !empresa) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('caja')
                .select('*')
                .eq('sede_id', sede.id)
                .eq('empresa_id', empresa.id)
                .order('f_apertura', { ascending: false });
            
            if (error) {
                setError(`Error al cargar el historial: ${error.message}`);
            } else {
                setHistory(data || []);
            }
            setLoading(false);
        };
        fetchHistory();
    }, [authUser, sede, empresa]);

    const columns = [
        { header: 'F. Apertura', accessor: 'f_apertura' as keyof Caja, render: (item: Caja) => item.f_apertura ? new Date(item.f_apertura).toLocaleString('es-PE') : '-' },
        { header: 'F. Cierre', accessor: 'f_cierre' as keyof Caja, render: (item: Caja) => item.f_cierre ? new Date(item.f_cierre).toLocaleString('es-PE') : '-' },
        { header: 'Monto Apertura', accessor: 'monto_apertura' as keyof Caja, render: (item: Caja) => `S/ ${item.monto_apertura?.toFixed(2)}` },
        { header: 'Monto Sistema', accessor: 'monto_sistema' as keyof Caja, render: (item: Caja) => item.monto_sistema ? `S/ ${item.monto_sistema.toFixed(2)}` : '-' },
        { header: 'Monto Físico', accessor: 'monto_fisico' as keyof Caja, render: (item: Caja) => item.monto_fisico ? `S/ ${item.monto_fisico.toFixed(2)}` : '-' },
        { 
            header: 'Diferencia', 
            accessor: 'id' as keyof Caja, 
            render: (item: Caja) => {
                if (item.monto_sobrante && item.monto_sobrante > 0) {
                    return <span className="font-semibold text-pharmacy-green">S/ {item.monto_sobrante.toFixed(2)} (Sobrante)</span>;
                }
                if (item.monto_faltante && item.monto_faltante > 0) {
                    return <span className="font-semibold text-red-500">- S/ {item.monto_faltante.toFixed(2)} (Faltante)</span>;
                }
                return 'S/ 0.00';
            } 
        },
        { header: 'Estado', accessor: 'estado' as keyof Caja },
    ];

    if (loading) return <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>;
    if (error) return <div className="text-red-500 bg-red-100 p-4 rounded-lg mt-4 dark:bg-red-900/40 dark:text-red-300">{error}</div>;

    return (
        <div className="mt-6">
            <DataTable<Caja>
                title="Historial de Cajas"
                columns={columns}
                data={history}
            />
        </div>
    );
};


const CajaPage: React.FC = () => {
    const { user: authUser, sede, empresa } = useAuth();
    const [currentCaja, setCurrentCaja] = useState<Caja | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [montoApertura, setMontoApertura] = useState<number | ''>('');
    const [activeTab, setActiveTab] = useState<'pos' | 'historial'>('pos');

    const fetchCurrentCaja = useCallback(async () => {
        if (!authUser || !sede || !empresa) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('caja')
            .select('*')
            .eq('estado', 'abierta')
            .eq('usuario', authUser.email)
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .order('f_apertura', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
            console.error("Error fetching current caja:", error);
            setError(`Error al cargar el estado de la caja: ${error.message}`);
        } else {
            setCurrentCaja(data);
            setError(null);
        }
        setLoading(false);
    }, [authUser, sede, empresa]);

    useEffect(() => {
        fetchCurrentCaja();
    }, [fetchCurrentCaja]);

    const handleOpenCaja = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser || !sede || !empresa) {
            alert('No se ha podido identificar al usuario o su sede/empresa. Por favor, inicie sesión de nuevo.');
            return;
        }
        if (montoApertura === '' || montoApertura < 0) {
            alert('Por favor, ingresa un monto de apertura válido.');
            return;
        }

        const { error } = await supabase
            .from('caja')
            .insert([{
                usuario: authUser.email,
                f_apertura: new Date().toISOString(),
                monto_apertura: montoApertura,
                estado: 'abierta',
                sede_id: sede.id,
                empresa_id: empresa.id
            }]);
        
        if (error) {
            alert(`Error al abrir la caja: ${error.message}`);
            console.error("Error opening caja:", error);
        } else {
            setIsModalOpen(false);
            setMontoApertura('');
            fetchCurrentCaja();
        }
    };
    
    const renderContent = () => {
        if (activeTab === 'historial') {
            return <HistorialCajasView />;
        }
        
        if (loading) {
            return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>;
        }

        if (error) {
            return <div className="text-red-500 bg-red-100 p-4 rounded-lg dark:bg-red-900/40 dark:text-red-300">{error}</div>;
        }
        
        return currentCaja ? (
                <PuntoDeVenta cajaInfo={currentCaja} onCajaClosed={fetchCurrentCaja} />
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800 mt-6">
                    <div className="text-center p-8 border border-gray-200 rounded-lg dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Caja Cerrada</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">No hay ninguna caja abierta para tu usuario. Para iniciar las ventas, por favor, abre una nueva caja.</p>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 px-6 py-3 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Abrir Caja
                        </button>
                    </div>
                </div>
            );
    }

    return (
        <div className="h-full flex flex-col">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Caja</h2>
                <div className="border-b border-gray-200 dark:border-gray-700 mt-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('pos')}
                            className={`${
                                activeTab === 'pos'
                                ? 'border-clinical-blue text-clinical-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Punto de Venta
                        </button>
                        <button
                             onClick={() => setActiveTab('historial')}
                             className={`${
                                activeTab === 'historial'
                                ? 'border-clinical-blue text-clinical-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Historial de Cajas
                        </button>
                    </nav>
                </div>
            </div>

            <div className="flex-grow min-h-0">
                 {renderContent()}
            </div>
            
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md z-50 dark:bg-gray-800">
                        <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Abrir Nueva Caja</h3>
                        <form onSubmit={handleOpenCaja}>
                            <div>
                                <label htmlFor="monto_apertura" className="block text-sm font-medium text-gray-900 dark:text-gray-200">Monto de Apertura (S/)</label>
                                <input 
                                    type="number" 
                                    name="monto_apertura" 
                                    id="monto_apertura" 
                                    value={montoApertura}
                                    onChange={(e) => setMontoApertura(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    step="0.10"
                                    min="0"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-clinical-blue focus:border-clinical-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex justify-end pt-6 space-x-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600">Confirmar Apertura</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CajaPage;