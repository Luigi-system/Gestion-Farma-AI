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
  Sede,
  Empresa,
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
import { useAuth } from "./Auth";


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

const QuickProductModal: React.FC<{ onClose: () => void; onSave: (product: Product) => void; sede: Sede | null; empresa: Empresa | null; }> = ({ onClose, onSave, sede, empresa }) => {
    const [product, setProduct] = useState({ nombre: '', unid_pv: '' as number | '', stock_unid: '' as number | '', costo_x_unid: '' as number | '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sede || !empresa) return;
        setIsSaving(true);
        const { data, error } = await supabase.from('productos').insert([{...product, stock_min: 10, sede_id: sede.id, empresa_id: empresa.id}]).select().single();
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

const NewClientModal: React.FC<{ onClose: () => void; onSave: (client: Client) => void; sede: Sede | null; empresa: Empresa | null; }> = ({ onClose, onSave, sede, empresa }) => {
    const [client, setClient] = useState({ nombres: '', dni: '', celular: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sede || !empresa) return;
        setIsSaving(true);
        const { data, error } = await supabase.from('clientes').insert({...client, puntos: 0, sede_id: sede.id, empresa_id: empresa.id}).select().single();
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

const NewSupplierModal: React.FC<{ onClose: () => void; showNotification: (message: string, type: NotificationType) => void; sede: Sede | null; empresa: Empresa | null; }> = ({ onClose, showNotification, sede, empresa }) => {
    const [supplier, setSupplier] = useState({ nombre: '', ruc: '', cel1: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sede || !empresa) return;
        setIsSaving(true);
        const { error } = await supabase.from('proveedores').insert({...supplier, sede_id: sede.id, empresa_id: empresa.id});
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

const BackorderModal: React.FC<{ client: Client | null, initialProduct: string, onClose: () => void, showNotification: (message: string, type: NotificationType) => void, sede: Sede | null; empresa: Empresa | null; }> = ({ client, initialProduct, onClose, showNotification, sede, empresa }) => {
    const [backorder, setBackorder] = useState<Partial<Backorder>>({ cliente_id: client?.id, cliente_nombre: client?.nombres, producto_nombre: initialProduct, cantidad: 1, estado: 'Pendiente', notas: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sede || !empresa) return;
        setIsSaving(true);
        const { error } = await supabase.from('pedidos_clientes').insert({...backorder, sede_id: sede.id, empresa_id: empresa.id});
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
      const { data, error } = await supabase.from("ventas").select("total_a_pagar, tipo_pago").eq("usuario", caja.usuario).eq("estado", "Completada").gte("fecha_venta", caja.f_apertura!).eq('sede_id', caja.sede_id).eq('empresa_id', caja.empresa_id);
      if (error) { alert("Error al cargar resumen de ventas: " + error.message); } 
      else {
        const summary = (data || []).reduce((acc, sale) => {
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

const PuntoDeVenta: React.FC<PuntoDeVentaProps> = ({
  cajaInfo,
  onCajaClosed,
}) => {
  const { sede, empresa } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    nombre: true,
    principio_activo: true,
    codigo: false,
    laboratorio: false,
  });


  const [clientSearch, setClientSearch] = useState("");
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
  const [selectedClientData, setSelectedClientData] = useState<Client | null>(null);
  
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchResultsRef = useRef<HTMLUListElement>(null);
  
  const [frequentProducts, setFrequentProducts] = useState<Product[]>([]);
  const [loadingFrequent, setLoadingFrequent] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [discountPercent, setDiscountPercent] = useState<number | "">(0);
  const [discountSoles, setDiscountSoles] = useState<number | "">(0);
  const [montoRecibido, setMontoRecibido] = useState<number | "">("");
  const [allPromotions, setAllPromotions] = useState<Promocion[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);
  const [pendingSale, setPendingSale] = useState<Sale | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] =
    useState<CompletedSaleInfo | null>(null);
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [docType, setDocType] = useState<"boleta" | "factura">("boleta");
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [isBackorderModalOpen, setIsBackorderModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [redeemableProducts, setRedeemableProducts] = useState<
    RedeemableProductWithPromo[]
  >([]);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [consejoTicket, setConsejoTicket] = useState("");

  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const navigate = useNavigate();

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
   useEffect(() => {
        if (searchResultsRef.current && searchResults.length > 0) {
            const highlightedItem = searchResultsRef.current.children[highlightedIndex] as HTMLLIElement;
            if (highlightedItem) {
                highlightedItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        }
    }, [highlightedIndex, searchResults]);

  useEffect(() => {
    if (
      lastCompletedSale &&
      lastCompletedSale.clientName !== "Cliente Varios"
    ) {
      const client = clientSearchResults.find(
        (c) => c.nombres === lastCompletedSale.clientName
      );
      if (client && client.celular) {
        const phone = client.celular.replace(/[^0-9]/g, "");
        setWhatsAppNumber(phone.length === 9 ? `51${phone}` : phone);
      }
    }
  }, [lastCompletedSale, clientSearchResults]);

  const getUnitsPerSelection = useCallback(
    (product: Product, unit: SaleUnit): number => {
      switch (unit) {
        case "Blister":
          return product.blister_u || 1;
        case "Caja":
          return product.caja_u || 1;
        case "Paquete":
          return product.paquete_u || 1;
        default:
          return 1;
      }
    },
    []
  );

  useEffect(() => {
    const loadInitialData = async () => {
        if (!sede || !empresa) return;
        const { data: promoData, error: promoError } = await supabase.from('promociones').select('*').eq('sede_id', sede.id).eq('empresa_id', empresa.id);
        if (promoError) showNotification(`Error al verificar promociones: ${promoError.message}`, 'error');
        else setAllPromotions(promoData || []);

        const { data: saleData, error: saleError } = await supabase.from('ventas').select('*').eq('estado', 'Pendiente').eq('usuario', cajaInfo.usuario || 'desconocido').eq('sede_id', sede.id).eq('empresa_id', empresa.id).maybeSingle();
        if (saleError) {
            showNotification(`Error al buscar venta pendiente: ${saleError.message}`, 'error');
        } else if (saleData) {
            setIsCartLoading(true);
            setPendingSale(saleData);
            const { data: detailsData, error: detailsError } = await supabase.from('detalle_ventas').select('*').eq('venta_id', saleData.id);

            if (detailsError) {
                showNotification(`Error al cargar el carrito guardado: ${detailsError.message}`, 'error');
            } else if (detailsData) {
                const normalProductIds = detailsData.filter(d => d.producto_id > 0).map(d => d.producto_id);
                const redeemedProductIds = detailsData.filter(d => d.producto_id < 0).map(d => Math.abs(d.producto_id));

                const [productsRes, redeemedProductsRes] = await Promise.all([
                    normalProductIds.length > 0 ? supabase.from('productos').select('*').in('id', normalProductIds) : Promise.resolve({ data: [], error: null }),
                    redeemedProductIds.length > 0 ? supabase.from('productos_canje').select('*').in('id', redeemedProductIds) : Promise.resolve({ data: [], error: null })
                ]);

                if (productsRes.error || redeemedProductsRes.error) {
                    showNotification('Error al cargar productos del carrito.', 'error');
                } else {
                    const productsMap = new Map<number, Product>((productsRes.data || []).map(p => [p.id, p]));
                    const redeemedProductsMap = new Map<number, ProductoCanje>((redeemedProductsRes.data || []).map(p => [p.id, p]));

                    const restoredCart = detailsData.map(detail => {
                        if (detail.producto_id < 0) {
                            const originalRedeemed = redeemedProductsMap.get(Math.abs(detail.producto_id));
                            return {
                                id: detail.producto_id,
                                nombre: originalRedeemed?.nombre || detail.producto_nombre.replace('(CANJE) ', ''),
                                producto_nombre: detail.producto_nombre,
                                cantidad: detail.cantidad,
                                subtotal: detail.subtotal,
                                selectedUnit: 'Unidad',
                                price: 0,
                                unitsPerSelection: 1,
                                isRedeemed: true,
                                pointsCost: originalRedeemed?.puntos_requeridos || 0,
                                detail_id: detail.id,
                            } as CartItem;
                        } else {
                            const product = productsMap.get(detail.producto_id);
                            if (!product) return null;
                            return {
                                ...product,
                                cantidad: detail.cantidad,
                                subtotal: detail.subtotal,
                                selectedUnit: detail.tipo as SaleUnit,
                                price: detail.precio_unitario,
                                unitsPerSelection: getUnitsPerSelection(product, detail.tipo as SaleUnit),
                                isRedeemed: false,
                                detail_id: detail.id,
                                producto_nombre: detail.producto_nombre,
                            };
                        }
                    }).filter((item): item is CartItem => item !== null);

                    setCart(restoredCart);
                    
                    if (saleData.cliente && saleData.cliente !== 'Cliente Varios') {
                        const { data: clientData } = await supabase.from('clientes').select('*').eq('nombres', saleData.cliente).single();
                        if (clientData) {
                            setSelectedClientData(clientData);
                        }
                    }
                }
            }
            setIsCartLoading(false);
        }
    };
    loadInitialData();
  }, [cajaInfo.usuario, getUnitsPerSelection, sede, empresa]);


  const findOrCreatePendingSale =
    useCallback(async (): Promise<Sale | null> => {
      if (pendingSale) return pendingSale;
      if (!sede || !empresa) {
        showNotification("No se puede iniciar la venta: falta información de la sede/empresa.", "error");
        return null;
      }
      const { data, error } = await supabase
        .from("ventas")
        .insert({
          usuario: cajaInfo.usuario || "desconocido",
          estado: "Pendiente",
          total: 0,
          total_a_pagar: 0,
          sede_id: sede.id,
          empresa_id: empresa.id,
        })
        .select()
        .single();
      if (error) {
        showNotification(
          `No se pudo iniciar la venta: ${error.message}`,
          "error"
        );
        return null;
      }
      setPendingSale(data);
      return data;
    }, [pendingSale, cajaInfo.usuario, sede, empresa]);
    
    const handleFilterChange = (filterName: keyof typeof searchFilters) => {
        setSearchFilters(prev => {
            const newFilters = { ...prev, [filterName]: !prev[filterName] };
            const atLeastOneChecked = Object.values(newFilters).some(v => v);
            return atLeastOneChecked ? newFilters : prev;
        });
    };

    const searchPlaceholder = useMemo(() => {
        const active = Object.entries(searchFilters)
            .filter(([, isActive]) => isActive)
            .map(([key]) => {
                switch(key) {
                    case 'nombre': return 'Nombre';
                    case 'principio_activo': return 'P. Activo';
                    case 'codigo': return 'Código / Barras';
                    case 'laboratorio': return 'Laboratorio';
                    default: return '';
                }
            });
        return `Buscar por ${active.join(', ')}...`;
    }, [searchFilters]);


  const handleSearch = useCallback(async (term: string) => {
    if (term.length < 2 || !sede || !empresa) {
      setSearchResults([]);
      return;
    }

    const activeFilters = Object.entries(searchFilters)
        .filter(([, isActive]) => isActive)
        .map(([key]) => `${key}.ilike.%${term}%`);

    if (activeFilters.length === 0) {
        setSearchResults([]);
        return;
    }

    const orClause = activeFilters.join(',');

    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq('sede_id', sede.id)
      .eq('empresa_id', empresa.id)
      .or(orClause)
      .gt("stock_unid", 0)
      .limit(10);

    if (error) {
      showNotification(`Error al buscar productos: ${error.message}`, "error");
      setSearchResults([]);
    } else setSearchResults(data || []);
  }, [searchFilters, sede, empresa]);

  useEffect(() => {
    const debounce = setTimeout(() => handleSearch(searchTerm), 300);
    setHighlightedIndex(0);
    return () => clearTimeout(debounce);
  }, [searchTerm, handleSearch]);
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (searchResults.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          const productToAdd = searchResults[highlightedIndex];
          addToCart(productToAdd);
        }
      }
    };
  
  useEffect(() => {
    const fetchFrequentProducts = async () => {
        if (!selectedClientData || !sede || !empresa) {
            setFrequentProducts([]);
            return;
        }
        setLoadingFrequent(true);
        // This RPC needs to be updated in Supabase to accept and use sede/empresa IDs.
        const { data, error } = await supabase.rpc('get_frequent_products_by_client', { 
            client_name: selectedClientData.nombres, 
            p_sede_id: sede.id, 
            p_empresa_id: empresa.id 
        });

        if (error) {
            console.error("Error fetching frequent products:", error);
            setFrequentProducts([]);
        } else {
            setFrequentProducts(data || []);
        }
        setLoadingFrequent(false);
    };
    fetchFrequentProducts();
}, [selectedClientData, sede, empresa]);

useEffect(() => {
    if (clientSearch.length < 2 || !sede || !empresa) {
        setClientSearchResults([]);
        if (isSearchingClient) setIsSearchingClient(false);
        return;
    }
    const search = async () => {
        setIsSearchingClient(true);
        const { data } = await supabase.from('clientes').select('*').eq('sede_id', sede.id).eq('empresa_id', empresa.id).or(`nombres.ilike.%${clientSearch}%,dni.ilike.%${clientSearch}%`).limit(5);
        setClientSearchResults(data || []);
        setIsSearchingClient(false);
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
}, [clientSearch, sede, empresa]);


const handleSelectClient = (client: Client | null) => {
    if(client) {
        setSelectedClientData(client);
    } else {
        setSelectedClientData(null);
    }
    setClientSearch('');
    setClientSearchResults([]);
};

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    let totalDiscount = 0;
    if (discountPercent && Number(discountPercent) > 0) totalDiscount = subtotal * (Number(discountPercent) / 100);
    else if (discountSoles && Number(discountSoles) > 0) totalDiscount = Number(discountSoles);
    const totalConDescuento = subtotal - totalDiscount;
    const baseImponible = totalConDescuento / 1.18;
    const igv = totalConDescuento - baseImponible;
    const roundingFactor = paymentMethod === "Efectivo" ? 10 : 100;
    const totalAPagar = Math.round(totalConDescuento * roundingFactor) / roundingFactor;
    const redondeo = totalAPagar - totalConDescuento;
    const vuelto = paymentMethod === "Efectivo" && montoRecibido && Number(montoRecibido) > 0 ? Number(montoRecibido) - totalAPagar : 0;
    return { subtotal, totalDiscount, baseImponible, igv, redondeo, totalAPagar, vuelto };
  }, [cart, discountPercent, discountSoles, paymentMethod, montoRecibido]);

  const trulyActivePromotions = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return allPromotions.filter((p) => p.fecha_inicio <= todayStr && p.fecha_fin >= todayStr);
  }, [allPromotions]);

  const pointsToEarn = useMemo(() => {
    if (!selectedClientData || totals.totalAPagar <= 0) return 0;
    const selectedPromo = trulyActivePromotions.find((p) => p.id === parseInt(selectedPromotionId));
    const multiplier = selectedPromo?.multiplicador || 1;
    return Math.floor(totals.totalAPagar * multiplier);
  }, [selectedClientData, totals.totalAPagar, selectedPromotionId, trulyActivePromotions]);

  const addToCart = async (product: Product, quantity = 1, unit: SaleUnit = 'Unidad') => {
    if (!product || !sede || !empresa) return;
    setIsCartLoading(true);
    const sale = await findOrCreatePendingSale();
    if (!sale) { setIsCartLoading(false); return; }

    const price = unit === 'Unidad' ? product.unid_pv || 0 : 0;
    const unitsPerSelection = getUnitsPerSelection(product, unit);
    const stockChange = quantity * unitsPerSelection;
    const producto_nombre = `${product.nombre}`;
    
    const existingItem = cart.find((item) => item.id === product.id && item.selectedUnit === unit);
    if (existingItem) {
      await updateQuantity(product.id, existingItem.cantidad + quantity, false);
    } else {
      if (stockChange > (product.stock_unid || 0)) { showNotification("Stock insuficiente.", "warning"); setIsCartLoading(false); return; }
      
      const newStockValue = (product.stock_unid || 0) - stockChange;
      const { data: updatedProduct, error: stockError } = await supabase.from("productos").update({ stock_unid: newStockValue }).eq("id", product.id).select().single();
      if (stockError || !updatedProduct) { showNotification(`Error al actualizar stock: ${stockError?.message}`, "error"); setIsCartLoading(false); return; }
      
      const subtotal = quantity * price;
      const { data: newDetail, error: detailError } = await supabase.from("detalle_ventas").insert({ venta_id: sale.id, producto_id: product.id, producto_nombre, cantidad: quantity, precio_unitario: price, subtotal, usuario: sale.usuario, tipo: unit, sede_id: sede.id, empresa_id: empresa.id }).select().single();
      if (detailError) {
        showNotification(`Error al añadir producto: ${detailError.message}`, "error");
        await supabase.from("productos").update({ stock_unid: product.stock_unid }).eq("id", product.id);
        setIsCartLoading(false);
        return;
      }
      const newItem: CartItem = { ...product, stock_unid: updatedProduct.stock_unid, cantidad: quantity, selectedUnit: unit, price, unitsPerSelection, subtotal, detail_id: newDetail.id, producto_nombre };
      setCart((prev) => [...prev, newItem]);
    }
    setSearchTerm("");
    setSearchResults([]);
    setHighlightedIndex(0);
    setIsCartLoading(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, item: CartItem) => {
    if (e.key === '+') {
        e.preventDefault();
        updateQuantity(item.id, item.cantidad + 1);
    } else if (e.key === '-') {
        e.preventDefault();
        updateQuantity(item.id, item.cantidad - 1);
    }
  };

    const updateQuantity = async (productId: number, newQuantity: number, fromUI = true) => {
        const itemToUpdate = cart.find((item) => item.id === productId);
        if (!itemToUpdate || itemToUpdate.isRedeemed) { return; }

        if (itemToUpdate.selectedUnit === 'Unidad' && fromUI && newQuantity > 1 && !isNaN(newQuantity)) {
            let targetUnit: SaleUnit | null = null;
            
            if (itemToUpdate.paquete_u && newQuantity === itemToUpdate.paquete_u) {
                targetUnit = 'Paquete';
            } else if (itemToUpdate.caja_u && newQuantity === itemToUpdate.caja_u) {
                targetUnit = 'Caja';
            } else if (itemToUpdate.blister_u && newQuantity === itemToUpdate.blister_u) {
                targetUnit = 'Blister';
            }

            if (targetUnit) {
                setIsCartLoading(true);
                let price = 0;
                let newUnitsPerSelection = 1;
                switch (targetUnit) {
                    case "Blister": price = itemToUpdate.blister_pv || 0; newUnitsPerSelection = itemToUpdate.blister_u || 1; break;
                    case "Caja": price = itemToUpdate.caja_pv || 0; newUnitsPerSelection = itemToUpdate.caja_u || 1; break;
                    case "Paquete": price = itemToUpdate.paquete_pv || 0; newUnitsPerSelection = itemToUpdate.paquete_u || 1; break;
                }

                const newUnitQuantity = 1;
                const newSubtotal = newUnitQuantity * price;
                
                const currentUnitsInCart = itemToUpdate.cantidad * itemToUpdate.unitsPerSelection;
                const originalStock = (itemToUpdate.stock_unid || 0) + currentUnitsInCart;
                const newUnitsRequired = newUnitQuantity * newUnitsPerSelection;

                if (newUnitsRequired > originalStock) {
                    showNotification(`Stock insuficiente para convertir a ${targetUnit}.`, "warning");
                    setIsCartLoading(false);
                    return;
                }
                const finalStock = originalStock - newUnitsRequired;

                const { data: updatedProduct, error: stockError } = await supabase.from("productos").update({ stock_unid: finalStock }).eq("id", productId).select().single();
                if (stockError) { 
                    showNotification(`Error al actualizar stock: ${stockError.message}`, 'error');
                    setIsCartLoading(false);
                    return;
                }

                await supabase.from("detalle_ventas").update({ 
                    cantidad: newUnitQuantity, 
                    subtotal: newSubtotal, 
                    tipo: targetUnit, 
                    precio_unitario: price 
                }).eq("id", itemToUpdate.detail_id!);
                
                setCart(prev => prev.map(item => item.id === productId ? {
                    ...item,
                    cantidad: newUnitQuantity,
                    subtotal: newSubtotal,
                    stock_unid: updatedProduct!.stock_unid,
                    selectedUnit: targetUnit!,
                    price: price,
                    unitsPerSelection: newUnitsPerSelection,
                } : item));
                setIsCartLoading(false);
                return; 
            }
        }
    
        if (fromUI) setIsCartLoading(true);
        if (newQuantity < 1) { await removeFromCart(productId); if (fromUI) setIsCartLoading(false); return; }
    
        const currentUnitsInCart = itemToUpdate.cantidad * itemToUpdate.unitsPerSelection;
        const originalStock = (itemToUpdate.stock_unid || 0) + currentUnitsInCart;
        const newUnitsRequired = newQuantity * itemToUpdate.unitsPerSelection;
    
        if (newUnitsRequired > originalStock) {
          showNotification(`Stock insuficiente. Máximo: ${Math.floor(originalStock / itemToUpdate.unitsPerSelection)}`, "warning");
          if (fromUI) setIsCartLoading(false);
          return;
        }
    
        const finalStock = originalStock - newUnitsRequired;
        const { data: updatedProduct, error: stockError } = await supabase.from("productos").update({ stock_unid: finalStock }).eq("id", productId).select().single();
    
        if (stockError || !updatedProduct) { showNotification(`Error al actualizar stock: ${stockError?.message}`, "error"); if (fromUI) setIsCartLoading(false); return; }
    
        const newSubtotal = newQuantity * itemToUpdate.price;
        await supabase.from("detalle_ventas").update({ cantidad: newQuantity, subtotal: newSubtotal }).eq("id", itemToUpdate.detail_id!);
        
        setCart(prevCart => prevCart.map((item) => item.id === productId ? { ...item, cantidad: newQuantity, subtotal: newSubtotal, stock_unid: updatedProduct!.stock_unid } : item));
    
        if (fromUI) setIsCartLoading(false);
      };

  const handleUnitChange = async (productId: number, newUnit: SaleUnit) => {
    setIsCartLoading(true);
    const item = cart.find((i) => i.id === productId);
    if (!item || !pendingSale || item.isRedeemed) { setIsCartLoading(false); return; }
    let price = 0, newUnitsPerSelection = 1;
    switch (newUnit) {
      case "Blister": price = item.blister_pv || 0; newUnitsPerSelection = item.blister_u || 1; break;
      case "Caja": price = item.caja_pv || 0; newUnitsPerSelection = item.caja_u || 1; break;
      case "Paquete": price = item.paquete_pv || 0; newUnitsPerSelection = item.paquete_u || 1; break;
      default: price = item.unid_pv || 0; newUnitsPerSelection = 1;
    }
    const currentUnitsUsed = item.cantidad * item.unitsPerSelection;
    const originalStock = (item.stock_unid || 0) + currentUnitsUsed;
    const newUnitsRequired = item.cantidad * newUnitsPerSelection;
    if (newUnitsRequired > originalStock) { showNotification(`Stock insuficiente para ${newUnit}.`, "warning"); setIsCartLoading(false); return; }
    const finalStock = originalStock - newUnitsRequired;
    const { data: updatedProduct, error: stockError } = await supabase.from("productos").update({ stock_unid: finalStock }).eq("id", productId).select().single();
    if (stockError || !updatedProduct) { showNotification(`Error al cambiar unidad: ${stockError?.message}`, "error"); setIsCartLoading(false); return; }
    const newProductName = `${item.nombre.split(" (")[0]}`;
    const newSubtotal = item.cantidad * price;
    await supabase.from("detalle_ventas").update({ tipo: newUnit, precio_unitario: price, subtotal: newSubtotal, producto_nombre: newProductName }).eq("id", item.detail_id!);
    setCart(prevCart => prevCart.map((i) => i.id === productId ? { ...i, selectedUnit: newUnit, price, unitsPerSelection: newUnitsPerSelection, subtotal: newSubtotal, producto_nombre: newProductName, stock_unid: updatedProduct!.stock_unid } : i));
    setIsCartLoading(false);
  };

  const removeFromCart = async (productId: number) => {
    setIsCartLoading(true);
    const itemToRemove = cart.find((item) => item.id === productId);
    if (!itemToRemove || !pendingSale) { setIsCartLoading(false); return; }
    if (!itemToRemove.isRedeemed) {
      const stockToReturn = itemToRemove.cantidad * itemToRemove.unitsPerSelection;
      const { data: productData, error: fetchError } = await supabase.from("productos").select("stock_unid").eq("id", productId).single();
      if (fetchError || !productData) { showNotification(`Error al leer stock: ${fetchError?.message}`, "error"); setIsCartLoading(false); return; }
      const newStock = (productData.stock_unid || 0) + stockToReturn;
      await supabase.from("productos").update({ stock_unid: newStock }).eq("id", productId);
    }
    await supabase.from("detalle_ventas").delete().eq("id", itemToRemove.detail_id!);
    setCart(prevCart => prevCart.filter((item) => item.id !== productId));
    setIsCartLoading(false);
  };

  const handleOpenRedeemModal = async () => {
    if (!selectedClientData || !sede || !empresa) return;
    setIsRedeemModalOpen(true);
    const activePromoIds = trulyActivePromotions.map((p) => p.id);
    if (activePromoIds.length === 0) { showNotification("No hay promociones activas con productos de canje.", "info"); setRedeemableProducts([]); return; }
    const { data, error } = await supabase.from("productos_canje").select("*").eq('sede_id', sede.id).eq('empresa_id', empresa.id).in("id_promo", activePromoIds).gt("stock", 0);
    if (error) { showNotification("Error al cargar productos de canje.", "error"); setRedeemableProducts([]); return; }
    if (data.length === 0) { showNotification("No se encontraron productos de canje con stock disponible para las promociones activas.", "info"); setRedeemableProducts([]); return; }
    const productsWithPromoData: RedeemableProductWithPromo[] = data.map((p_canje) => ({ ...p_canje, promociones: allPromotions.find((promo) => promo.id === p_canje.id_promo) || null }));
    const clientPoints = selectedClientData.puntos || 0;
    const sortedProducts = productsWithPromoData.sort((a, b) => {
      const canAffordA = clientPoints >= a.puntos_requeridos;
      const canAffordB = clientPoints >= b.puntos_requeridos;
      if (canAffordA && !canAffordB) return -1;
      if (!canAffordA && canAffordB) return 1;
      return a.puntos_requeridos - b.puntos_requeridos;
    });
    setRedeemableProducts(sortedProducts);
  };

  const handleRedeemItem = async (redeemItem: ProductoCanje) => {
    const sale = await findOrCreatePendingSale();
    if (!sale || !selectedClientData || !sede || !empresa) return;
    if ((selectedClientData.puntos || 0) < redeemItem.puntos_requeridos) { showNotification("Puntos insuficientes.", "warning"); return; }
    const redeemedItemName = `(CANJE) ${redeemItem.nombre}`;
    const { data: newDetail, error } = await supabase.from("detalle_ventas").insert({ venta_id: sale.id, producto_id: -redeemItem.id, producto_nombre: redeemedItemName, cantidad: 1, precio_unitario: 0, subtotal: 0, usuario: sale.usuario, tipo: "Unidad", sede_id: sede.id, empresa_id: empresa.id }).select().single();
    if (error) { showNotification(`Error al añadir canje: ${error.message}`, "error"); return; }
    const newCartItem: CartItem = { id: -redeemItem.id, nombre: redeemItem.nombre, producto_nombre: redeemedItemName, cantidad: 1, subtotal: 0, selectedUnit: "Unidad", price: 0, unitsPerSelection: 1, isRedeemed: true, pointsCost: redeemItem.puntos_requeridos, detail_id: newDetail.id } as CartItem;
    setCart((prev) => [...prev, newCartItem]);
    setIsRedeemModalOpen(false);
  };

  const getAvailableUnits = (product: Product) => {
    const options: { value: SaleUnit; label: string }[] = [];
    if (product.unid_pv != null) options.push({ value: "Unidad", label: "Unidad" });
    if (product.blister_pv != null) options.push({ value: "Blister", label: `Blister` });
    if (product.caja_pv != null) options.push({ value: "Caja", label: `Caja` });
    if (product.paquete_pv != null) options.push({ value: "Paquete", label: `Paquete` });
    return options;
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !pendingSale || !sede || !empresa) return;
    setIsProcessing(true);
    try {
      const saleUpdateData = { cliente: selectedClientData ? selectedClientData.nombres : "Cliente Varios", total: totals.subtotal, total_a_pagar: totals.totalAPagar, descuento_porcentaje: discountPercent && Number(discountPercent) > 0 ? Number(discountPercent) : null, descuento_soles: discountSoles && Number(discountSoles) > 0 ? Number(discountSoles) : null, tipo_pago: paymentMethod, estado: "Completada", fecha_venta: new Date().toISOString(), consejo_ticket: consejoTicket || null };
      const { data: updatedSale, error: saleError } = await supabase.from("ventas").update(saleUpdateData).eq("id", pendingSale.id).select().single();
      if (saleError) throw saleError;
      
      const today = new Date().toISOString().split('T')[0];
      const { data: rules, error: rulesError } = await supabase.from('comisiones_reglas').select('*').eq('activa', true).lte('fecha_inicio', today).or(`fecha_fin.is.null,fecha_fin.gte.${today}`).eq('sede_id', sede.id).eq('empresa_id', empresa.id);
  
      if (rulesError) {
          console.error("No se pudieron cargar las reglas de comisión, omitiendo generación.", rulesError);
      } else if (rules && rules.length > 0) {
          const rulesMap = new Map((rules as ComisionRegla[]).map(rule => [rule.producto_id, rule]));
          const commissionsToInsert = [];
  
          const { data: userData } = await supabase.from('usuarios').select('id').eq('email', updatedSale.usuario).single();
          const userId = userData?.id;
  
          if (userId) {
              for (const item of cart.filter(i => !i.isRedeemed)) {
                  const rule = rulesMap.get(item.id);
                  if (rule) {
                      let commissionAmount = 0;
                      if (rule.tipo_comision === 'porcentaje') {
                          commissionAmount = (item.subtotal * rule.valor_comision) / 100;
                      } else { // monto_fijo
                          commissionAmount = item.cantidad * item.unitsPerSelection * rule.valor_comision;
                      }
  
                      if (commissionAmount > 0) {
                          commissionsToInsert.push({
                              venta_id: updatedSale.id,
                              detalle_venta_id: item.detail_id,
                              usuario_id: userId,
                              producto_id: item.id,
                              monto_comision: commissionAmount,
                              regla_id: rule.id,
                              fecha_generacion: new Date().toISOString(),
                              sede_id: sede.id,
                              empresa_id: empresa.id,
                          });
                      }
                  }
              }
  
              if (commissionsToInsert.length > 0) {
                  const { error: commissionError } = await supabase.from('comisiones_generadas').insert(commissionsToInsert);
                  if (commissionError) {
                      console.error("Error al guardar comisiones generadas:", commissionError);
                  }
              }
          }
      }

      if (selectedClientData) {
        const totalPointsToRedeem = cart.filter((item) => item.isRedeemed).reduce((sum, item) => sum + (item.pointsCost || 0), 0);
        const currentPoints = selectedClientData.puntos || 0;
        const finalPoints = currentPoints + pointsToEarn - totalPointsToRedeem;
        const { error: clientUpdateError } = await supabase.from("clientes").update({ puntos: finalPoints }).eq("id", selectedClientData.id);
        if (clientUpdateError) throw clientUpdateError;
        for (const item of cart.filter((i) => i.isRedeemed)) {
          const originalProductId = Math.abs(item.id);
          const { error: historyError } = await supabase.from("historial_canjes").insert({ cliente_id: selectedClientData.id, cliente: selectedClientData.nombres, producto_id: originalProductId, producto: item.nombre, fecha: new Date().toISOString(), usuario: cajaInfo.usuario || "desconocido", puntos_gastados: item.pointsCost, sede_id: sede.id, empresa_id: empresa.id });
          if (historyError) throw historyError;
          const { data: productToUpdate, error: fetchError } = await supabase.from("productos_canje").select("stock").eq("id", originalProductId).single();
          if (fetchError) throw fetchError;
          const newStock = (productToUpdate.stock || 0) - item.cantidad;
          const estado = newStock > 0 ? "Disponible" : "Agotado";
          const { error: stockUpdateError } = await supabase.from("productos_canje").update({ stock: newStock, estado: estado }).eq("id", originalProductId);
          if (stockUpdateError) throw stockUpdateError;
        }
      }
      const soldProducts = new Map<number, { product: Product; quantity: number }>();
      cart.filter((i) => !i.isRedeemed).forEach((item) => {
        const existing = soldProducts.get(item.id);
        if (existing) { existing.quantity += item.cantidad * item.unitsPerSelection; } 
        else { soldProducts.set(item.id, { product: item, quantity: item.cantidad * item.unitsPerSelection }); }
      });
      for (const [, { product, quantity }] of soldProducts) {
        await supabase.rpc("increment_product_cont", { product_id_in: product.id, count_in: quantity });
        if (sede && empresa) {
          await createStockNotification(product, sede.id, empresa.id);
        }
      }
      if (sede && empresa) {
        await createLargeSaleNotification(updatedSale, sede.id, empresa.id);
      }
      setLastCompletedSale({ saleData: updatedSale, details: [...cart], clientName: selectedClientData ? selectedClientData.nombres : "Cliente Varios", totals });
      document.dispatchEvent(new CustomEvent("saleCompleted"));
    } catch (error: any) {
      showNotification(`Error al procesar la venta: ${error.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSale = () => {
    setCart([]);
    setSelectedClientData(null);
    setDiscountPercent(0);
    setDiscountSoles(0);
    setMontoRecibido("");
    setPendingSale(null);
    setLastCompletedSale(null);
    setWhatsAppNumber("");
    setConsejoTicket("");
  };
  
    const handleCancelSale = async () => {
        if (!pendingSale || cart.length === 0 || !sede || !empresa) {
            showNotification('No hay una venta en progreso para cancelar.', 'info');
            return;
        }

        if (!window.confirm(`¿Estás seguro de que quieres cancelar la Venta #${pendingSale.id}? Todos los productos se devolverán al stock.`)) {
            return;
        }

        setIsProcessing(true);
        try {
            // Restore stock for normal products
            const stockUpdates = cart
                .filter(item => !item.isRedeemed)
                .map(async (item) => {
                    const stockToReturn = item.cantidad * item.unitsPerSelection;
                     const { data: currentProduct, error: fetchError } = await supabase.from('productos').select('stock_unid').eq('id', item.id).single();
                    if (fetchError) throw fetchError;
                    const newStock = (currentProduct.stock_unid || 0) + stockToReturn;
                    return supabase.from('productos').update({ stock_unid: newStock }).eq('id', item.id);
                });
            
            const stockResults = await Promise.all(stockUpdates);
            const anyStockError = stockResults.find(res => res.error);
            if (anyStockError) throw anyStockError.error;

            // Mark sale as canceled
            await supabase.from('ventas').update({ estado: 'Cancelada', total: 0, total_a_pagar: 0 }).eq('id', pendingSale.id).eq('sede_id', sede.id).eq('empresa_id', empresa.id);

            showNotification(`Venta #${pendingSale.id} cancelada.`, 'success');
            handleNewSale(); // Reset UI

        } catch (error: any) {
            showNotification(`Error al cancelar la venta: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

  const handlePrintReceipt = () => {
    if (!lastCompletedSale) return;
    const receiptHtml = generateReceiptHtml(lastCompletedSale, docType);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!lastCompletedSale || !whatsAppNumber) { showNotification("Por favor, ingresa un número de WhatsApp válido.", "warning"); return; }
    const whatsAppConfigKeys = ["whatsapp_api_url", "whatsapp_api_key", "whatsapp_session_name"];
    const { data: configData, error: configError } = await supabase.from("configuraciones").select("key, value").in('key', whatsAppConfigKeys);
    if (configError) { showNotification("Error al cargar la configuración de WhatsApp.", "error"); return; }
    const configMap = new Map(configData.map((item) => [item.key, item.value]));
    const apiUrl = String(configMap.get("whatsapp_api_url") || "");
    const apiKey = String(configMap.get("whatsapp_api_key") || "");
    const sessionName = String(configMap.get("whatsapp_session_name") || "");
    if (!apiUrl) { showNotification("La URL del servicio de WhatsApp no está configurada. Ve a Configuraciones.", "error"); return; }
    const { saleData, totals } = lastCompletedSale;
    const itemsText = lastCompletedSale.details.map((item) => `- ${item.cantidad}x ${item.producto_nombre} (S/${item.subtotal.toFixed(2)})`).join("\n");
    const message = `*Boleta de Venta - GestionFarma*\n-----------------------------------\n*Venta N°:* ${saleData.id}\n*Fecha:* ${new Date(saleData.fecha_venta!).toLocaleString("es-PE")}\n\n*Productos:*\n${itemsText}\n-----------------------------------\n*Subtotal:* S/ ${totals.subtotal.toFixed(2)}\n*Descuento:* - S/ ${totals.totalDiscount.toFixed(2)}\n*TOTAL:* *S/ ${totals.totalAPagar.toFixed(2)}*\n\n¡Gracias por su compra!`;
    try {
      showNotification("Enviando boleta por WhatsApp...", "info");
      await whatsappService.sendMessage(apiUrl, sessionName, apiKey, whatsAppNumber, message);
      showNotification("Boleta enviada exitosamente.", "success");
    } catch (e: any) {
      showNotification(`Error al enviar el mensaje: ${e.message}`, "error");
    }
  };

  const canFinalizeSale = useMemo(() => {
    if (cart.length === 0 || isProcessing || isCartLoading) return false;
    if (paymentMethod === "Efectivo") {
      return (montoRecibido !== "" && Number(montoRecibido) >= totals.totalAPagar);
    }
    return true;
  }, [cart, isProcessing, isCartLoading, paymentMethod, montoRecibido, totals.totalAPagar]);

  const inputStyle = "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue transition-colors duration-200";
  const notificationStyles = { success: { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500', text: 'text-green-800 dark:text-green-200', icon: <SuccessIcon /> }, warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', icon: <WarningIcon /> }, error: { bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-500', text: 'text-red-800 dark:text-red-200', icon: <ErrorIcon /> }, info: { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-500', text: 'text-blue-800 dark:text-blue-200', icon: <WarningIcon /> }, };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-10rem)] relative mt-6">
      {notification && ( <div className={`fixed top-24 right-8 z-50 p-4 border-l-4 rounded-md shadow-lg flex items-center max-w-sm ${notificationStyles[notification.type].bg} ${notificationStyles[notification.type].border} ${notificationStyles[notification.type].text}`} role="alert" > <div className="flex-shrink-0">{notificationStyles[notification.type].icon}</div> <div className="ml-3 flex-1"><p className="text-sm font-medium">{notification.message}</p></div> <button onClick={() => setNotification(null)} className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${notificationStyles[notification.type].bg}`}> <span className="sr-only">Cerrar</span><CloseIcon /> </button> </div> )}
      {lastCompletedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
            <SuccessIcon />
            <h2 className="text-2xl font-bold text-gray-800 mt-4">
              Venta Finalizada con Éxito
            </h2>
            <p className="text-gray-600 mt-2">
              Venta N° {lastCompletedSale.saleData.id} por un total de{" "}
              <span className="font-bold">
                S/ {lastCompletedSale.totals.totalAPagar.toFixed(2)}
              </span>
              .
            </p>
            <div className="mt-6 space-y-4">
              <button
                onClick={handlePrintReceipt}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-black transition-colors"
              >
                <PrintIcon /> Imprimir{" "}
                {docType === "factura" ? "Factura" : "Boleta"}
              </button>

              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Documento</label>
                    <select
                      value={docType}
                      onChange={(e) =>
                        setDocType(e.target.value as "boleta" | "factura")
                      }
                      className="mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="boleta">Boleta</option>
                      <option value="factura">Factura</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-24">
                    <label className="text-xs text-gray-600">Prefijo</label>
                    <input
                      type="text"
                      value={"51"}
                      readOnly
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <label className="text-xs text-gray-600">Número</label>
                    <input
                      type="tel"
                      value={whatsAppNumber.replace(/^51/, "")}
                      onChange={(e) =>
                        setWhatsAppNumber(
                          `51${e.target.value.replace(/[^0-9]/g, "")}`
                        )
                      }
                      placeholder="N° sin prefijo (ej: 912345678)"
                      className="w-full mt-1 pl-3 pr-28 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="absolute right-1 top-9">
                      <button
                        onClick={handleSendWhatsApp}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                      >
                        <WhatsAppIcon /> Enviar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (!lastCompletedSale || !whatsAppNumber) { showNotification("Por favor, ingresa un número de WhatsApp válido.", "warning"); return; }
                      const receiptHtml = generateReceiptHtml(lastCompletedSale, docType);
                      try {
                        showNotification(`Enviando ${ docType === "factura" ? "factura" : "boleta" } PDF por WhatsApp...`, "info");
                        const whatsAppConfigKeys = ["whatsapp_api_url", "whatsapp_api_key", "whatsapp_session_name"];
                        const { data: configData, error: configError } = await supabase.from("configuraciones").select("key, value").in('key', whatsAppConfigKeys);
                        if (configError) { showNotification("Error al cargar configuración.", "error"); return; }
                        const configMap = new Map((configData || []).map((item: any) => [item.key, item.value]));
                        const apiUrl = String(configMap.get("whatsapp_api_url") || "");
                        const apiKey = String(configMap.get("whatsapp_api_key") || "");
                        const sessionName = String(configMap.get("whatsapp_session_name") || "my-session");
                        if (!apiUrl) { showNotification("La URL del servicio de WhatsApp no está configurada. Ve a Configuraciones.", "error"); return; }
                        const filename = `${docType}_${lastCompletedSale.saleData.id}.pdf`;
                        await whatsappService.sendPdf(apiUrl, sessionName, whatsAppNumber, receiptHtml, filename, apiKey);
                        showNotification(`${docType === "factura" ? "Factura" : "Boleta"} PDF enviada correctamente.`, "success");
                      } catch (err: any) {
                        showNotification(`Error al enviar PDF: ${err.message || String(err)}`, "error");
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    <PrintIcon /> Enviar{" "}
                    {docType === "factura" ? "Factura" : "Boleta"} (PDF)
                  </button>
                </div>
              </div>

              <button
                onClick={handleNewSale}
                className="w-full mt-6 px-4 py-3 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Realizar Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
      {isRedeemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl z-50 max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Canjear Puntos
            </h3>
            <div className="flex-grow overflow-y-auto pr-2">
              {redeemableProducts.length > 0 ? (
                <ul className="space-y-3">
                  {redeemableProducts.map((p) => {
                    const clientPoints = selectedClientData?.puntos || 0;
                    const canAfford = clientPoints >= p.puntos_requeridos;
                    const pointsNeeded = p.puntos_requeridos - clientPoints;
                    const promo = p.promociones;
                    const todayStr = new Date().toISOString().split("T")[0];
                    const isPromoActive = promo ? promo.fecha_inicio <= todayStr && promo.fecha_fin >= todayStr : false;
                    const daysRemaining = promo ? Math.ceil((new Date(promo.fecha_fin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

                    return (
                      <li key={p.id} className={`flex justify-between items-start p-3 bg-soft-gray-100 rounded-lg transition-opacity ${!isPromoActive ? "opacity-60" : ""}`}>
                        <div>
                          <p className="font-semibold text-gray-900">{p.nombre}</p>
                          <p className="text-sm text-clinical-blue font-bold">{p.puntos_requeridos} Puntos</p>
                          {promo && (
                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                              <p><span className="font-semibold">Promo:</span> {promo.nombre}</p>
                              <p><span className="font-semibold">Válido hasta:</span> {new Date(promo.fecha_fin + "T00:00:00").toLocaleDateString("es-PE")}
                                <span className={`font-semibold ml-2 ${daysRemaining !== null && daysRemaining < 7 ? "text-red-600" : "text-gray-700"}`}>({daysRemaining !== null && daysRemaining >= 0 ? `${daysRemaining} días restantes` : "Expirado"})</span>
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 pl-4">
                          <button onClick={() => handleRedeemItem(p)} disabled={!canAfford || !isPromoActive} className="px-4 py-2 bg-pharmacy-green text-white text-sm font-semibold rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed">
                            Canjear
                          </button>
                          {!canAfford && (<p className="text-xs text-red-600 mt-1">Te faltan {pointsNeeded} puntos</p>)}
                          {!isPromoActive && (<p className="text-xs text-gray-500 mt-1">Promo inactiva</p>)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-center py-10 text-gray-500">
                  No hay productos disponibles para canjear.
                </p>
              )}
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t">
              <button onClick={() => setIsRedeemModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {isCloseModalOpen && (
        <CierreCajaModal
          caja={cajaInfo}
          onClose={() => setIsCloseModalOpen(false)}
          onCajaClosed={onCajaClosed}
        />
      )}
       {isPointsModalOpen && selectedClientData && (
        <PointsManagerModal
            client={selectedClientData}
            onClose={() => setIsPointsModalOpen(false)}
            onUpdate={(newPoints) => {
                setSelectedClientData(prev => prev ? { ...prev, puntos: newPoints } : null);
                setClientSearchResults(prev => prev.map(c => c.id === selectedClientData.id ? { ...c, puntos: newPoints } : c));
            }}
        />
       )}
        {isQuickProductModalOpen && <QuickProductModal onClose={() => setIsQuickProductModalOpen(false)} onSave={(newProduct) => addToCart(newProduct)} sede={sede} empresa={empresa} />}
        {isNewClientModalOpen && <NewClientModal onClose={() => setIsNewClientModalOpen(false)} onSave={(newClient) => handleSelectClient(newClient)} sede={sede} empresa={empresa} />}
        {isNewSupplierModalOpen && <NewSupplierModal onClose={() => setIsNewSupplierModalOpen(false)} showNotification={showNotification} sede={sede} empresa={empresa} />}
        {isBackorderModalOpen && <BackorderModal client={selectedClientData} initialProduct={searchTerm} onClose={() => setIsBackorderModalOpen(false)} showNotification={showNotification} sede={sede} empresa={empresa} />}
        {isAssistantModalOpen && <AIAssistantModal onClose={() => setIsAssistantModalOpen(false)} onSelectProduct={addToCart} />}

      <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 shadow-md flex flex-col p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-4">
                Punto de Venta
                {pendingSale && <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">Venta #{pendingSale.id}</span>}
            </h2>
          <button
            onClick={() => setIsCloseModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Cerrar Caja
          </button>
        </div>
         <div className="mb-2 flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-medium">Buscar por:</span>
            {Object.entries({nombre: 'Nombre', principio_activo: 'P. Activo', codigo: 'Código', laboratorio: 'Lab.'}).map(([key, label]) => (
                <label key={key} className="flex items-center space-x-1.5 cursor-pointer">
                    <input type="checkbox" checked={searchFilters[key as keyof typeof searchFilters]} onChange={() => handleFilterChange(key as keyof typeof searchFilters)} className="h-4 w-4 rounded border-gray-300 text-clinical-blue focus:ring-clinical-blue"/>
                    <span>{label}</span>
                </label>
            ))}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-blue dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </div>
          {searchResults.length > 0 && (
            <ul ref={searchResultsRef} className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto dark:bg-gray-700 dark:border-gray-600">
              {searchResults.map((p, index) => {
                  const status = getExpirationStatus(p.f_vencimiento);
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <li 
                        key={p.id} 
                        onClick={() => addToCart(p)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`px-4 py-2 cursor-pointer flex items-center ${isHighlighted ? 'bg-clinical-blue text-white' : 'hover:bg-soft-gray-100 dark:hover:bg-gray-600'}`}
                    >
                        <span className={`w-2.5 h-2.5 ${status.color} rounded-full mr-3 flex-shrink-0`} title={status.tooltip}></span>
                        <div className="flex-grow">
                            <span className={`font-medium ${isHighlighted ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{p.nombre}</span>
                            <div className={`text-xs ${isHighlighted ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                <span>(Stock: {p.stock_unid})</span>
                                <span className="ml-2 font-semibold">
                                    U: S/{p.unid_pv?.toFixed(2) || '0.00'}
                                    {p.blister_pv && ` | B: S/${p.blister_pv.toFixed(2)}`}
                                    {p.caja_pv && ` | C: S/${p.caja_pv.toFixed(2)}`}
                                </span>
                            </div>
                        </div>
                    </li>
                  );
              })}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
            <button onClick={() => setIsQuickProductModalOpen(true)} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center gap-1"><PlusCircleIcon className="w-4 h-4" /> Producto</button>
            <button onClick={() => setIsNewClientModalOpen(true)} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center gap-1"><UserPlusIcon className="w-4 h-4" /> Cliente</button>
            <button onClick={() => setIsNewSupplierModalOpen(true)} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center gap-1"><TruckIcon className="w-4 h-4" /> Proveedor</button>
            <button onClick={() => navigate('/app/comisiones')} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center gap-1"><AwardIcon className="w-4 h-4" /> Comisiones</button>
            <button onClick={() => setIsAssistantModalOpen(true)} className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900"><SparklesIcon className="w-3 h-3" /> Asistente IA</button>
            {searchTerm.length > 2 && searchResults.length === 0 && (
                <button onClick={() => setIsBackorderModalOpen(true)} className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900">Registrar como Faltante</button>
            )}
        </div>

        <div
          className={`flex-grow mt-4 overflow-y-auto pr-2 relative`}
        >
          {isCartLoading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex justify-center items-center z-20">
                  <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-clinical-blue"></div>
              </div>
          )}
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-800 uppercase bg-soft-gray-100 sticky top-0 z-10 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 w-32">Tipo</th>
                <th className="px-4 py-3 w-36 text-center">Cantidad</th>
                <th className="px-4 py-3 w-28 text-right">P. Unit.</th>
                <th className="px-4 py-3 w-28 text-right">Subtotal</th>
                <th className="px-4 py-3 w-16 text-center"></th>
              </tr>
            </thead>
            <tbody className="dark:text-gray-200">
              {cart.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-gray-500 dark:text-gray-400"
                  >
                    Añade productos para iniciar una venta
                  </td>
                </tr>
              ) : (
                cart.map((item) => (
                  <tr
                    key={item.detail_id || item.id}
                    className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      item.isRedeemed
                        ? "bg-yellow-50 dark:bg-yellow-900/40"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {item.producto_nombre}
                    </td>
                    <td className="px-4 py-3">
                      {item.isRedeemed ? (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-200 text-yellow-800 rounded-full dark:bg-yellow-800 dark:text-yellow-200">
                          CANJE
                        </span>
                      ) : (
                        <select
                          value={item.selectedUnit}
                          onChange={(e) =>
                            handleUnitChange(
                              item.id,
                              e.target.value as SaleUnit
                            )
                          }
                          className="appearance-none text-xs bg-gray-800 text-white border-transparent focus:ring-2 focus:ring-offset-2 focus:ring-clinical-blue focus:border-clinical-blue rounded-md py-1 px-2"
                        >
                          {getAvailableUnits(item).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.isRedeemed ? (
                        item.cantidad
                      ) : (
                        <div className="flex items-center justify-center bg-gray-800 rounded-md">
                          <button type="button" onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="w-7 h-7 text-white text-lg hover:bg-gray-700 rounded-l-md transition-colors">-</button>
                          <input type="number" value={item.cantidad} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)} onKeyDown={(e) => handleKeyDown(e, item)} className="w-12 text-center bg-gray-800 text-white border-0 focus:ring-0 font-medium appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          <button type="button" onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="w-7 h-7 text-white text-lg hover:bg-gray-700 rounded-r-md transition-colors">+</button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.isRedeemed
                        ? "S/ 0.00"
                        : `S/ ${item.price.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      S/ {item.subtotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-md p-6 flex flex-col dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-800 mb-4 dark:text-gray-100">
          Resumen de Venta
        </h3>
        <div className="flex-grow space-y-4 overflow-y-auto pr-2">
            
            {/* --- Client Card --- */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600 transition-all duration-300">
                {!selectedClientData ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">Buscar Cliente por Nombre o DNI</label>
                        <div className="relative">
                            <input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Cliente Varios" className={`${inputStyle} dark:bg-gray-900`} />
                            {isSearchingClient && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-dashed rounded-full animate-spin border-clinical-blue"></div>}
                        </div>
                        {clientSearchResults.length > 0 && (
                            <ul className="relative z-20 mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                               {clientSearchResults.map(c => 
                                    <li key={c.id} onClick={() => handleSelectClient(c)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{c.nombres}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{c.dni}</p>
                                        </div>
                                        <div className="flex items-center text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                                            <StarIcon className="w-3 h-3 mr-1"/> {c.puntos || 0}
                                        </div>
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Cliente Seleccionado:</p>
                                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{selectedClientData.nombres}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedClientData.dni}</p>
                            </div>
                            <button onClick={() => handleSelectClient(null)} className="text-xs font-semibold text-red-500 hover:underline">Limpiar</button>
                        </div>
                        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Puntos: <span className="font-bold text-lg text-clinical-blue">{selectedClientData.puntos || 0}</span></p>
                                <button onClick={() => setIsPointsModalOpen(true)} className="text-xs px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600">Gestionar</button>
                            </div>
                            <button onClick={handleOpenRedeemModal} className="w-full flex items-center justify-center gap-2 text-sm py-2 bg-yellow-400 text-yellow-900 font-semibold rounded-md hover:bg-yellow-500 transition-colors"><StarIcon className="w-4 h-4" /> Canjear Puntos</button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* --- Frequent Purchases Card --- */}
            {selectedClientData && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Compras Frecuentes de {selectedClientData.nombres.split(' ')[0]}</h4>
                    {loadingFrequent ? (
                         <div className="space-y-2 animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-4/6"></div>
                        </div>
                    ) : frequentProducts.length > 0 ? (
                        <ul className="space-y-1">
                            {frequentProducts.map(p => (
                                <li key={p.id} className="flex justify-between items-center text-sm group">
                                    <span className="text-gray-700 dark:text-gray-300 truncate pr-2">{p.nombre}</span>
                                    <button onClick={() => addToCart(p)} className="p-1 rounded-full text-gray-400 group-hover:text-clinical-blue group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors"><PlusIcon className="w-4 h-4" /></button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 py-2">No hay compras frecuentes para este cliente.</p>
                    )}
                </div>
            )}
            
            {/* --- Payment Card --- */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600 space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Método de Pago</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={`${inputStyle} dark:bg-gray-900`}>
                        <option>Efectivo</option><option>Yape</option><option>Transferencia</option><option>Otros</option>
                    </select>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Dscto. (%)</label>
                        <input type="number" value={discountPercent} onChange={(e) => { setDiscountPercent(e.target.value === "" ? "" : parseFloat(e.target.value)); setDiscountSoles(0); }} className={`${inputStyle} dark:bg-gray-900`} />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Dscto. (S/)</label>
                        <input type="number" value={discountSoles} onChange={(e) => { setDiscountSoles(e.target.value === "" ? "" : parseFloat(e.target.value)); setDiscountPercent(0); }} className={`${inputStyle} dark:bg-gray-900`} />
                    </div>
                </div>
                {paymentMethod === "Efectivo" && (
                    <div className="pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Recibido</label>
                                <input type="number" value={montoRecibido} onChange={(e) => setMontoRecibido(e.target.value === "" ? "" : parseFloat(e.target.value))} className={`${inputStyle} dark:bg-gray-900`} placeholder="0.00"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Vuelto</label>
                                <div className="mt-1 px-3 py-2 bg-soft-gray-100 rounded-md font-semibold text-lg text-gray-800 dark:bg-gray-600 dark:text-gray-100">S/ {totals.vuelto > 0 ? totals.vuelto.toFixed(2) : "0.00"}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
        <div className="mt-auto pt-4 space-y-1 text-md">
          <div className="flex justify-between text-gray-600 text-sm dark:text-gray-400"><span>Op. Gravada:</span><span>S/ {totals.baseImponible.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-600 text-sm dark:text-gray-400"><span>IGV (18%):</span><span>S/ {totals.igv.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-600 font-semibold dark:text-gray-300"><span>Subtotal:</span><span>S/ {totals.subtotal.toFixed(2)}</span></div>
          {totals.totalDiscount > 0 && (<div className="flex justify-between text-red-600"><span>Descuento:</span><span>- S/ {totals.totalDiscount.toFixed(2)}</span></div>)}
          {totals.redondeo !== 0 && (<div className="flex justify-between text-blue-600"><span>Redondeo:</span><span>S/ {totals.redondeo.toFixed(2)}</span></div>)}
          <div className="flex justify-between font-bold text-2xl border-t-2 border-dashed pt-2 mt-2 dark:text-gray-100 dark:border-gray-600"><span>TOTAL:</span><span>S/ {totals.totalAPagar.toFixed(2)}</span></div>
        </div>
        <div className="mt-4 flex gap-2">
            <button onClick={handleCancelSale} disabled={isProcessing || cart.length === 0} className="w-full md:w-1/3 py-4 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors">
                Cancelar Venta
            </button>
            <button onClick={handleFinalizeSale} disabled={!canFinalizeSale} className="w-full md:w-2/3 py-4 bg-pharmacy-green text-white font-bold text-xl rounded-lg hover:bg-green-600 shadow-md hover:shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center">
              {isProcessing && (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>)}
              {isProcessing ? "Procesando..." : "Finalizar Venta"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PuntoDeVenta;