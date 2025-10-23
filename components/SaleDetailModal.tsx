import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Sale, SaleDetailItem } from '../types';

interface SaleDetailModalProps {
    sale: Sale | null;
    onClose: () => void;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ sale, onClose }) => {
    const [details, setDetails] = useState<SaleDetailItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sale) return;

        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from('detalle_ventas')
                .select('id, producto_nombre, cantidad, precio_unitario, subtotal, tipo')
                .eq('venta_id', sale.id);
            
            if (error) {
                console.error("Error fetching sale details:", error);
                setError("No se pudieron cargar los detalles de la venta.");
            } else {
                setDetails(data || []);
            }
            setLoading(false);
        };

        fetchDetails();
    }, [sale]);

    if (!sale) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl z-50 max-h-[90vh] flex flex-col animate-fade-in-down dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Detalle de Venta N° <span className="text-clinical-blue">{sale.id}</span></h3>
                    <button onClick={onClose} className="text-2xl p-1 rounded-full hover:bg-gray-200 text-gray-500 leading-none dark:text-gray-400 dark:hover:bg-gray-700">&times;</button>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                    <div><strong className="text-gray-600 dark:text-gray-400">Cliente:</strong> <span className="text-gray-800 dark:text-gray-200">{sale.cliente || 'Cliente Varios'}</span></div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Fecha:</strong> <span className="text-gray-800 dark:text-gray-200">{new Date(sale.fecha_venta!).toLocaleString('es-PE')}</span></div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Usuario:</strong> <span className="text-gray-800 dark:text-gray-200">{sale.usuario}</span></div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Tipo de Pago:</strong> <span className="text-gray-800 dark:text-gray-200">{sale.tipo_pago}</span></div>
                </div>

                <div className="flex-grow overflow-y-auto border rounded-lg dark:border-gray-700">
                    {loading ? (
                         <div className="flex justify-center items-center h-40"><div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500 dark:text-red-400">{error}</div>
                    ) : (
                        <table className="min-w-full">
                            <thead className="bg-soft-gray-100 sticky top-0 z-10 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Producto</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Cantidad</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">P. Unit.</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-600">
                                {details.length > 0 ? details.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{item.producto_nombre}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center text-gray-700 dark:text-gray-300">{item.cantidad} x {item.tipo}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700 dark:text-gray-300">S/ {item.precio_unitario.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-gray-900 dark:text-gray-100">S/ {item.subtotal.toFixed(2)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                            No hay detalles para esta venta.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-between items-center text-xl font-bold text-gray-800 border-t pt-4 mt-4 dark:text-gray-100 dark:border-gray-700">
                    <span>Total de Venta:</span>
                    <span className="text-clinical-blue">S/ {sale.total_a_pagar ? sale.total_a_pagar.toFixed(2) : sale.total.toFixed(2)}</span>
                </div>
                <style>{`
                    @keyframes fade-in-down {
                      0% { opacity: 0; transform: translateY(-10px); }
                      100% { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in-down { animation: fade-in-down 0.2s ease-out; }
                `}</style>
            </div>
        </div>
    );
};

export default SaleDetailModal;