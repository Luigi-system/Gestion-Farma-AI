import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import DataTable from '../components/DataTable';
import { Promocion, ProductoCanje, Client } from '../types';

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);
const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);
const GiftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
);
const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);

// --- Notification Icons ---
const SuccessIcon = () => <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const WarningIcon = () => <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ErrorIcon = () => <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CloseIcon = () => <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>;

type NotificationType = 'success' | 'warning' | 'error' | 'info';

const PromocionesPage: React.FC = () => {
    const [promociones, setPromociones] = useState<Promocion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPromocion, setCurrentPromocion] = useState<Partial<Promocion> | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [promocionToDelete, setPromocionToDelete] = useState<Promocion | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
    const [promotionForProducts, setPromotionForProducts] = useState<Promocion | null>(null);
    const [exchangeProducts, setExchangeProducts] = useState<ProductoCanje[]>([]);
    const [loadingExchangeProducts, setLoadingExchangeProducts] = useState(false);
    const [newExchangeProduct, setNewExchangeProduct] = useState<Partial<ProductoCanje>>({ nombre: '', puntos_requeridos: undefined, stock: 1 });

    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
    const [promotionForRedeem, setPromotionForRedeem] = useState<Promocion | null>(null);
    const [redeemProducts, setRedeemProducts] = useState<ProductoCanje[]>([]);
    const [loadingRedeemProducts, setLoadingRedeemProducts] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [foundClients, setFoundClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [redeemingProductId, setRedeemingProductId] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);

    const showNotification = (message: string, type: NotificationType) => {
        setNotification({ message, type });
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchPromociones = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('promociones')
            .select('*')
            .order('fecha_inicio', { ascending: false });

        if (error) {
            setError(`Error al cargar promociones: ${error.message}.`);
        } else {
            setPromociones(data || []);
            setError(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPromociones();
    }, [fetchPromociones]);

    useEffect(() => {
        if (clientSearch.length < 2) {
            setFoundClients([]);
            return;
        }
        const search = async () => {
            const { data } = await supabase
                .from('clientes')
                .select('*')
                .or(`nombres.ilike.%${clientSearch}%,dni.ilike.%${clientSearch}%`)
                .limit(5);
            setFoundClients(data || []);
        };
        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [clientSearch]);

    const openModalForNew = () => {
        const today = new Date().toISOString().split('T')[0];
        setCurrentPromocion({ nombre: '', fecha_inicio: today, fecha_fin: '', multiplicador: 1 });
        setIsModalOpen(true);
    };

    const openModalForEdit = (promocion: Promocion) => {
        setCurrentPromocion(promocion);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentPromocion(null);
    };

    const openConfirmModal = (promocion: Promocion) => {
        setPromocionToDelete(promocion);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setPromocionToDelete(null);
    };
    
    const fetchExchangeProducts = useCallback(async (promoId: number) => {
        setLoadingExchangeProducts(true);
        const { data, error } = await supabase
            .from('productos_canje')
            .select('*')
            .eq('id_promo', promoId)
            .order('nombre');
        
        if (error) {
            showNotification(`Error al cargar productos de canje: ${error.message}`, 'error');
            setExchangeProducts([]);
        } else {
            setExchangeProducts(data || []);
        }
        setLoadingExchangeProducts(false);
    }, []);

    const openProductsModal = (promocion: Promocion) => {
        setPromotionForProducts(promocion);
        setIsProductsModalOpen(true);
        fetchExchangeProducts(promocion.id);
    };

    const closeProductsModal = () => {
        setIsProductsModalOpen(false);
        setPromotionForProducts(null);
        setExchangeProducts([]);
        setNewExchangeProduct({ nombre: '', puntos_requeridos: undefined, stock: 1 });
    };

    const handleNewExchangeProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setNewExchangeProduct(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? undefined : parseInt(value, 10)) : value,
        }));
    };

    const handleAddExchangeProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExchangeProduct.nombre || !newExchangeProduct.puntos_requeridos || !promotionForProducts) return;
        
        const stock = newExchangeProduct.stock ?? 0;
        const estado = stock > 0 ? 'Disponible' : 'Agotado';

        const { error } = await supabase.from('productos_canje').insert({
            id_promo: promotionForProducts.id,
            nombre: newExchangeProduct.nombre,
            puntos_requeridos: newExchangeProduct.puntos_requeridos,
            stock: stock,
            estado: estado,
        });

        if (error) {
            showNotification(`Error al añadir producto: ${error.message}`, 'error');
        } else {
            setNewExchangeProduct({ nombre: '', puntos_requeridos: undefined, stock: 1 });
            fetchExchangeProducts(promotionForProducts.id);
        }
    };
    
    const handleDeleteExchangeProduct = async (productId: number) => {
        if (!promotionForProducts) return;
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto de canje?')) {
            const { error } = await supabase.from('productos_canje').delete().eq('id', productId);
            if (error) {
                showNotification(`Error al eliminar: ${error.message}`, 'error');
            } else {
                fetchExchangeProducts(promotionForProducts.id);
            }
        }
    };

    const fetchRedeemProductsForModal = async (promoId: number) => {
        setLoadingRedeemProducts(true);
        const { data, error } = await supabase.from('productos_canje').select('*').eq('id_promo', promoId).gt('stock', 0);
         if (error) {
            showNotification('No se pudieron cargar los productos para canje.', 'error');
            setRedeemProducts([]);
        } else {
            setRedeemProducts(data || []);
        }
        setLoadingRedeemProducts(false);
    };

     const openRedeemModal = async (promocion: Promocion) => {
        setPromotionForRedeem(promocion);
        setIsRedeemModalOpen(true);
        await fetchRedeemProductsForModal(promocion.id);
    };

    const closeRedeemModal = () => {
        setIsRedeemModalOpen(false);
        setPromotionForRedeem(null);
        setRedeemProducts([]);
        setClientSearch('');
        setFoundClients([]);
        setSelectedClient(null);
    };

    const handleRedeemPoints = async (product: ProductoCanje) => {
        if (!selectedClient || redeemingProductId || !promotionForRedeem) return;
        if ((selectedClient.puntos || 0) < product.puntos_requeridos) {
            showNotification('El cliente no tiene puntos suficientes.', 'warning');
            return;
        }

        setRedeemingProductId(product.id);
        const originalClientPoints = selectedClient.puntos || 0;
        const newPoints = originalClientPoints - product.puntos_requeridos;

        try {
            const { error: clientError } = await supabase.from('clientes').update({ puntos: newPoints }).eq('id', selectedClient.id);
            if (clientError) throw new Error(`Al actualizar puntos del cliente: ${clientError.message}`);
            
            const { error: historyError } = await supabase.from('historial_canjes').insert({
                cliente_id: selectedClient.id,
                cliente: selectedClient.nombres,
                producto_id: product.id,
                producto: product.nombre,
                usuario: 'admin_user',
                puntos_gastados: product.puntos_requeridos,
                fecha: new Date().toISOString()
            });
            if (historyError) throw new Error(`Al registrar el canje: ${historyError.message}`);
            
            const currentStock = product.stock || 0;
            if (currentStock < 1) throw new Error('El producto ya no tiene stock.');
            
            const newStock = currentStock - 1;
            const newStatus = newStock > 0 ? 'Disponible' : 'Agotado';

            const { error: stockError } = await supabase.from('productos_canje').update({ stock: newStock, estado: newStatus }).eq('id', product.id);
            if (stockError) throw new Error(`Al actualizar el stock del producto: ${stockError.message}`);

            showNotification('Canje realizado con éxito.', 'success');
            setSelectedClient(prev => prev ? { ...prev, puntos: newPoints } : null);
            await fetchRedeemProductsForModal(promotionForRedeem.id);

        } catch (error: any) {
            await supabase.from('clientes').update({ puntos: originalClientPoints }).eq('id', selectedClient.id);
            showNotification(`Ocurrió un error: ${error.message}`, 'error');
        } finally {
            setRedeemingProductId(null);
        }
    };


    const handleDelete = async () => {
        if (!promocionToDelete) return;
        const { error } = await supabase.from('promociones').delete().eq('id', promocionToDelete.id);
        closeConfirmModal();
        if (error) {
            showNotification(`Error al eliminar: ${error.message}`, 'error');
        } else {
            fetchPromociones();
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPromocion) return;

        const { id, ...promoData } = currentPromocion;
        if (promoData.multiplicador === null || promoData.multiplicador === undefined || isNaN(promoData.multiplicador)) {
            promoData.multiplicador = null;
        }

        let response;
        if (id) {
            response = await supabase.from('promociones').update(promoData).eq('id', id);
        } else {
            response = await supabase.from('promociones').insert([promoData]);
        }

        if (response.error) {
            showNotification(`Error al guardar: ${response.error.message}`, 'error');
        } else {
            closeModal();
            fetchPromociones();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setCurrentPromocion(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
        }));
    };

    const filteredPromociones = useMemo(() => {
        return promociones.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, promociones]);
    
    const columns = [
        { header: 'Nombre', accessor: 'nombre' as keyof Promocion },
        { header: 'Fecha Inicio', accessor: 'fecha_inicio' as keyof Promocion },
        { header: 'Fecha Fin', accessor: 'fecha_fin' as keyof Promocion },
        { header: 'Multiplicador Puntos', accessor: 'multiplicador' as keyof Promocion, render: (item: Promocion) => item.multiplicador ? `x${item.multiplicador}` : '-' },
        {
            header: 'Acciones',
            accessor: 'id' as keyof Promocion,
            render: (item: Promocion) => (
                <div className="flex space-x-3">
                    <button onClick={() => openRedeemModal(item)} className="p-1 text-yellow-500 hover:text-yellow-700" title="Canjear Puntos"><StarIcon className="w-5 h-5" /></button>
                    <button onClick={() => openProductsModal(item)} className="p-1 text-green-500 hover:text-green-700" title="Añadir Productos de Canje"><GiftIcon className="w-5 h-5" /></button>
                    <button onClick={() => openModalForEdit(item)} className="p-1 text-blue-500 hover:text-blue-700" title="Editar"><EditIcon className="w-5 h-5" /></button>
                    <button onClick={() => openConfirmModal(item)} className="p-1 text-red-500 hover:text-red-700" title="Eliminar"><TrashIcon className="w-5 h-5" /></button>
                </div>
            )
        }
    ];

    if (loading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>;
    if (error) return <div className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;

    const inputStyleClass = "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-400 dark:placeholder-gray-500";
    const notificationStyles = { success: { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500', text: 'text-green-800 dark:text-green-200', icon: <SuccessIcon /> }, warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', icon: <WarningIcon /> }, error: { bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-500', text: 'text-red-800 dark:text-red-200', icon: <ErrorIcon /> }, info: { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-500', text: 'text-blue-800 dark:text-blue-200', icon: <WarningIcon /> }, };

    return (
        <div className="space-y-6">
            {notification && ( <div className={`fixed top-24 right-8 z-50 p-4 border-l-4 rounded-md shadow-lg flex items-center max-w-sm ${notificationStyles[notification.type].bg} ${notificationStyles[notification.type].border} ${notificationStyles[notification.type].text}`} role="alert" > <div className="flex-shrink-0">{notificationStyles[notification.type].icon}</div> <div className="ml-3 flex-1"><p className="text-sm font-medium">{notification.message}</p></div> <button onClick={() => setNotification(null)} className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${notificationStyles[notification.type].bg}`}> <span className="sr-only">Cerrar</span><CloseIcon /> </button> </div> )}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Gestión de Promociones</h2>
                <button onClick={openModalForNew} className="px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600">
                    Crear Promoción
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <input
                    type="text"
                    placeholder="Buscar por nombre de promoción..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-clinical-blue focus:border-clinical-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <DataTable<Promocion>
                title="Listado de Promociones"
                columns={columns}
                data={filteredPromociones}
            />
            {isModalOpen && currentPromocion && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg z-50">
                        <h3 className="text-xl font-semibold mb-6 dark:text-gray-100">{currentPromocion.id ? 'Editar Promoción' : 'Crear Promoción'}</h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Nombre</label>
                                <input type="text" name="nombre" value={currentPromocion.nombre || ''} onChange={handleInputChange} required className={`mt-1 block w-full ${inputStyleClass}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Fecha de Inicio</label>
                                    <input type="date" name="fecha_inicio" value={currentPromocion.fecha_inicio || ''} onChange={handleInputChange} required className={`mt-1 block w-full ${inputStyleClass}`} />
                                </div>
                                <div>
                                    <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Fecha de Fin</label>
                                    <input type="date" name="fecha_fin" value={currentPromocion.fecha_fin || ''} onChange={handleInputChange} required className={`mt-1 block w-full ${inputStyleClass}`} />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="multiplicador" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Multiplicador de Puntos (opcional)</label>
                                <input type="number" step="0.1" name="multiplicador" value={currentPromocion.multiplicador ?? ''} onChange={handleInputChange} placeholder="Ej: 1.5" className={`mt-1 block w-full ${inputStyleClass}`} />
                            </div>
                            <div className="flex justify-end pt-4 space-x-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isConfirmModalOpen && promocionToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl sm:my-8 sm:max-w-lg sm:w-full sm:p-6">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangleIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Confirmar Eliminación</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">¿Estás seguro de que quieres eliminar la promoción <strong>{promocionToDelete.nombre}</strong>?</p>
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
            {isProductsModalOpen && promotionForProducts && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl z-50 max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Productos de Canje para: <span className="text-clinical-blue">{promotionForProducts.nombre}</span></h3>
                        
                        <div className="flex-grow overflow-y-auto pr-2 mb-4 border-b dark:border-gray-700 pb-4">
                            {loadingExchangeProducts ? (
                                <div className="flex justify-center items-center h-24"><div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>
                            ) : exchangeProducts.length > 0 ? (
                                <ul className="space-y-3">
                                    {exchangeProducts.map(p => (
                                        <li key={p.id} className="flex justify-between items-center p-3 bg-soft-gray-100 dark:bg-gray-700/50 rounded-lg">
                                            <div className="flex-grow">
                                                <p className="font-semibold text-gray-800 dark:text-gray-100">{p.nombre}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">{p.puntos_requeridos} puntos</p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-sm text-gray-700 dark:text-gray-200">Stock: <span className="font-bold">{p.stock ?? 0}</span></span>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    p.estado === 'Disponible' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                                }`}>
                                                    {p.estado}
                                                </span>
                                                <button onClick={() => handleDeleteExchangeProduct(p.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-6">No hay productos de canje para esta promoción.</p>
                            )}
                        </div>

                        <form onSubmit={handleAddExchangeProduct} className="space-y-4">
                            <h4 className="font-semibold text-lg dark:text-gray-100">Añadir Nuevo Producto de Canje</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label htmlFor="nombre_canje" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Nombre del Producto</label>
                                    <input type="text" name="nombre" id="nombre_canje" value={newExchangeProduct.nombre || ''} onChange={handleNewExchangeProductChange} required className={`mt-1 block w-full ${inputStyleClass}`} />
                                </div>
                                <div>
                                    <label htmlFor="puntos_canje" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Puntos Requeridos</label>
                                    <input type="number" name="puntos_requeridos" id="puntos_canje" value={newExchangeProduct.puntos_requeridos || ''} onChange={handleNewExchangeProductChange} required className={`mt-1 block w-full ${inputStyleClass}`} />
                                </div>
                                <div>
                                    <label htmlFor="stock_canje" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Stock Inicial</label>
                                    <input type="number" name="stock" id="stock_canje" value={newExchangeProduct.stock || ''} onChange={handleNewExchangeProductChange} required className={`mt-1 block w-full ${inputStyleClass}`} />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2 space-x-2">
                                <button type="submit" className="px-4 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600">Añadir Producto</button>
                            </div>
                        </form>
                        
                        <div className="flex justify-end pt-4 mt-auto">
                            <button type="button" onClick={closeProductsModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {isRedeemModalOpen && promotionForRedeem && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl z-50 max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Canjear Puntos de Promoción: <span className="text-clinical-blue">{promotionForRedeem.nombre}</span></h3>
                        
                        {!selectedClient ? (
                             <div className="relative">
                                <input type="text" placeholder="Buscar cliente por nombre o DNI..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className={`w-full pl-4 pr-4 py-2 ${inputStyleClass}`}/>
                                {foundClients.length > 0 && (
                                    <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {foundClients.map(c => <li key={c.id} onClick={() => { setSelectedClient(c); setFoundClients([]); setClientSearch(''); }} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-gray-200">{c.nombres} - {c.dni}</li>)}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col min-h-0">
                                <div className="p-3 mb-4 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedClient.nombres}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">Puntos: <span className="font-bold text-clinical-blue">{selectedClient.puntos || 0}</span></p>
                                    </div>
                                    <button onClick={() => setSelectedClient(null)} className="text-sm text-red-600 hover:underline">Cambiar Cliente</button>
                                </div>

                                <div className="flex-grow overflow-y-auto pr-2">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Productos Disponibles para Canje</h4>
                                    {loadingRedeemProducts ? (
                                        <div className="flex justify-center items-center h-24"><div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>
                                    ) : redeemProducts.length > 0 ? (
                                        <ul className="space-y-2">
                                            {redeemProducts.map(p => {
                                                const canAfford = (selectedClient.puntos || 0) >= p.puntos_requeridos;
                                                const hasStock = (p.stock || 0) > 0;
                                                return (
                                                <li key={p.id} className={`flex justify-between items-center p-2 rounded-md ${canAfford && hasStock ? 'bg-soft-gray-100 dark:bg-gray-700' : 'bg-red-50 dark:bg-red-900/40 text-gray-500'}`}>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">{p.nombre}</p>
                                                        <p className="text-sm dark:text-gray-300">{p.puntos_requeridos} puntos { !hasStock && <span className="font-bold text-red-500">(Agotado)</span> }</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRedeemPoints(p)} 
                                                        disabled={!canAfford || redeemingProductId !== null || !hasStock}
                                                        className="px-3 py-1 text-sm bg-pharmacy-green text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center w-24"
                                                    >
                                                        {redeemingProductId === p.id ? (
                                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        ) : 'Canjear'}
                                                    </button>
                                                </li>
                                            )})}
                                        </ul>
                                    ) : (
                                        <p className="text-center text-gray-500 dark:text-gray-400 py-6">No hay productos de canje con stock para esta promoción.</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end pt-4 mt-auto">
                            <button type="button" onClick={closeRedeemModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromocionesPage;