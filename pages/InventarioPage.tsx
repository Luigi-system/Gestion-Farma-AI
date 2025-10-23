import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Product, Ingreso, Proveedor, SaleUnit, OrdenCompra, OrdenCompraDetalle, Sede, Empresa } from '../types';
import DataTable from '../components/DataTable';
import { PlusCircleIcon, SparklesIcon, ClipboardListIcon, EditIcon, TrashIcon, EyeIcon } from '../components/icons';
import { useAuth } from '../components/Auth';


// --- ICONS ---
const PrintIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
const SortAscIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h10"/><path d="M11 8h7"/><path d="M11 12h4"/></svg>;
const SortDescIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 4h10"/><path d="M11 8h7"/><path d="M11 12h4"/></svg>;
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const XIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;


// --- PLACEHOLDER VIEWS ---
const PlaceholderView: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm mt-6 text-center dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">{message}</p>
    </div>
);

// --- TYPE DEFINITIONS FOR INGRESOS ---
type StagedIngresoItem = {
    product: Product;
    cantidadCompra: number;
    unidadCompra: SaleUnit;
    costoTotalItem: number;
    lote: string;
    f_vencimiento: string;
    ganancia: number;
    // Calculated fields
    totalUnidades: number;
    costoUnitario: number;
    // Overridable product data
    unid_pv: number;
    blister_u?: number | null;
    blister_pv?: number | null;
    caja_u?: number | null;
    caja_pv?: number | null;
    paquete_u?: number | null;
    paquete_pv?: number | null;
};

// --- MAIN INVENTARIO PAGE COMPONENT ---
type SortConfig = { key: keyof Product; direction: 'ascending' | 'descending' } | null;
type FilterType = 'all' | 'lowStock' | 'expiring' | 'expired';
type ExpiringUnit = 'days' | 'months' | 'years';


const InventarioPage: React.FC = () => {
    const { sede, empresa } = useAuth();
    const [activeTab, setActiveTab] = useState('listado');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'nombre', direction: 'ascending' });
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [expiringDays, setExpiringDays] = useState<number>(30);
    const [expiringUnit, setExpiringUnit] = useState<ExpiringUnit>('days');

    const fetchData = useCallback(async () => {
        if (!sede || !empresa) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id);

        if (error) {
            setError(`Error al cargar productos: ${error.message}.`);
        } else {
            setProducts((data as Product[]) || []);
        }
        setLoading(false);
    }, [sede, empresa]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const requestSort = (key: keyof Product) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof Product) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        if (sortConfig.direction === 'ascending') return <SortAscIcon className="inline-block ml-1 h-3 w-3" />;
        return <SortDescIcon className="inline-block ml-1 h-3 w-3" />;
    };
    
    const processedProducts = useMemo(() => {
        let filtered = [...products];

        // 1. Search filter
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.laboratorio?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Tab-specific filter
        if (activeTab === 'reportes') {
             const today = new Date();
             today.setHours(0,0,0,0);

            switch(filterType) {
                case 'lowStock':
                    filtered = filtered.filter(p => (p.stock_unid ?? 0) <= (p.stock_min ?? 0));
                    break;
                case 'expired':
                    filtered = filtered.filter(p => p.f_vencimiento && new Date(p.f_vencimiento) < today);
                    break;
                case 'expiring':
                    const limitDate = new Date(today);
                    if (expiringUnit === 'days') {
                        limitDate.setDate(today.getDate() + expiringDays);
                    } else if (expiringUnit === 'months') {
                        limitDate.setMonth(today.getMonth() + expiringDays);
                    } else if (expiringUnit === 'years') {
                        limitDate.setFullYear(today.getFullYear() + expiringDays);
                    }
                    filtered = filtered.filter(p => p.f_vencimiento && new Date(p.f_vencimiento) >= today && new Date(p.f_vencimiento) <= limitDate);
                    break;
            }
        }
        
        // 3. Sorting
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [products, searchTerm, sortConfig, activeTab, filterType, expiringDays, expiringUnit]);

    const handlePrint = () => {
        const reportTitle = activeTab === 'reportes' ? `Reporte: ${filterType}` : 'Listado General';
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html><head><title>Reporte de Inventario</title>
                <style>
                    @media print {
                        body { font-family: 'Courier New', monospace; font-size: 10px; width: 58mm; margin: 0; padding: 5mm; }
                        @page { size: 58mm auto; margin: 5mm; }
                        h1, h2, p { margin: 0; text-align: center; }
                        h1 { font-size: 14px; }
                        h2 { font-size: 11px; font-weight: normal; margin-top: 5px; }
                        p { font-size: 9px; margin-top: 2px; }
                        hr { border: none; border-top: 1px dashed black; margin: 5px 0; }
                        .item { padding: 3px 0; border-bottom: 1px dashed #ccc; }
                        .item:last-child { border-bottom: none; }
                        .item-header { display: flex; justify-content: space-between; font-weight: bold; }
                        .item-header span:first-child { width: 75%; }
                        .item-header span:last-child { width: 25%; text-align: right; }
                        .item-details { font-size: 9px; color: #333; }
                    }
                </style>
                </head><body>
                    <h1>GestionFarma</h1>
                    <h2>${reportTitle}</h2>
                    <p>Fecha: ${new Date().toLocaleString('es-PE')}</p>
                    <hr />
                    ${processedProducts.length === 0 ? '<p>No hay datos para mostrar.</p>' : processedProducts.map(p => `
                        <div class="item">
                           <div class="item-header">
                               <span>${p.nombre.substring(0, 30)}</span>
                               <span>S: ${p.stock_unid ?? 0}</span>
                           </div>
                           <div class="item-details">
                               <span>SKU: ${p.codigo || 'N/A'}</span> | <span>Vence: ${p.f_vencimiento || 'N/A'}</span>
                           </div>
                        </div>
                    `).join('')}
                    <hr />
                    <p style="text-align: center;">-- Fin del Reporte --</p>
                </body></html>`);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };
    
    const stockIndicator = (item: Product) => {
        const stock = item.stock_unid || 0;
        const minStock = item.stock_min || 10;
        if (stock <= 0) return <span className="px-2 py-1 text-xs font-semibold text-white bg-black rounded-full dark:bg-gray-600">Agotado</span>
        if (stock <= minStock) return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full dark:bg-red-900/50 dark:text-red-300">{stock}</span>
        if (stock <= minStock * 2) return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full dark:bg-yellow-900/50 dark:text-yellow-300">{stock}</span>
        return <span className="text-gray-700 dark:text-gray-300">{stock}</span>
    }

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-64"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>;
        }
        if (error) {
            return <div className="text-red-500 bg-red-100 p-4 rounded-lg mt-6 dark:bg-red-900/40 dark:text-red-300">{error}</div>;
        }

        const TableHeader = () => (
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                    {columns.map(col => (
                        <th key={col.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider dark:text-gray-300">
                            <button onClick={() => requestSort(col.key)} className="flex items-center">
                                {col.header} {getSortIcon(col.key)}
                            </button>
                        </th>
                    ))}
                </tr>
            </thead>
        );

        const TableBody = () => (
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {processedProducts.length > 0 ? processedProducts.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        {columns.map(col => (
                            <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-gray-100">
                                {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                            </td>
                        ))}
                    </tr>
                )) : (
                    <tr><td colSpan={columns.length} className="text-center py-10 text-gray-500 dark:text-gray-400">No se encontraron productos.</td></tr>
                )}
            </tbody>
        );
        
        switch (activeTab) {
            case 'ingresos': return <IngresosView onDataChange={fetchData} sede={sede} empresa={empresa}/>;
            case 'ordenes': return <OrdenesCompraView onDataChange={fetchData} sede={sede} empresa={empresa}/>;
            case 'cruce': return <PlaceholderView title="Cruce de Inventario" message="Esta herramienta para realizar auditorías y comparar stock físico vs. sistema está en construcción." />;
            case 'reportes':
            case 'listado':
            default:
                return (
                    <div className="bg-white p-6 rounded-lg shadow-sm mt-6 dark:bg-gray-800">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                            <div className="relative w-full md:w-1/3">
                                <input type="text" placeholder="Buscar por nombre, código o laboratorio..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-clinical-blue focus:border-clinical-blue dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            </div>
                            {activeTab === 'reportes' && (
                                <div className="flex-grow flex flex-wrap items-center justify-center gap-2">
                                    <button onClick={() => setFilterType('lowStock')} className={`px-3 py-1 text-sm rounded-full ${filterType === 'lowStock' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200'}`}>Stock Bajo</button>
                                    <button onClick={() => setFilterType('expired')} className={`px-3 py-1 text-sm rounded-full ${filterType === 'expired' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100'}`}>Vencidos</button>
                                    <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/50 rounded-full pl-1">
                                       <button onClick={() => setFilterType('expiring')} className={`px-3 py-1 text-sm rounded-full ${filterType === 'expiring' ? 'bg-yellow-500 text-white' : 'text-yellow-700 dark:text-yellow-200'}`}>Por Vencer en</button>
                                       <input
                                            type="number"
                                            min="1"
                                            value={expiringDays}
                                            onChange={e => setExpiringDays(e.target.value ? parseInt(e.target.value, 10) : 0)}
                                            disabled={filterType !== 'expiring'}
                                            className="w-14 p-0 text-center bg-transparent text-yellow-800 dark:text-yellow-200 text-sm font-semibold border-0 focus:ring-0 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <select
                                            value={expiringUnit}
                                            onChange={(e) => setExpiringUnit(e.target.value as ExpiringUnit)}
                                            disabled={filterType !== 'expiring'}
                                            className="bg-transparent text-yellow-800 dark:text-yellow-200 text-sm font-semibold border-0 focus:ring-0 pr-3"
                                        >
                                            <option value="days">días</option>
                                            <option value="months">meses</option>
                                            <option value="years">años</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600 transition-colors">
                                <PrintIcon className="w-5 h-5" /> Imprimir / Descargar
                            </button>
                        </div>
                        <div className="overflow-auto max-h-[60vh] border dark:border-gray-700 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><TableHeader /><TableBody /></table>
                        </div>
                    </div>
                );
        }
    };

    const columns = [
        { header: 'Código', key: 'codigo' as keyof Product, render: (item: Product) => item.codigo || '-' },
        { header: 'Nombre', key: 'nombre' as keyof Product },
        { header: 'Stock (Unid)', key: 'stock_unid' as keyof Product, render: (item: Product) => stockIndicator(item) },
        { header: 'PV (Unid)', key: 'unid_pv' as keyof Product, render: (item: Product) => item.unid_pv ? `S/ ${item.unid_pv.toFixed(2)}` : '-' },
        { header: 'Vencimiento', key: 'f_vencimiento' as keyof Product },
        { header: 'Lote', key: 'lote' as keyof Product, render: (item: Product) => item.lote || '-' },
        { header: 'Laboratorio', key: 'laboratorio' as keyof Product, render: (item: Product) => item.laboratorio || '-' },
    ];
    
    const TabButton: React.FC<{tabId: string, label: string}> = ({tabId, label}) => (
        <button 
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabId ? 'bg-clinical-blue text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Inventario</h2>
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <TabButton tabId="listado" label="Listado General" />
                <TabButton tabId="reportes" label="Reportes de Stock" />
                <TabButton tabId="ingresos" label="Ingresos de Mercadería" />
                <TabButton tabId="ordenes" label="Órdenes de Compra" />
                <TabButton tabId="cruce" label="Cruce de Inventario" />
            </div>
            {renderContent()}
        </div>
    );
};

interface TenantProps {
    sede: Sede | null;
    empresa: Empresa | null;
}

const IngresosView: React.FC<{onDataChange: () => void} & TenantProps> = ({onDataChange, sede, empresa}) => {
    const [ingresos, setIngresos] = useState<Ingreso[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchIngresos = useCallback(async () => {
        if (!sede || !empresa) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('ingresos')
            .select('*')
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .order('f_ingreso', { ascending: false })
            .limit(100);

        if (error) setError(`Error al cargar ingresos: ${error.message}`);
        else setIngresos(data || []);
        setLoading(false);
    }, [sede, empresa]);

    useEffect(() => {
        fetchIngresos();
    }, [fetchIngresos]);

    const handleSaveSuccess = () => {
        fetchIngresos(); // Refresh this component's data
        onDataChange(); // Refresh parent component's data (products list)
    };

    const columns = [
        { header: 'Fecha Ingreso', accessor: 'f_ingreso' as keyof Ingreso, render: (item: Ingreso) => new Date(item.f_ingreso!).toLocaleDateString('es-PE') },
        { header: 'N° Factura', accessor: 'numero_factura' as keyof Ingreso },
        { header: 'Proveedor', accessor: 'proveedor' as keyof Ingreso },
        { header: 'Producto', accessor: 'producto' as keyof Ingreso },
        { header: 'Unidades Ingresadas', accessor: 'cantidad' as keyof Ingreso },
        { header: 'Costo Unitario', accessor: 'precio_compra' as keyof Ingreso, render: (item: Ingreso) => `S/ ${item.precio_compra.toFixed(2)}` },
        { header: 'Usuario', accessor: 'usuario' as keyof Ingreso },
    ];

    if (loading) return <div className="mt-6 flex justify-center items-center h-64"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>;
    if (error) return <div className="mt-6 text-red-500 bg-red-100 p-4 rounded-lg dark:bg-red-900/40 dark:text-red-300">{error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Historial de Ingresos</h3>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600">
                    <PlusCircleIcon className="w-5 h-5"/>
                    Registrar Nuevo Ingreso
                </button>
            </div>
            <DataTable<Ingreso> title="" columns={columns} data={ingresos} />
            {isModalOpen && <IngresoModal onClose={() => setIsModalOpen(false)} onSaveSuccess={handleSaveSuccess} sede={sede} empresa={empresa} />}
        </div>
    );
};

const OrdenesCompraView: React.FC<{onDataChange: () => void} & TenantProps> = ({ onDataChange, sede, empresa }) => {
    const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);

    const fetchOrdenes = useCallback(async () => {
        if (!sede || !empresa) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('orden_compra')
            .select('*')
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .order('fecha_pedido', { ascending: false });
        if (error) setError(`Error al cargar órdenes: ${error.message}`);
        else setOrdenes(data || []);
        setLoading(false);
    }, [sede, empresa]);

    useEffect(() => {
        fetchOrdenes();
    }, [fetchOrdenes]);

    const handleSaveSuccess = () => {
        fetchOrdenes();
        onDataChange();
    };

    const columns = [
        { header: 'ID', accessor: 'id' as keyof OrdenCompra },
        { header: 'Proveedor', accessor: 'proveedor' as keyof OrdenCompra },
        { header: 'Fecha Pedido', accessor: 'fecha_pedido' as keyof OrdenCompra, render: (item: OrdenCompra) => item.fecha_pedido ? new Date(item.fecha_pedido).toLocaleDateString('es-PE') : '-' },
        { header: 'Estado', accessor: 'estado' as keyof OrdenCompra },
        { header: 'Usuario', accessor: 'usuario' as keyof OrdenCompra },
        {
            header: 'Acciones',
            accessor: 'id' as keyof OrdenCompra,
            render: (item: OrdenCompra) => (
                <div className="flex items-center space-x-2">
                    <button className="p-1 text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5" /></button>
                    <button className="p-1 text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                </div>
            )
        }
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Órdenes de Compra</h3>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsAssistantModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        <SparklesIcon className="w-5 h-5"/>
                        Asistente de Pedidos Inteligente
                    </button>
                    {/* Placeholder for manual creation */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600">
                        <ClipboardListIcon className="w-5 h-5"/>
                        Crear Orden de Compra
                    </button>
                </div>
            </div>
            {loading ? (
                 <div className="flex justify-center items-center h-64"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>
            ) : error ? (
                <div className="text-red-500 bg-red-100 p-4 rounded-lg dark:bg-red-900/40 dark:text-red-300">{error}</div>
            ) : (
                <DataTable<OrdenCompra> title="" columns={columns} data={ordenes} />
            )}
            {isAssistantModalOpen && <AsistentePedidosModal onClose={() => setIsAssistantModalOpen(false)} onSaveSuccess={handleSaveSuccess} sede={sede} empresa={empresa} />}
        </div>
    );
};


const initialItemFormState = {
    cantidadCompra: 1,
    unidadCompra: 'Unidad' as SaleUnit,
    costoTotalItem: 0,
    lote: '',
    f_vencimiento: '',
    ganancia: 30,
    unid_pv: 0,
    blister_u: undefined,
    blister_pv: undefined,
    caja_u: undefined,
    caja_pv: undefined,
    paquete_u: undefined,
    paquete_pv: undefined,
};

type ItemFormData = typeof initialItemFormState;

const IngresoModal: React.FC<{ onClose: () => void; onSaveSuccess: () => void; } & TenantProps> = ({ onClose, onSaveSuccess, sede, empresa }) => {
    const { user } = useAuth();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [proveedorId, setProveedorId] = useState<number | null>(null);
    const [numeroFactura, setNumeroFactura] = useState('');
    const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);
    
    const [productSearch, setProductSearch] = useState('');
    const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    
    const [stagedItems, setStagedItems] = useState<StagedIngresoItem[]>([]);
    
    const [itemForm, setItemForm] = useState<ItemFormData>(initialItemFormState);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [precioVentaAnterior, setPrecioVentaAnterior] = useState<number | null>(null);

    useEffect(() => {
        if (!sede || !empresa) return;
        const fetchProveedores = async () => {
            const { data } = await supabase
                .from('proveedores')
                .select('*')
                .eq('sede_id', sede.id)
                .eq('empresa_id', empresa.id);
            setProveedores(data || []);
        };
        fetchProveedores();
    }, [sede, empresa]);

    useEffect(() => {
        if (productSearch.length < 2 || !sede || !empresa) {
            setProductSuggestions([]);
            return;
        }
        const search = async () => {
            const { data } = await supabase
                .from('productos')
                .select('*')
                .eq('sede_id', sede.id)
                .eq('empresa_id', empresa.id)
                .ilike('nombre', `%${productSearch}%`)
                .limit(5);
            setProductSuggestions(data || []);
        };
        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [productSearch, sede, empresa]);
    
    useEffect(() => {
        if (selectedProduct) {
            setPrecioVentaAnterior(selectedProduct.unid_pv || null);
            setItemForm(prev => ({
                ...prev,
                unid_pv: selectedProduct.unid_pv || 0,
                blister_u: selectedProduct.blister_u || undefined,
                blister_pv: selectedProduct.blister_pv || undefined,
                caja_u: selectedProduct.caja_u || undefined,
                caja_pv: selectedProduct.caja_pv || undefined,
                paquete_u: selectedProduct.paquete_u || undefined,
                paquete_pv: selectedProduct.paquete_pv || undefined,
            }));
        }
    }, [selectedProduct]);

    const calculations = useMemo(() => {
        if (!selectedProduct) return { totalUnidades: 0, costoUnitario: 0, sug_unid_pv: 0, sug_blister_pv: 0, sug_caja_pv: 0, sug_paquete_pv: 0 };

        let unidadesPorCompra = 1;
        if (itemForm.unidadCompra === 'Blister') unidadesPorCompra = itemForm.blister_u || selectedProduct.blister_u || 1;
        if (itemForm.unidadCompra === 'Caja') unidadesPorCompra = itemForm.caja_u || selectedProduct.caja_u || 1;
        if (itemForm.unidadCompra === 'Paquete') unidadesPorCompra = itemForm.paquete_u || selectedProduct.paquete_u || 1;

        const totalUnidades = itemForm.cantidadCompra * unidadesPorCompra;
        const costoUnitario = totalUnidades > 0 ? itemForm.costoTotalItem / totalUnidades : 0;
        
        const gananciaFactor = 1 + (itemForm.ganancia / 100);
        
        const sug_unid_pv = costoUnitario * gananciaFactor;

        const blisterUnits = itemForm.blister_u ?? selectedProduct.blister_u;
        const cajaUnits = itemForm.caja_u ?? selectedProduct.caja_u;
        const paqueteUnits = itemForm.paquete_u ?? selectedProduct.paquete_u;

        const sug_blister_pv = blisterUnits ? sug_unid_pv * blisterUnits : 0;
        const sug_caja_pv = cajaUnits ? sug_unid_pv * cajaUnits : 0;
        const sug_paquete_pv = paqueteUnits ? sug_unid_pv * paqueteUnits : 0;
        
        return { totalUnidades, costoUnitario, sug_unid_pv, sug_blister_pv, sug_caja_pv, sug_paquete_pv };
    }, [selectedProduct, itemForm]);

    useEffect(() => {
        if (selectedProduct) {
            setItemForm(prev => ({
                ...prev,
                unid_pv: calculations.sug_unid_pv,
                blister_pv: calculations.sug_blister_pv,
                caja_pv: calculations.sug_caja_pv,
                paquete_pv: calculations.sug_paquete_pv,
            }));
        }
    }, [calculations.sug_unid_pv, calculations.sug_blister_pv, calculations.sug_caja_pv, calculations.sug_paquete_pv, selectedProduct]); 

    const handleItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' && value !== '' ? parseFloat(value) : value;

        setItemForm(prev => ({
            ...prev,
            [name]: parsedValue === '' ? undefined : parsedValue
        }));
    };

    const handleLoteBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const loteValue = e.target.value;
        if (loteValue && selectedProduct && sede && empresa) {
            const { data } = await supabase
                .from('ingresos')
                .select('f_vencimiento')
                .eq('producto', selectedProduct.nombre)
                .eq('lote', loteValue)
                .eq('sede_id', sede.id)
                .eq('empresa_id', empresa.id)
                .not('f_vencimiento', 'is', null)
                .order('f_ingreso', { ascending: false })
                .limit(1)
                .single();
    
            if (data && data.f_vencimiento) {
                setItemForm(prev => ({...prev, f_vencimiento: data.f_vencimiento as string }));
            }
        }
    };
    
    const handleAddToStage = () => {
        setError(null);
        if (!selectedProduct || !itemForm.lote || !itemForm.f_vencimiento) {
            setError("Completa todos los campos del producto (Lote, Vencimiento).");
            return;
        }
        if (calculations.totalUnidades <= 0) {
            setError("La cantidad y costo deben ser mayores a cero.");
            return;
        }

        setStagedItems(prev => [...prev, {
            product: selectedProduct,
            cantidadCompra: itemForm.cantidadCompra,
            unidadCompra: itemForm.unidadCompra,
            costoTotalItem: itemForm.costoTotalItem,
            lote: itemForm.lote,
            f_vencimiento: itemForm.f_vencimiento,
            ganancia: itemForm.ganancia,
            totalUnidades: calculations.totalUnidades,
            costoUnitario: calculations.costoUnitario,
            unid_pv: itemForm.unid_pv,
            blister_u: itemForm.blister_u,
            blister_pv: itemForm.blister_pv,
            caja_u: itemForm.caja_u,
            caja_pv: itemForm.caja_pv,
            paquete_u: itemForm.paquete_u,
            paquete_pv: itemForm.paquete_pv,
        }]);

        setSelectedProduct(null);
        setProductSearch('');
        setItemForm(initialItemFormState);
        setPrecioVentaAnterior(null);
    };
    
    const handleRemoveFromStage = (index: number) => {
        setStagedItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveIngreso = async () => {
        setError(null);
        if (stagedItems.length === 0 || !proveedorId || !numeroFactura || !sede || !empresa) {
            setError("Completa los datos de la factura y añade al menos un producto.");
            return;
        }
        setIsSaving(true);
        
        try {
            const productUpdates = stagedItems.map(item => {
                const newStock = (item.product.stock_unid || 0) + item.totalUnidades;
                return supabase.from('productos').update({
                    stock_unid: newStock,
                    costo_x_unid: item.costoUnitario,
                    lote: item.lote,
                    f_vencimiento: item.f_vencimiento,
                    unid_pv: item.unid_pv,
                    blister_u: item.blister_u,
                    blister_pv: item.blister_pv,
                    caja_u: item.caja_u,
                    caja_pv: item.caja_pv,
                    paquete_u: item.paquete_u,
                    paquete_pv: item.paquete_pv
                }).eq('id', item.product.id);
            });
            
            const selectedProveedor = proveedores.find(p => p.id === proveedorId);
            const ingresoRecords = stagedItems.map(item => ({
                usuario: user?.email || 'desconocido',
                numero_factura: numeroFactura,
                proveedor: selectedProveedor?.nombre || 'Desconocido',
                producto: item.product.nombre,
                cantidad: item.totalUnidades,
                precio_compra: item.costoUnitario,
                unidades: item.totalUnidades,
                porcentaje_venta: item.ganancia,
                f_ingreso: fechaIngreso,
                f_vencimiento: item.f_vencimiento,
                sede_id: sede.id,
                empresa_id: empresa.id,
            }));
            const ingresoInsert = supabase.from('ingresos').insert(ingresoRecords);

            const allPromises = [...productUpdates, ingresoInsert];
            const results = await Promise.all(allPromises);

            results.forEach(res => { if (res.error) throw res.error; });

            onSaveSuccess();
            onClose();

        } catch (err: any) {
            setError(`Error al guardar: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const getPurchaseUnitOptions = (product: Product | null): SaleUnit[] => {
        if (!product) return [];
        const options: SaleUnit[] = ['Unidad'];
        if (product.blister_u || itemForm.blister_u) options.push('Blister');
        if (product.caja_u || itemForm.caja_u) options.push('Caja');
        if (product.paquete_u || itemForm.paquete_u) options.push('Paquete');
        return options;
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-7xl flex flex-col">
                 <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Registrar Ingreso de Mercadería</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-2xl leading-none hover:bg-gray-200 dark:hover:bg-gray-600">&times;</button>
                 </div>
                 
                 <div className="flex-grow p-6 space-y-4 overflow-y-auto">
                    {/* Invoice Header */}
                    <fieldset className="p-4 border rounded-md dark:border-gray-600">
                        <legend className="text-md font-semibold text-gray-900 dark:text-gray-200 px-2">Datos de la Factura</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
                                <select value={proveedorId || ''} onChange={e => setProveedorId(Number(e.target.value))} className="mt-1 block w-full input-style">
                                    <option value="" disabled>Seleccionar proveedor</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Factura</label>
                                <input type="text" value={numeroFactura} onChange={e => setNumeroFactura(e.target.value)} className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Ingreso</label>
                                <input type="date" value={fechaIngreso} onChange={e => setFechaIngreso(e.target.value)} className="mt-1 block w-full input-style" />
                            </div>
                        </div>
                    </fieldset>
                    
                    {/* Add Product Form */}
                    <fieldset className="p-4 border rounded-md dark:border-gray-600">
                         <legend className="text-md font-semibold text-gray-900 dark:text-gray-200 px-2">Añadir Producto a la Factura</legend>
                         <div className="relative mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buscar Producto</label>
                            <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} disabled={!!selectedProduct} placeholder="Escriba para buscar..." className="mt-1 block w-full input-style" />
                            {selectedProduct && <button type="button" onClick={()=>{setSelectedProduct(null); setProductSearch(''); setItemForm(initialItemFormState); setPrecioVentaAnterior(null)}} className="absolute right-2 top-[29px] text-sm text-red-500 hover:underline">Limpiar</button>}
                            {productSuggestions.length > 0 && !selectedProduct && (
                                <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                    {productSuggestions.map(p => <li key={p.id} onClick={() => { setSelectedProduct(p); setProductSearch(p.nombre); setProductSuggestions([]); }} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-black dark:text-white">{p.nombre}</li>)}
                                </ul>
                            )}
                        </div>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                             <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad Compra</label><input type="number" name="cantidadCompra" value={itemForm.cantidadCompra} onChange={handleItemFormChange} min="1" disabled={!selectedProduct} className="mt-1 block w-full input-style" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empaque</label><select name="unidadCompra" value={itemForm.unidadCompra} onChange={handleItemFormChange} disabled={!selectedProduct} className="mt-1 block w-full input-style">{getPurchaseUnitOptions(selectedProduct).map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Costo Total (S/)</label><input type="number" name="costoTotalItem" step="0.01" value={itemForm.costoTotalItem} onChange={handleItemFormChange} disabled={!selectedProduct} className="mt-1 block w-full input-style" /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lote</label><input type="text" name="lote" value={itemForm.lote} onChange={handleItemFormChange} onBlur={handleLoteBlur} disabled={!selectedProduct} className="mt-1 block w-full input-style" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vencimiento</label><input type="date" name="f_vencimiento" value={itemForm.f_vencimiento} onChange={handleItemFormChange} disabled={!selectedProduct} className="mt-1 block w-full input-style" placeholder="dd/mm/aaaa" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ganancia (%)</label><input type="number" name="ganancia" value={itemForm.ganancia} onChange={handleItemFormChange} disabled={!selectedProduct} className="mt-1 block w-full input-style" /></div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Precios de Venta y Empaque</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PV Unid. (Sugerido)</label>
                                        <input type="number" name="unid_pv" step="0.01" value={itemForm.unid_pv?.toFixed(2) || ''} onChange={handleItemFormChange} disabled={!selectedProduct} className="mt-1 block w-full input-style" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 col-span-2">
                                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unid./Blister</label><input type="number" name="blister_u" value={itemForm.blister_u || ''} onChange={handleItemFormChange} disabled={!selectedProduct} className="mt-1 block w-full input-style" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PV Blister</label><input type="number" name="blister_pv" step="0.01" value={itemForm.blister_pv?.toFixed(2) || ''} onChange={handleItemFormChange} disabled={!selectedProduct} className="mt-1 block w-full input-style" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 col-span-2">
                                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unid./Caja</label><input type="number" name="caja_u" value={itemForm.caja_u || ''} onChange={handleItemFormChange} disabled={!selectedProduct} className="mt-1 block w-full input-style" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PV Caja</label><input type="number" name="caja_pv" step="0.01" value={itemForm.caja_pv?.toFixed(2) || ''} onChange={handleItemFormChange} disabled={!selectedProduct} className="mt-1 block w-full input-style" /></div>
                                    </div>
                                     <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio de Venta Anterior (Unid.)</label>
                                        <div className="mt-1 p-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-gray-700 dark:text-gray-300 font-semibold">
                                            {precioVentaAnterior !== null ? `S/ ${precioVentaAnterior.toFixed(2)}` : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                         {selectedProduct && <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/40 rounded-md grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                            <div><p className="text-xs text-gray-500 dark:text-gray-400">Unidades a Ingresar</p><p className="font-bold text-lg text-gray-800 dark:text-gray-100">{calculations.totalUnidades}</p></div>
                            <div><p className="text-xs text-gray-500 dark:text-gray-400">Costo / Unid.</p><p className="font-bold text-lg text-gray-800 dark:text-gray-100">S/ {calculations.costoUnitario.toFixed(3)}</p></div>
                            <div><p className="text-xs text-gray-500 dark:text-gray-400">PV Unid. Sugerido</p><p className="font-bold text-lg text-green-600 dark:text-green-400">S/ {calculations.sug_unid_pv.toFixed(2)}</p></div>
                            <div><p className="text-xs text-gray-500 dark:text-gray-400">PV Blister Sug.</p><p className="font-bold text-lg text-green-600 dark:text-green-400">{calculations.sug_blister_pv ? `S/ ${calculations.sug_blister_pv.toFixed(2)}` : '-'}</p></div>
                            <div><p className="text-xs text-gray-500 dark:text-gray-400">PV Caja Sug.</p><p className="font-bold text-lg text-green-600 dark:text-green-400">{calculations.sug_caja_pv ? `S/ ${calculations.sug_caja_pv.toFixed(2)}` : '-'}</p></div>
                         </div>}
                         <div className="text-right mt-4">
                            <button type="button" onClick={handleAddToStage} disabled={!selectedProduct} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors">Añadir a la lista</button>
                         </div>
                    </fieldset>

                    {/* Staged Items Table */}
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Productos en esta Factura</h4>
                        <div className="overflow-auto max-h-56 border rounded-lg dark:border-gray-600">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10"><tr className="text-left text-xs text-gray-600 dark:text-gray-300 uppercase">
                                    <th className="p-2">Producto</th><th className="p-2">Lote</th><th className="p-2">Vence</th><th className="p-2">Unid. a Ingresar</th><th className="p-2">Costo/Unid.</th><th className="p-2">PV/Unid. Sug.</th><th className="p-2"></th>
                                </tr></thead>
                                <tbody className="divide-y dark:divide-gray-600">
                                    {stagedItems.length > 0 ? stagedItems.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 text-black dark:text-white">
                                            <td className="p-2 font-medium">{item.product.nombre}</td>
                                            <td className="p-2">{item.lote}</td>
                                            <td className="p-2">{item.f_vencimiento}</td>
                                            <td className="p-2 font-semibold">{item.totalUnidades}</td>
                                            <td className="p-2">S/ {item.costoUnitario.toFixed(3)}</td>
                                            <td className="p-2 font-semibold text-green-600 dark:text-green-400">S/ {item.unid_pv.toFixed(2)}</td>
                                            <td className="p-2 text-center"><button type="button" onClick={() => handleRemoveFromStage(index)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4" /></button></td>
                                        </tr>
                                    )) : <tr><td colSpan={7} className="text-center p-8 text-gray-500 dark:text-gray-400">Añade productos desde el formulario de arriba.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {error && <div className="text-red-500 bg-red-100 p-3 rounded-md dark:bg-red-900/40 dark:text-red-300 text-sm">{error}</div>}
                 </div>

                 <div className="p-4 border-t dark:border-gray-700 flex justify-end items-center gap-4 bg-soft-gray-100 dark:bg-gray-800/50">
                     <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 font-semibold">
                         Cancelar
                     </button>
                     <button onClick={handleSaveIngreso} disabled={isSaving || stagedItems.length === 0} className="px-6 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 flex items-center font-bold text-base">
                         {isSaving && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                         {isSaving ? 'Guardando...' : 'Guardar Ingreso'}
                     </button>
                 </div>
           </div>
           <style>{`
             .input-style {
                @apply bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-black dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500;
             }
             @keyframes fade-in { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
             .animate-fade-in { animation: fade-in 0.2s ease-out; }
           `}</style>
        </div>
    );
};

// --- MODALS FOR ORDEN DE COMPRA ---
const AsistentePedidosModal: React.FC<{ onClose: () => void; onSaveSuccess: () => void; } & TenantProps> = ({ onClose, onSaveSuccess, sede, empresa }) => {
    const { user } = useAuth();
    type GroupedLowStockProducts = { [laboratorio: string]: Product[] };
    const [groupedProducts, setGroupedProducts] = useState<GroupedLowStockProducts>({});
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProducts, setSelectedProducts] = useState<{ [productId: number]: boolean }>({});
    const [productQuantities, setProductQuantities] = useState<{ [productId: number]: number | '' }>({});
    const [supplierSelections, setSupplierSelections] = useState<{ [laboratorio: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);
    const [suggestionType, setSuggestionType] = useState<'critical' | 'proactive' | 'none'>('none');

    useEffect(() => {
        const loadData = async () => {
            if (!sede || !empresa) {
                setLoading(false);
                return;
            }
            setLoading(true);
            const [productsRes, suppliersRes] = await Promise.all([
                supabase.from('productos').select('*').eq('sede_id', sede.id).eq('empresa_id', empresa.id),
                supabase.from('proveedores').select('*').eq('sede_id', sede.id).eq('empresa_id', empresa.id)
            ]);
            
            if (productsRes.data) {
                let suggestedProducts = productsRes.data.filter(p => (p.stock_unid ?? 0) <= (p.stock_min ?? 0) && (p.stock_min ?? 0) > 0);

                if (suggestedProducts.length > 0) {
                    setSuggestionType('critical');
                } else {
                    suggestedProducts = productsRes.data.filter(p => (p.stock_unid ?? 0) > (p.stock_min ?? 0) && (p.stock_unid ?? 0) < 50);
                    if (suggestedProducts.length > 0) setSuggestionType('proactive');
                    else setSuggestionType('none');
                }
                
                const grouped = suggestedProducts.reduce((acc, p) => {
                    const lab = p.laboratorio || 'Sin Laboratorio';
                    if (!acc[lab]) acc[lab] = [];
                    acc[lab].push(p);
                    return acc;
                }, {} as GroupedLowStockProducts);
                setGroupedProducts(grouped);

                const initialSelection = suggestedProducts.reduce((acc, p) => ({...acc, [p.id]: true }), {});
                setSelectedProducts(initialSelection);
                
                let initialQuantities: {[key: number]: number} = {};
                suggestedProducts.forEach(p => {
                    let suggestedQty = 0;
                    if (suggestionType === 'critical') {
                        const needed = (p.stock_min || 20) - (p.stock_unid || 0);
                        suggestedQty = needed > 0 ? needed : (p.stock_min || 20);
                    } else { // proactive or none, but logic for proactive applies
                        const needed = 50 - (p.stock_unid || 0);
                        suggestedQty = needed > 0 ? needed : 20;
                    }
                    initialQuantities[p.id] = suggestedQty;
                });
                setProductQuantities(initialQuantities);

            }
            if(suppliersRes.data) setProveedores(suppliersRes.data);
            setLoading(false);
        };
        loadData();
    }, [sede, empresa, suggestionType]);

    const handleToggleProduct = (productId: number) => {
        setSelectedProducts(prev => ({ ...prev, [productId]: !prev[productId] }));
    };

    const handleQuantityChange = (productId: number, value: string) => {
        const quantity = value === '' ? '' : parseInt(value, 10);
        if (quantity === '' || (!isNaN(quantity) && quantity >= 0)) {
            setProductQuantities(prev => ({...prev, [productId]: quantity}));
        }
    };

    const handleSupplierChange = (lab: string, supplierId: string) => {
        setSupplierSelections(prev => ({ ...prev, [lab]: supplierId }));
    };

    const handleGenerateOrders = async () => {
        if (!sede || !empresa) return;
        setIsSaving(true);
        const ordersToCreate = Object.entries(supplierSelections)
            .filter(([, supplierId]) => supplierId && supplierId !== '')
            .map(([lab, supplierId]) => ({ lab, supplierId }));

        if (ordersToCreate.length === 0) {
            alert('Por favor, selecciona un proveedor para al menos un laboratorio.');
            setIsSaving(false);
            return;
        }

        try {
            for (const { lab, supplierId } of ordersToCreate) {
                const supplier = proveedores.find(p => p.id === parseInt(String(supplierId)));
                if (!supplier) continue;
    
                const productsForThisOrder = (groupedProducts[lab] || []).filter(p => selectedProducts[p.id] && (productQuantities[p.id] || 0) > 0);
                if (productsForThisOrder.length === 0) continue;

                const { data: orderData, error: orderError } = await supabase
                    .from('orden_compra').insert({
                        proveedor: supplier.nombre,
                        fecha_pedido: new Date().toISOString().split('T')[0],
                        estado: 'Borrador',
                        usuario: user?.email || 'desconocido',
                        sede_id: sede.id,
                        empresa_id: empresa.id,
                    }).select().single();
                
                if (orderError) throw orderError;

                const detailsToInsert = productsForThisOrder.map(p => ({
                    orden_id: orderData.id,
                    producto_id: p.id,
                    producto_nombre: p.nombre,
                    unidades: productQuantities[p.id] || 0,
                    costo_unitario_estimado: p.costo_x_unid || 0,
                }));

                const { error: detailError } = await supabase.from('orden_compra_detalle').insert(detailsToInsert);
                if (detailError) throw detailError;
            }
            alert(`${ordersToCreate.length} órdenes de compra generadas como borrador.`);
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            alert(`Error al generar órdenes: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-4xl flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-purple-500"/>Asistente de Pedidos Inteligente</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><XIcon className="w-6 h-6"/></button>
                </div>
                {loading ? (
                    <div className="flex-grow flex justify-center items-center"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>
                ) : Object.keys(groupedProducts).length === 0 ? (
                     <div className="flex-grow flex flex-col justify-center items-center text-center p-8">
                        <svg className="w-16 h-16 text-green-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">¡Todo en orden!</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">No se encontraron productos con stock bajo o crítico que necesiten ser repuestos en este momento.</p>
                    </div>
                ) : (
                <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                    {Object.entries(groupedProducts).map(([lab, prods]) => (
                        <div key={lab} className="p-4 border rounded-lg dark:border-gray-600">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">{lab}</h3>
                                <select onChange={(e) => handleSupplierChange(lab, e.target.value)} className="w-1/2 mt-1 block input-style text-sm">
                                    <option value="">Seleccionar Proveedor...</option>
                                    {Array.isArray(proveedores) && proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div className="max-h-60 overflow-y-auto pr-2">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-2 py-2 w-10"></th>
                                            <th className="px-2 py-2 text-left">Producto</th>
                                            <th className="px-2 py-2 text-center">Stock Actual/Mín</th>
                                            <th className="px-2 py-2 text-center w-28">Pedir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                    {prods.map(p => (
                                        <tr key={p.id} className={`${selectedProducts[p.id] ? '' : 'opacity-50'}`}>
                                            <td className="px-2 py-2"><input type="checkbox" checked={selectedProducts[p.id] || false} onChange={() => handleToggleProduct(p.id)} /></td>
                                            <td className="px-2 py-2 font-medium">{p.nombre}</td>
                                            <td className="px-2 py-2 text-center">{p.stock_unid || 0} / {p.stock_min || 0}</td>
                                            <td className="px-2 py-2"><input type="number" value={productQuantities[p.id] || ''} onChange={(e) => handleQuantityChange(p.id, e.target.value)} className="w-full text-center input-style text-sm p-1" /></td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
                )}
                 <div className="p-4 border-t dark:border-gray-700 flex justify-end items-center gap-4 bg-soft-gray-100 dark:bg-gray-800/50">
                     <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 font-semibold">Cancelar</button>
                     <button onClick={handleGenerateOrders} disabled={isSaving || Object.keys(groupedProducts).length === 0} className="px-6 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 flex items-center font-bold text-base">
                        {isSaving ? 'Generando...' : 'Generar Órdenes'}
                     </button>
                 </div>
            </div>
             <style>{`
             .input-style { @apply bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-black dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500; }
             @keyframes fade-in { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
             .animate-fade-in { animation: fade-in 0.2s ease-out; }
           `}</style>
        </div>
    );
};
export default InventarioPage;