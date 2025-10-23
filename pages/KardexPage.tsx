import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Product, KardexEntry, SaleDetail, Ingreso, Sale, SaleDetailItem } from '../types';
import { getAIInsight } from '../services/aiService';
import { BrainCircuitIcon, TrendingUpIcon, ShoppingCartIcon, ArrowUpRightIcon, ArrowDownLeftIcon, SparklesIcon, PackageIcon } from '../components/icons';
import ReactMarkdown from 'react-markdown';
import SaleDetailModal from '../components/SaleDetailModal';
import { useAuth } from '../components/Auth';

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const DollarSignIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;


const KardexPage: React.FC = () => {
    const { sede, empresa } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [kardexData, setKardexData] = useState<KardexEntry[]>([]);
    const [metrics, setMetrics] = useState({ totalSold: 0, totalRevenue: 0, lastSaleDate: '-' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [selectedSaleForModal, setSelectedSaleForModal] = useState<Sale | null>(null);

    const handleProductSearch = useCallback(async (term: string) => {
        if (term.length < 2 || !sede || !empresa) {
            setProductSuggestions([]);
            return;
        }
        const { data, error } = await supabase
            .from('productos')
            .select('id, nombre, stock_unid')
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .or(`nombre.ilike.%${term}%,codigo.ilike.%${term}%`)
            .limit(10);
        if (error) console.error("Error searching products:", error);
        else setProductSuggestions(data || []);
    }, [sede, empresa]);

    useEffect(() => {
        const debounce = setTimeout(() => handleProductSearch(searchTerm), 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, handleProductSearch]);

    const selectProduct = (product: Product) => {
        setSearchTerm(product.nombre);
        setSelectedProduct(product);
        setProductSuggestions([]);
    };

    const handleSearch = async () => {
        if (!selectedProduct || !sede || !empresa) {
            setError("Por favor, selecciona un producto de la lista.");
            return;
        }
        setLoading(true);
        setError(null);
        setKardexData([]);
        setAiInsight(null);

        try {
            // Step 1: Fetch sales details
            const { data: salesDetails, error: salesDetailsError } = await supabase
                .from('detalle_ventas')
                .select('*')
                .eq('producto_id', selectedProduct.id)
                .eq('sede_id', sede.id)
                .eq('empresa_id', empresa.id);

            if (salesDetailsError) throw salesDetailsError;
            
            let salesData: SaleDetail[] = [];
            
            if (salesDetails && salesDetails.length > 0) {
                // Step 2: Get unique sale IDs
                const saleIds = [...new Set(salesDetails.map(d => d.venta_id))];
                
                // Step 3: Fetch the corresponding sales records
                const { data: salesRecords, error: salesError } = await supabase
                    .from('ventas')
                    .select('*')
                    .in('id', saleIds)
                    .eq('sede_id', sede.id)
                    .eq('empresa_id', empresa.id);
                    
                if (salesError) throw salesError;
                
                // Step 4: Join the data in code and sort it
                const salesMap = new Map(salesRecords.map(s => [s.id, s]));
                
                salesData = salesDetails
                    .map(detail => ({
                        ...detail,
                        ventas: salesMap.get(detail.venta_id) as Sale,
                    }))
                    .filter(detail => detail.ventas) // Ensure a matching sale was found
                    .sort((a, b) => {
                        const dateA = a.ventas.fecha_venta ? new Date(a.ventas.fecha_venta).getTime() : 0;
                        const dateB = b.ventas.fecha_venta ? new Date(b.ventas.fecha_venta).getTime() : 0;
                        return dateB - dateA;
                    });
            }

            const { data: ingresosData, error: ingresosError } = await supabase
                .from('ingresos')
                .select('*')
                .eq('producto', selectedProduct.nombre)
                .eq('sede_id', sede.id)
                .eq('empresa_id', empresa.id)
                .order('f_ingreso', { ascending: false });

            if (ingresosError) throw ingresosError;
            
            const combinedData: any[] = [
                ...(salesData as SaleDetail[]).map(d => ({ ...d, type: 'Venta', date: d.ventas.fecha_venta })),
                ...(ingresosData as Ingreso[]).map(d => ({ ...d, type: 'Ingreso', date: d.f_ingreso }))
            ];

            combinedData.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
            });

            let currentStock = selectedProduct.stock_unid ?? 0;
            const processedKardex: KardexEntry[] = [];
            let totalSold = 0;
            let totalRevenue = 0;

            for (const item of combinedData) {
                let quantityChange = 0;
                let details = '';
                let documentId = null;
                let unitValue = null;

                if (item.type === 'Venta') {
                    quantityChange = -item.cantidad;
                    details = `Venta a ${item.ventas.cliente || 'Cliente Varios'}`;
                    documentId = item.ventas.id;
                    unitValue = item.precio_unitario;
                    totalSold += item.cantidad;
                    totalRevenue += item.subtotal;
                } else if (item.type === 'Ingreso') {
                    quantityChange = item.unidades;
                    details = `Ingreso de ${item.proveedor} (Fact. ${item.numero_factura || 'N/A'})`;
                    documentId = item.id;
                    unitValue = item.precio_compra;
                }

                processedKardex.push({
                    date: item.date,
                    type: item.type,
                    details,
                    quantityChange,
                    resultingStock: currentStock,
                    documentId,
                    unitValue
                });
                
                currentStock -= quantityChange;
            }

            setKardexData(processedKardex);
            setMetrics({ 
                totalSold, 
                totalRevenue, 
                lastSaleDate: salesData.length > 0 && salesData[0].ventas.fecha_venta ? new Date(salesData[0].ventas.fecha_venta).toLocaleDateString('es-PE') : '-' 
            });

        } catch (err: any) {
            setError(`Error al obtener el historial del producto: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const getAIAnalysis = async () => {
        if (!selectedProduct || !sede || !empresa) return;
        setLoadingAI(true);
        setAiInsight(null);
        const prompt = `Analiza el historial de movimientos para el producto "${selectedProduct.nombre}". Basándote en sus ventas e ingresos, ¿cuál es su tendencia de venta? ¿Qué tan rápido rota el stock? ¿Hay alguna estacionalidad o patrón evidente? Proporciona un resumen conciso y accionable para el administrador de la farmacia.`;
        try {
            const response = await getAIInsight(prompt, sede.id, empresa.id);
            setAiInsight(response.displayText);
        } catch (error) {
            setAiInsight("Ocurrió un error al contactar al servicio de IA.");
        } finally {
            setLoadingAI(false);
        }
    }

    const handleViewSale = async (saleId: number | string) => {
        const id = Number(saleId);
        if (isNaN(id) || !sede || !empresa) return;
        
        setError(null);
        const { data, error } = await supabase
            .from('ventas')
            .select('*')
            .eq('id', id)
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .single();
        
        if (error) {
            setError(`No se pudo cargar la venta N° ${id}: ${error.message}`);
        } else {
            setSelectedSaleForModal(data);
        }
    };

    const TimelineIcon: React.FC<{type: 'Venta' | 'Ingreso' | 'Ajuste'}> = ({type}) => {
        const baseClass = "w-10 h-10 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800";
        if (type === 'Venta') return <div className={`${baseClass} bg-red-500 text-white`}><ArrowDownLeftIcon className="w-5 h-5"/></div>;
        if (type === 'Ingreso') return <div className={`${baseClass} bg-green-500 text-white`}><ArrowUpRightIcon className="w-5 h-5"/></div>;
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
                <BrainCircuitIcon className="mx-auto h-12 w-12 text-clinical-blue" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">Kardex Valorizado y Análisis de Producto</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-2xl mx-auto">Busca un producto para ver su historial completo de movimientos, analizar su rendimiento y obtener insights con IA.</p>
                
                <div className="mt-6 max-w-2xl mx-auto relative">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Empieza a escribir el nombre o código del producto..."
                            className="w-full pl-12 pr-28 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full focus:ring-clinical-blue focus:border-clinical-blue transition-all"
                        />
                         <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                        <button
                            onClick={handleSearch}
                            disabled={!selectedProduct || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-clinical-blue text-white font-semibold rounded-full hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                    {productSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto text-left">
                            {productSuggestions.map(p => (
                                <li 
                                    key={p.id} 
                                    onClick={() => selectProduct(p)} 
                                    className="px-4 py-3 hover:bg-soft-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                                >
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{p.nombre}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">(Stock: {p.stock_unid})</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-300 p-4 rounded-lg">{error}</div>}

            {loading && (
                <div className="flex justify-center items-center h-40">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div>
                </div>
            )}

            {kardexData.length > 0 && selectedProduct && !loading && (
                <div className="space-y-6">
                    {/* Kardex 360 Dashboard */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Kardex 360°: {selectedProduct.nombre}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-4 bg-soft-gray-100 dark:bg-gray-700/50 rounded-lg">
                                <PackageIcon className="w-8 h-8 mx-auto text-gray-600 dark:text-gray-300"/>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Stock Actual</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedProduct.stock_unid}</p>
                            </div>
                            <div className="p-4 bg-soft-gray-100 dark:bg-gray-700/50 rounded-lg">
                                <ShoppingCartIcon className="w-8 h-8 mx-auto text-red-500"/>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Unidades Vendidas (Hist.)</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.totalSold}</p>
                            </div>
                            <div className="p-4 bg-soft-gray-100 dark:bg-gray-700/50 rounded-lg">
                                <DollarSignIcon className="w-8 h-8 mx-auto text-green-500"/>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Ingresos Generados (Hist.)</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">S/ {metrics.totalRevenue.toFixed(2)}</p>
                            </div>
                             <div className="p-4 bg-soft-gray-100 dark:bg-gray-700/50 rounded-lg">
                                <TrendingUpIcon className="w-8 h-8 mx-auto text-blue-500"/>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Última Venta</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.lastSaleDate}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* AI Analysis */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Análisis con IA</h2>
                            <button onClick={getAIAnalysis} disabled={loadingAI} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition-colors">
                                <SparklesIcon className="w-5 h-5"/>
                                {loadingAI ? 'Analizando...' : 'Generar Análisis'}
                            </button>
                         </div>
                         {loadingAI && <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400"><div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div><div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse [animation-delay:0.2s]"></div><div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse [animation-delay:0.4s]"></div><span>La IA está procesando los datos...</span></div>}
                         {aiInsight && <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert p-4 bg-soft-gray-100 dark:bg-gray-900 border dark:border-gray-700 rounded-md"><ReactMarkdown>{aiInsight}</ReactMarkdown></div>}
                    </div>

                    {/* Movement Timeline */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Línea de Tiempo de Movimientos</h2>
                        <div className="relative pl-8">
                            <div className="absolute left-12 top-0 h-full border-l-2 border-gray-200 dark:border-gray-700"></div>
                            <div className="space-y-8">
                                {kardexData.map((entry, index) => (
                                    <div key={index} className="relative flex items-start">
                                        <TimelineIcon type={entry.type} />
                                        <div className="ml-8 w-full bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{entry.details}</p>
                                                    {entry.type === 'Venta' && entry.documentId && (
                                                        <button 
                                                            onClick={() => handleViewSale(entry.documentId!)}
                                                            className="text-xs font-semibold text-clinical-blue hover:underline mt-1"
                                                        >
                                                            Ver Venta N° {entry.documentId}
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4">{entry.date ? new Date(entry.date).toLocaleString('es-PE') : 'Fecha no disponible'}</p>
                                            </div>
                                            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Movimiento</p>
                                                    <p className={`font-bold text-lg ${entry.quantityChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                                                    </p>
                                                </div>
                                                 <div className="text-center">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Valor Unit.</p>
                                                    <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">
                                                        S/ {entry.unitValue ? entry.unitValue.toFixed(2) : '0.00'}
                                                    </p>
                                                </div>
                                                 <div className="text-center">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Stock Resultante</p>
                                                    <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{entry.resultingStock}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <SaleDetailModal 
                sale={selectedSaleForModal}
                onClose={() => setSelectedSaleForModal(null)}
            />
        </div>
    );
};

export default KardexPage;
