import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { ComisionRegla, ComisionGenerada, Product, Sale } from '../types';
import DataTable from '../components/DataTable';
import SaleDetailModal from '../components/SaleDetailModal';
import { AwardIcon, DollarSignIcon, PackageIcon, CashRegisterIcon, PlusCircleIcon, EditIcon, TrashIcon } from '../components/icons';
import { useAuth } from '../components/Auth';


const ComisionesPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'mis_comisiones' | 'admin_reglas'>('mis_comisiones');
    
    // Suponiendo una lógica de roles simple. En una app real, esto vendría del estado del usuario.
    const isAdmin = true; 

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <AwardIcon className="h-8 w-8 text-gray-700 dark:text-gray-200" />
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Gestión de Comisiones</h2>
                    <p className="text-gray-600 dark:text-gray-400">Analiza tus comisiones generadas o administra las reglas de comisión para los productos.</p>
                </div>
            </div>
            {isAdmin && (
                <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                    <TabButton tabId="mis_comisiones" label="Mis Comisiones" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="admin_reglas" label="Administrar Reglas" activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            )}

            {activeTab === 'mis_comisiones' && <MisComisionesView />}
            {activeTab === 'admin_reglas' && isAdmin && <AdminReglasView />}
        </div>
    );
};

const TabButton: React.FC<{ tabId: string; label: string; activeTab: string; setActiveTab: (tabId: any) => void; }> = ({ tabId, label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tabId
                ? 'bg-clinical-blue text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
    >
        {label}
    </button>
);

// --- VISTA PARA VENDEDORES ---
const MisComisionesView: React.FC = () => {
    const { user: authUser } = useAuth();
    const [comisiones, setComisiones] = useState<(ComisionGenerada & { detalle_ventas: { subtotal: number } | null, productos: { nombre: string } | null, ventas: Sale | null })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState('este_mes');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        let start = new Date(now.getFullYear(), now.getMonth(), 1);
        let end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        if (period === 'ultimos_30') {
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            start.setHours(0, 0, 0, 0);
            end = new Date();
        } else if (period === 'mes_pasado') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        }
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }, [period]);

    const fetchComisiones = useCallback(async () => {
        if (!authUser || !authUser.email) {
            setError("No se ha podido identificar al usuario. Por favor, inicie sesión de nuevo.");
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data: userProfile, error: userError } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', authUser.email)
            .single();

        if (userError || !userProfile) {
            setError('No se pudo encontrar el perfil de usuario para cargar las comisiones.');
            setLoading(false);
            return;
        }

        const { data, error: comisionesError } = await supabase
            .from('comisiones_generadas')
            .select(`*, detalle_ventas(subtotal), productos(nombre), ventas(*)`)
            .eq('usuario_id', userProfile.id)
            .gte('fecha_generacion', startDate)
            .lte('fecha_generacion', endDate)
            .order('fecha_generacion', { ascending: false });

        if (comisionesError) {
            setError(`Error al cargar comisiones: ${comisionesError.message}`);
        } else {
            setComisiones((data as any) || []);
        }
        setLoading(false);
    }, [authUser, startDate, endDate]);

    useEffect(() => {
        fetchComisiones();
    }, [fetchComisiones]);

    const stats = useMemo(() => {
        const totalComision = comisiones.reduce((sum, c) => sum + c.monto_comision, 0);
        const ventasUnicas = new Set(comisiones.map(c => c.venta_id));
        return {
            totalComision,
            numVentas: ventasUnicas.size,
            numProductos: comisiones.length,
        };
    }, [comisiones]);

    const columns = [
        { header: 'Fecha', accessor: 'fecha_generacion' as keyof ComisionGenerada, render: (item: ComisionGenerada) => new Date(item.fecha_generacion).toLocaleString('es-PE') },
        { header: 'ID Venta', accessor: 'venta_id' as keyof ComisionGenerada, render: (item: any) => (
            <button onClick={() => setSelectedSale(item.ventas)} className="text-clinical-blue font-semibold hover:underline">
                {item.venta_id}
            </button>
        )},
        { header: 'Producto', accessor: 'productos' as keyof ComisionGenerada, render: (item: any) => item.productos?.nombre || 'Desconocido' },
        { header: 'Monto Venta (Item)', accessor: 'detalle_ventas' as keyof ComisionGenerada, render: (item: any) => `S/ ${item.detalle_ventas?.subtotal?.toFixed(2) || '0.00'}` },
        { header: 'Comisión Ganada', accessor: 'monto_comision' as keyof ComisionGenerada, render: (item: ComisionGenerada) => (
            <span className="font-bold text-pharmacy-green">S/ {item.monto_comision.toFixed(2)}</span>
        ) },
    ];
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<DollarSignIcon className="w-8 h-8"/>} title="Comisión Total (Periodo)" value={`S/ ${stats.totalComision.toFixed(2)}`} color="green" />
                <StatCard icon={<CashRegisterIcon className="w-8 h-8"/>} title="Ventas con Comisión" value={stats.numVentas} color="blue" />
                <StatCard icon={<PackageIcon className="w-8 h-8"/>} title="Productos Comisionables" value={stats.numProductos} color="yellow" />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Detalle de Comisiones Generadas</h3>
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm p-2">
                        <option value="este_mes">Este Mes</option>
                        <option value="ultimos_30">Últimos 30 días</option>
                        <option value="mes_pasado">Mes Pasado</option>
                    </select>
                </div>
                {loading ? <div className="text-center py-10">Cargando...</div> : error ? <div className="text-red-500">{error}</div> : <DataTable data={comisiones} columns={columns} title="" />}
            </div>
            <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
        </div>
    );
};

const StatCard: React.FC<{icon: React.ReactNode, title: string, value: string | number, color: 'green' | 'blue' | 'yellow'}> = ({icon, title, value, color}) => {
    const colors = {
        green: { bg: 'bg-green-100 text-green-600 dark:bg-green-900/50', accent: 'bg-green-500' },
        blue: { bg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50', accent: 'bg-blue-500' },
        yellow: { bg: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50', accent: 'bg-yellow-500' },
    };

    return (
        <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm overflow-hidden h-40">
            <div className={`absolute -right-16 -bottom-16 w-48 h-48 rounded-full opacity-10 ${colors[color].accent}`}></div>
            <div className="relative z-10 flex justify-between items-center h-full">
                <div className={`p-4 rounded-full ${colors[color].bg}`}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
            </div>
        </div>
    );
};


// --- VISTA PARA ADMINISTRADORES ---
const AdminReglasView: React.FC = () => {
    const [reglas, setReglas] = useState<ComisionRegla[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRegla, setCurrentRegla] = useState<Partial<ComisionRegla> | null>(null);

    const fetchReglas = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('comisiones_reglas')
            .select(`*, productos (nombre)`)
            .order('created_at', { ascending: false });
        if (error) setError(`Error al cargar reglas: ${error.message}`);
        else setReglas((data as any) || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchReglas();
    }, [fetchReglas]);

    const openModalForNew = () => {
        setCurrentRegla({
            producto_id: undefined, tipo_comision: 'porcentaje', valor_comision: 5, fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: null, activa: true
        });
        setIsModalOpen(true);
    };

    const columns = [
        { header: 'Producto', accessor: 'productos' as keyof ComisionRegla, render: (item: ComisionRegla) => item.productos?.nombre || 'Producto no encontrado' },
        { header: 'Tipo', accessor: 'tipo_comision' as keyof ComisionRegla, render: (item: ComisionRegla) => item.tipo_comision === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo' },
        { header: 'Valor', accessor: 'valor_comision' as keyof ComisionRegla, render: (item: ComisionRegla) => item.tipo_comision === 'porcentaje' ? `${item.valor_comision}%` : `S/ ${item.valor_comision.toFixed(2)}` },
        { header: 'Vigencia', accessor: 'fecha_inicio' as keyof ComisionRegla, render: (item: ComisionRegla) => `${item.fecha_inicio} al ${item.fecha_fin || 'Indefinido'}` },
        { header: 'Estado', accessor: 'activa' as keyof ComisionRegla, render: (item: ComisionRegla) => (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{item.activa ? 'Activa' : 'Inactiva'}</span>
        ) },
        { header: 'Acciones', accessor: 'id' as keyof ComisionRegla, render: (item: ComisionRegla) => (
            <div className="flex space-x-2"><button onClick={() => { setCurrentRegla(item); setIsModalOpen(true); }}><EditIcon className="w-5 h-5 text-blue-500" /></button></div>
        )},
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Reglas de Comisión</h3>
                <button onClick={openModalForNew} className="flex items-center gap-2 px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600">
                    <PlusCircleIcon className="w-5 h-5"/> Crear Regla
                </button>
            </div>
            {loading ? <div className="text-center py-10">Cargando...</div> : error ? <div className="text-red-500">{error}</div> : <DataTable data={reglas} columns={columns} title="" />}
            {isModalOpen && <ReglaModal regla={currentRegla} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchReglas(); }} />}
        </div>
    );
};

// --- MODAL PARA REGLAS ---
const ReglaModal: React.FC<{ regla: Partial<ComisionRegla> | null; onClose: () => void; onSave: () => void; }> = ({ regla, onClose, onSave }) => {
    const [currentRegla, setCurrentRegla] = useState(regla);
    const [productSearch, setProductSearch] = useState('');
    const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentRegla && currentRegla.producto_id) {
            const fetchProductName = async () => {
                const { data } = await supabase.from('productos').select('id, nombre').eq('id', currentRegla.producto_id!).single();
                if (data) setSelectedProduct(data);
            };
            fetchProductName();
        }
    }, [currentRegla]);

    useEffect(() => {
        if (productSearch.length < 2) { setProductSuggestions([]); return; }
        const search = async () => {
            const { data } = await supabase.from('productos').select('id, nombre').ilike('nombre', `%${productSearch}%`).limit(5);
            setProductSuggestions(data || []);
        };
        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [productSearch]);

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setCurrentRegla(prev => ({ ...prev, producto_id: product.id }));
        setProductSearch('');
        setProductSuggestions([]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setCurrentRegla(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentRegla || !currentRegla.producto_id) {
            alert("Selecciona un producto.");
            return;
        }
        setIsSaving(true);
        const { id, ...dataToSave } = currentRegla;
        const {error} = id 
            ? await supabase.from('comisiones_reglas').update(dataToSave).eq('id', id)
            : await supabase.from('comisiones_reglas').insert([dataToSave]);
        
        if (error) alert(`Error: ${error.message}`);
        else onSave();
        setIsSaving(false);
    };

    const inputStyle = "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">{currentRegla?.id ? 'Editar' : 'Crear'} Regla de Comisión</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium mb-1">Producto</label>
                        {selectedProduct ? (
                            <div className="flex items-center justify-between p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span className="font-semibold">{selectedProduct.nombre}</span>
                                <button type="button" onClick={() => { setSelectedProduct(null); setCurrentRegla(prev => ({...prev, producto_id: undefined})) }} className="text-red-500 text-sm">Cambiar</button>
                            </div>
                        ) : (
                            <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar producto..." className={inputStyle} />
                        )}
                         {productSuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                {productSuggestions.map(p => <li key={p.id} onClick={() => handleSelectProduct(p)} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">{p.nombre}</li>)}
                            </ul>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tipo de Comisión</label>
                            <select name="tipo_comision" value={currentRegla?.tipo_comision} onChange={handleInputChange} className={inputStyle}>
                                <option value="porcentaje">Porcentaje</option>
                                <option value="monto_fijo">Monto Fijo</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Valor</label>
                            <input type="number" step="0.01" name="valor_comision" value={currentRegla?.valor_comision} onChange={handleInputChange} required className={inputStyle} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium mb-1">Fecha de Inicio</label>
                            <input type="date" name="fecha_inicio" value={currentRegla?.fecha_inicio} onChange={handleInputChange} required className={inputStyle} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Fecha de Fin (opcional)</label>
                            <input type="date" name="fecha_fin" value={currentRegla?.fecha_fin || ''} onChange={handleInputChange} className={inputStyle} />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="activa" id="activa" checked={currentRegla?.activa} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-clinical-blue focus:ring-clinical-blue" />
                        <label htmlFor="activa" className="ml-2 block text-sm">Regla activa</label>
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600 disabled:bg-green-300">{isSaving ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default ComisionesPage;