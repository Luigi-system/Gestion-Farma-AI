import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import DataTable from '../components/DataTable';
import { Client, HistorialCanje } from '../types';
import { createNewClientNotification } from '../services/notificationService';
import { useAuth } from '../components/Auth';

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
);
const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const ClientesPage: React.FC = () => {
    const { sede, empresa } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentClient, setCurrentClient] = useState<Partial<Client> | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [history, setHistory] = useState<HistorialCanje[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [clientForHistory, setClientForHistory] = useState<Client | null>(null);

    const fetchClients = useCallback(async () => {
        if (!sede || !empresa) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .order('nombres', { ascending: true });

        if (error) {
            setError(`Error al cargar clientes: ${error.message}.`);
        } else {
            setClients((data as Client[]) || []);
            setError(null);
        }
        setLoading(false);
    }, [sede, empresa]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const openModalForNew = () => {
        setCurrentClient({ nombres: '', dni: '', nacimiento: '', lugar_nacimiento: '', celular: '', puntos: 0 });
        setIsModalOpen(true);
    };

    const openModalForEdit = (client: Client) => {
        setCurrentClient(client);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentClient(null);
    };

    const openConfirmModal = (client: Client) => {
        setClientToDelete(client);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setClientToDelete(null);
    };
    
    const openHistoryModal = async (client: Client) => {
        if (!sede || !empresa) return;
        setClientForHistory(client);
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        const { data, error } = await supabase
            .from('historial_canjes')
            .select('*')
            .eq('cliente_id', client.id)
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .order('fecha', { ascending: false });
        
        if(error) {
            alert(`Error al cargar el historial: ${error.message}`);
        } else {
            setHistory(data || []);
        }
        setHistoryLoading(false);
    }
    
    const closeHistoryModal = () => {
        setIsHistoryModalOpen(false);
        setClientForHistory(null);
        setHistory([]);
    }

    const handleDelete = async () => {
        if (!clientToDelete) return;
        const { error } = await supabase.from('clientes').delete().eq('id', clientToDelete.id);
        closeConfirmModal();
        if (error) {
            alert(`Error al eliminar el cliente: ${error.message}`);
        } else {
            fetchClients();
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentClient || !sede || !empresa) return;
        const { id, ...clientData } = currentClient;
        const dataToSubmit: Omit<Partial<Client>, 'id'> = { ...clientData };
        if (dataToSubmit.dni === '') dataToSubmit.dni = null;
        if (dataToSubmit.nacimiento === '') dataToSubmit.nacimiento = null;
        if (dataToSubmit.celular === '') dataToSubmit.celular = null;
        if (dataToSubmit.lugar_nacimiento === '') dataToSubmit.lugar_nacimiento = null;
        if (dataToSubmit.puntos === null || dataToSubmit.puntos === undefined || isNaN(dataToSubmit.puntos)) {
            dataToSubmit.puntos = 0;
        }
        
        dataToSubmit.sede_id = sede.id;
        dataToSubmit.empresa_id = empresa.id;

        let response;
        if (id) {
            response = await supabase.from('clientes').update(dataToSubmit).eq('id', id).select().single();
        } else {
            response = await supabase.from('clientes').insert([dataToSubmit]).select().single();
        }

        if (response.error) {
            alert(`Error al guardar el cliente: ${response.error.message}`);
        } else {
            if (!id && response.data && sede && empresa) {
                createNewClientNotification(response.data as Client, sede.id, empresa.id);
            }
            closeModal();
            fetchClients();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setCurrentClient(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? (value === '' ? null : parseInt(value, 10)) : value 
        }));
    };
    
    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            client.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.dni?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, clients]);

    const clientColumns = [
        { header: 'Nombres', accessor: 'nombres' as keyof Client },
        { header: 'DNI', accessor: 'dni' as keyof Client },
        { header: 'Celular', accessor: 'celular' as keyof Client },
        { header: 'Puntos', accessor: 'puntos' as keyof Client },
        {
            header: 'Acciones',
            accessor: 'id' as keyof Client,
            render: (item: Client) => (
                <div className="flex items-center space-x-2">
                    <button onClick={() => openHistoryModal(item)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Historial de Canjes"><HistoryIcon className="w-4 h-4" /></button>
                    <button onClick={() => openModalForEdit(item)} className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Editar"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => openConfirmModal(item)} className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                </div>
            )
        }
    ];
    
    const historyColumns = [
        { header: 'Producto Canjeado', accessor: 'producto' as keyof HistorialCanje },
        { header: 'Fecha', accessor: 'fecha' as keyof HistorialCanje, render: (item: HistorialCanje) => new Date(item.fecha!).toLocaleDateString('es-PE') },
        { header: 'Puntos Gastados', accessor: 'puntos_gastados' as keyof HistorialCanje },
        { header: 'Usuario', accessor: 'usuario' as keyof HistorialCanje },
    ];

    if (loading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>;
    if (error) return <div className="text-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-300 p-4 rounded-lg">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Gestión de Clientes</h2>
                <button onClick={openModalForNew} className="px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600">Añadir Cliente</button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <input
                    type="text"
                    placeholder="Buscar por nombres o DNI..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-clinical-blue focus:border-clinical-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <DataTable<Client> title="Listado de Clientes" columns={clientColumns} data={filteredClients} />
            {isModalOpen && currentClient && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-6 dark:text-gray-100">{currentClient.id ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="nombres" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Nombres</label>
                                <input type="text" name="nombres" id="nombres" value={currentClient.nombres || ''} onChange={handleInputChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="dni" className="block text-sm font-medium text-gray-900 dark:text-gray-300">DNI</label>
                                    <input type="text" name="dni" id="dni" value={currentClient.dni || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="celular" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Celular</label>
                                    <input type="tel" name="celular" id="celular" value={currentClient.celular || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="nacimiento" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Fecha de Nacimiento</label>
                                    <input type="date" name="nacimiento" id="nacimiento" value={currentClient.nacimiento || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="lugar_nacimiento" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Lugar de Nacimiento</label>
                                    <input type="text" name="lugar_nacimiento" id="lugar_nacimiento" value={currentClient.lugar_nacimiento || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="puntos" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Puntos</label>
                                    <input type="number" name="puntos" id="puntos" value={currentClient.puntos ?? ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                                </div>
                            </div>
                            <style>{`
                                .input-style {
                                    @apply bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-400 dark:placeholder-gray-500;
                                }
                            `}</style>
                            <div className="flex justify-end pt-4 space-x-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isConfirmModalOpen && clientToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl sm:my-8 sm:max-w-lg sm:w-full sm:p-6">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangleIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Confirmar Eliminación</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">¿Estás seguro de que quieres eliminar a <strong>{clientToDelete.nombres}</strong>?</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button type="button" onClick={handleDelete} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">Eliminar</button>
                            <button type="button" onClick={closeConfirmModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto sm:text-sm">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
            {isHistoryModalOpen && clientForHistory && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl z-50 max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Historial de Canjes de: <span className="text-clinical-blue">{clientForHistory.nombres}</span></h3>
                        {historyLoading ? (
                            <div className="flex justify-center items-center h-48"><div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>
                        ) : history.length > 0 ? (
                           <div className="overflow-y-auto">
                             <DataTable<HistorialCanje> title="" columns={historyColumns} data={history} />
                           </div>
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Este cliente no tiene canjes registrados.</p>
                        )}
                        <div className="flex justify-end pt-4 mt-auto">
                            <button type="button" onClick={closeHistoryModal} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesPage;