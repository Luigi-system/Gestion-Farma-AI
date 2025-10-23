import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import {
  Product,
  Client,
  CartItem,
  Promocion,
  Caja,
  SaleUnit,
  Sale,
  ProductoCanje,
  ComisionRegla,
  Proveedor,
  Backorder,
  AIResponse,
} from "../types";
import {
  createStockNotification,
  createLargeSaleNotification,
} from "../services/notificationService";
import * as whatsappService from "../services/whatsappService";
import { generateReceiptHtml } from "../services/receiptService";
import { getAIInsight } from "../services/aiService";
import { useNavigate } from "react-router-dom";
import { UserPlusIcon, TruckIcon, AwardIcon, PlusCircleIcon, MessageCircleIcon } from '../components/icons';


const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg> );


// Notification Icons
const SuccessIcon = () => (
  <svg
    className="h-10 w-10 text-green-500 mx-auto"
    fill="none"
    viewBox="0 0 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const WarningIcon = () => (
  <svg
    className="h-6 w-6 text-yellow-500"
    fill="none"
    viewBox="0 0 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);
const ErrorIcon = () => (
  <svg
    className="h-6 w-6 text-red-500"
    fill="none"
    viewBox="0 0 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const CloseIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    ></path>
  </svg>
);
const PrintIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="currentColor"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.001.004l-1.03 3.75 3.803-1.002z" />
  </svg>
);
const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

type NotificationType = "success" | "warning" | "error" | "info";

interface Totals {
  subtotal: number;
  totalDiscount: number;
  baseImponible: number;
  igv: number;
  redondeo: number;
  totalAPagar: number;
  vuelto: number;
}
type CompletedSaleInfo = {
  saleData: Sale;
  details: CartItem[];
  clientName: string;
  totals: Totals;
};

interface PuntoDeVentaProps {
  cajaInfo: Caja;
  onCajaClosed: () => void;
}

type RedeemableProductWithPromo = ProductoCanje & {
  promociones: Promocion | null;
};

const getExpirationStatus = (dateString: string | null | undefined): { color: string, tooltip: string } => {
    if (!dateString) return { color: 'bg-gray-400', tooltip: 'Sin fecha de vencimiento' };
    
    const expirationDate = new Date(dateString + 'T00:00:00'); // Ensure it's parsed as local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'bg-red-500', tooltip: `Vencido hace ${Math.abs(diffDays)} días` };
    if (diffDays <= 90) return { color: 'bg-orange-500', tooltip: `Vence en ${diffDays} días` };
    if (diffDays <= 180) return { color: 'bg-blue-500', tooltip: 'Vence en menos de 6 meses' };
    return { color: 'bg-green-500', tooltip: 'Vencimiento lejano' };
};


// --- MODALS (Defined before main component to avoid reference errors) ---
const modalInputStyle = "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue transition-colors duration-200 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200";

const QuickProductModal: React.FC<{ onClose: () => void; onSave: (product: Product) => void; }> = ({ onClose, onSave }) => {
    const [product, setProduct] = useState({ nombre: '', unid_pv: '' as number | '', stock_unid: '' as number | '', costo_x_unid: '' as number | '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const { data, error } = await supabase.from('productos').insert([{...product, stock_min: 10}]).select().single();
        if (error) {
            alert(`Error al crear producto: ${error.message}`);
        } else {
            onSave(data as Product);
            onClose();
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Crear Producto Rápido</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm">Nombre</label><input type="text" value={product.nombre} onChange={e => setProduct(p => ({...p, nombre: e.target.value}))} required className={modalInputStyle} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm">Precio Venta (Unidad)</label><input type="number" step="0.1" value={product.unid_pv} onChange={e => setProduct(p => ({...p, unid_pv: parseFloat(e.target.value) || ''}))} required className={modalInputStyle} /></div>
                        <div><label className="block text-sm">Stock Inicial</label><input type="number" value={product.stock_unid} onChange={e => setProduct(p => ({...p, stock_unid: parseInt(e.target.value) || ''}))} required className={modalInputStyle} /></div>
                    </div>
                     <div><label className="block text-sm">Costo (Unidad)</label><input type="number" step="0.1" value={product.costo_x_unid} onChange={e => setProduct(p => ({...p, costo_x_unid: parseFloat(e.target.value) || ''}))} className={modalInputStyle} /></div>
                    <div className="flex justify-end pt-4 space-x-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-pharmacy-green text-white rounded-lg disabled:bg-green-300">{isSaving ? 'Guardando...' : 'Guardar y Añadir'}</button></div>
                </form>
            </div>
        </div>
    );
};

const NewClientModal: React.FC<{ onClose: () => void; onSave: (client: Client) => void; }> = ({ onClose, onSave }) => {
    const [client, setClient] = useState({ nombres: '', dni: '', celular: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const { data, error } = await supabase.from('clientes').insert({...client, puntos: 0}).select().single();
        if (error) {
            alert(`Error al crear cliente: ${error.message}`);
        } else {
            onSave(data as Client);
            onClose();
        }
        setIsSaving(false);
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Crear Nuevo Cliente</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm">Nombres Completos</label><input type="text" value={client.nombres} onChange={e => setClient(c => ({...c, nombres: e.target.value}))} required className={modalInputStyle} /></div>
                    <div><label className="block text-sm">DNI</label><input type="text" value={client.dni} onChange={e => setClient(c => ({...c, dni: e.target.value}))} className={modalInputStyle} /></div>
                    <div><label className="block text-sm">Celular</label><input type="tel" value={client.celular} onChange={e => setClient(c => ({...c, celular: e.target.value}))} className={modalInputStyle} /></div>
                    <div className="flex justify-end pt-4 space-x-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-pharmacy-green text-white rounded-lg disabled:bg-green-300">{isSaving ? 'Guardando...' : 'Guardar y Seleccionar'}</button></div>
                </form>
            </div>
        </div>
    );
};

const NewSupplierModal: React.FC<{ onClose: () => void; showNotification: (message: string, type: NotificationType) => void; }> = ({ onClose, showNotification }) => {
    const [supplier, setSupplier] = useState({ nombre: '', ruc: '', cel1: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const { error } = await supabase.from('proveedores').insert(supplier);
        if (error) {
            showNotification(`Error al crear proveedor: ${error.message}`, 'error');
        } else {
            showNotification('Proveedor creado exitosamente.', 'success');
            onClose();
        }
        setIsSaving(false);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Crear Nuevo Proveedor</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm">Nombre o Razón Social</label><input type="text" value={supplier.nombre} onChange={e => setSupplier(s => ({...s, nombre: e.target.value}))} required className={modalInputStyle} /></div>
                    <div><label className="block text-sm">RUC</label><input type="text" value={supplier.ruc} onChange={e => setSupplier(s => ({...s, ruc: e.target.value}))} className={modalInputStyle} /></div>
                    <div><label className="block text-sm">Celular</label><input type="tel" value={supplier.cel1} onChange={e => setSupplier(s => ({...s, cel1: e.target.value}))} className={modalInputStyle} /></div>
                    <div className="flex justify-end pt-4 space-x-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-pharmacy-green text-white rounded-lg disabled:bg-green-300">{isSaving ? 'Guardando...' : 'Guardar Proveedor'}</button></div>
                </form>
            </div>
        </div>
    );
};

const BackorderModal: React.FC<{ client: Client | null, initialProduct: string, onClose: () => void, showNotification: (message: string, type: NotificationType) => void }> = ({ client, initialProduct, onClose, showNotification }) => {
    const [backorder, setBackorder] = useState<Partial<Backorder>>({ cliente_id: client?.id, cliente_nombre: client?.nombres, producto_nombre: initialProduct, cantidad: 1, estado: 'Pendiente', notas: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const { error } = await supabase.from('pedidos_clientes').insert(backorder);
        if (error) {
            showNotification(`Error al registrar faltante: ${error.message}`, 'error');
        } else {
            showNotification('Producto faltante registrado con éxito.', 'success');
            onClose();
        }
        setIsSaving(false);
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">Registrar Producto Faltante</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div><label className="block text-sm">Producto</label><input type="text" value={backorder.producto_nombre} onChange={e => setBackorder(b => ({...b, producto_nombre: e.target.value}))} required className={modalInputStyle} /></div>
                     <div><label className="block text-sm">Cliente (Opcional)</label><input type="text" value={backorder.cliente_nombre || ''} readOnly disabled className={`${modalInputStyle} bg-gray-100 dark:bg-gray-900`} /></div>
                     <div><label className="block text-sm">Cantidad Solicitada</label><input type="number" value={backorder.cantidad} onChange={e => setBackorder(b => ({...b, cantidad: parseInt(e.target.value) || 1}))} required className={modalInputStyle} /></div>
                     <div><label className="block text-sm">Notas (Opcional)</label><textarea value={backorder.notas || ''} onChange={e => setBackorder(b => ({...b, notas: e.target.value}))} rows={2} className={modalInputStyle} /></div>
                    <div className="flex justify-end pt-4 space-x-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-pharmacy-green text-white rounded-lg disabled:bg-green-300">{isSaving ? 'Guardando...' : 'Registrar'}</button></div>
                </form>
            </div>
        </div>
    );
};

const AIAssistantModal: React.FC<{ onClose: () => void; onSelectProduct: (product: Product) => void; }> = ({ onClose, onSelectProduct }) => {
    // This is a simplified version for demonstration. A full implementation would be more complex.
    const [symptom, setSymptom] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<AIResponse | null>(null);

    const handleSearch = async () => {
        setLoading(true);
        const aiResponse = await getAIInsight(`Recomiéndame 3 productos para "${symptom}". Incluye nombre y precio unitario en una tabla.`);
        setResponse(aiResponse);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-purple-500" /> Asistente IA de Productos</h3>
                <div className="flex gap-2">
                    <input type="text" value={symptom} onChange={e => setSymptom(e.target.value)} placeholder="Ej: Dolor de cabeza, gripe..." className={modalInputStyle} />
                    <button onClick={handleSearch} disabled={loading || !symptom} className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:bg-purple-300">{loading ? '...' : 'Buscar'}</button>
                </div>
                 {loading && <div className="text-center py-4">Buscando recomendaciones...</div>}
                {response && (
                    <div className="mt-4">
                        <p>{response.displayText}</p>
                        {response.table && (
                            <ul className="mt-2 space-y-2">
                            {response.table.rows.map((row, i) => (
                                <li key={i} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                                    <span>{row[0]} - {row[1]}</span>
                                </li>
                            ))}
                            </ul>
                        )}
                    </div>
                )}
                 <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cerrar</button></div>
            </div>
        </div>
    );
};
const PointsManagerModal: React.FC<{ client: Client, onClose: () => void, onUpdate: (newPoints: number) => void }> = ({ client, onClose, onUpdate }) => {
    return <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"><div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-xl font-bold mb-4">Gestionar Puntos (En desarrollo)</h3> <p>Esta función para añadir o quitar puntos manualmente está en construcción.</p><div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cerrar</button></div></div></div>;
}


interface CierreCajaModalProps {
  caja: Caja;
  onClose: () => void;
  onCajaClosed: () => void;
}

const CierreCajaModal: React.FC<CierreCajaModalProps> = ({
  caja,
  onClose,
  onCajaClosed,
}) => {
  const [salesSummary, setSalesSummary] = useState({ total: 0, efectivo: 0, yape: 0, transferencia: 0, otros: 0 });
  const [loading, setLoading] = useState(true);
  const [montoFisico, setMontoFisico] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("ventas").select("total_a_pagar, tipo_pago").eq("usuario", caja.usuario).eq("estado", "Completada").gte("fecha_venta", caja.f_apertura!);
      if (error) { alert("Error al cargar resumen de ventas: " + error.message); } 
      else {
        const summary = data.reduce((acc, sale) => {
            const total = sale.total_a_pagar || 0;
            acc.total += total;
            switch (sale.tipo_pago) {
              case "Efectivo": acc.efectivo += total; break;
              case "Yape": acc.yape += total; break;
              case "Transferencia": acc.transferencia += total; break;
              case "Otros": acc.otros += total; break;
              default: acc.efectivo += total;
            }
            return acc;
          }, { total: 0, efectivo: 0, yape: 0, transferencia: 0, otros: 0 });
        setSalesSummary(summary);
      }
      setLoading(false);
    };
    fetchSalesData();
  }, [caja]);

  const diferencia = useMemo(() => {
    if (montoFisico === "") return 0;
    const totalEfectivoSistema = salesSummary.efectivo + (caja.monto_apertura || 0);
    return montoFisico - totalEfectivoSistema;
  }, [montoFisico, salesSummary.efectivo, caja.monto_apertura]);

  const handleConfirmarCierre = async () => {
    if (montoFisico === "" || montoFisico < 0) { alert("Ingresa un monto físico válido."); return; }
    setIsSaving(true);
    const monto_sobrante = diferencia > 0 ? diferencia : 0;
    const monto_faltante = diferencia < 0 ? Math.abs(diferencia) : 0;
    const { error } = await supabase.from("caja").update({ estado: "cerrada", f_cierre: new Date().toISOString(), monto_sistema: salesSummary.total, monto_fisico: montoFisico, monto_sobrante, monto_faltante, monto_yape: salesSummary.yape, monto_transferencia: salesSummary.transferencia, monto_otros: salesSummary.otros, monto_efectivo: salesSummary.efectivo }).eq("id", caja.id);
    if (error) { alert("Error al cerrar la caja: " + error.message); setIsSaving(false); } 
    else { alert("Caja cerrada exitosamente."); onCajaClosed(); onClose(); }
  };

  const inputStyle = "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg z-50">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Cierre de Caja</h3>
        {loading ? ( <div className="flex justify-center items-center h-48"><div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-clinical-blue"></div></div> ) : (
          <div className="space-y-4">
            <div className="p-4 bg-soft-gray-100 dark:bg-gray-700/50 rounded-lg">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Resumen del Sistema</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Monto Apertura:</span> <span className="font-medium text-gray-800 dark:text-gray-200">S/ {(caja.monto_apertura || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Ventas en Efectivo:</span> <span className="font-medium text-gray-800 dark:text-gray-200">S/ {salesSummary.efectivo.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold border-t pt-1 mt-1 dark:border-gray-600"><span className="text-gray-800 dark:text-gray-100">Total Efectivo Sistema:</span> <span className="text-gray-900 dark:text-white">S/ {(salesSummary.efectivo + (caja.monto_apertura || 0)).toFixed(2)}</span></div>
                <hr className="my-2 border-dashed dark:border-gray-600" />
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Ventas Yape/Plin:</span> <span className="font-medium text-gray-800 dark:text-gray-200">S/ {(salesSummary.yape + salesSummary.otros).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Ventas Transferencia:</span> <span className="font-medium text-gray-800 dark:text-gray-200">S/ {salesSummary.transferencia.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-xl border-t-2 pt-2 mt-2 dark:border-gray-500"><span className="text-gray-800 dark:text-gray-100">Total General Sistema:</span> <span className="text-clinical-blue">S/ {salesSummary.total.toFixed(2)}</span></div>
              </div>
            </div>
            <div>
              <label htmlFor="monto_fisico" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Monto Físico en Caja (S/)</label>
              <input type="number" step="0.10" id="monto_fisico" value={montoFisico} onChange={(e) => setMontoFisico(e.target.value === "" ? "" : parseFloat(e.target.value))} required className={inputStyle} />
            </div>
            {montoFisico !== "" && (
              <div className={`p-3 rounded-lg text-center font-bold text-lg ${diferencia === 0 ? "bg-gray-100 dark:bg-gray-700" : diferencia > 0 ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"}`}>
                {diferencia === 0 && "Cuadre Perfecto"}
                {diferencia > 0 && `Sobrante: S/ ${diferencia.toFixed(2)}`}
                {diferencia < 0 && `Faltante: S/ ${Math.abs(diferencia).toFixed(2)}`}
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end pt-6 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">Cancelar</button>
          <button onClick={handleConfirmarCierre} disabled={loading || isSaving || montoFisico === ""} className="px-4 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600 disabled:bg-green-300">{isSaving ? "Cerrando..." : "Confirmar Cierre"}</button>
        </div>
      </div>
    </div>
  );
};
