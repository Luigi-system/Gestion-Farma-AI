import { ReactNode } from "react";

export interface KardexEntry {
  date: string;
  type: 'Venta' | 'Ingreso' | 'Ajuste';
  details: string;
  quantityChange: number;
  resultingStock: number;
  documentId?: number | string | null;
  unitValue?: number | null;
}
export interface Product {
  id: number;
  imagen?: string | null;
  codigo?: string | null;
  nombre: string;
  lote?: string | null;
  laboratorio?: string | null;
  principio_activo?: string | null;
  accion_terapeutica?: string | null;
  codigo_digemid?: string | null;
  r_sanitario?: string | null;
  psicotropico?: boolean | null;
  controlado?: boolean | null;
  categoria?: string | null;
  costo_x_unid?: number | null;
  unid_pv?: number | null;
  stock_unid?: number | null;
  blister_pv?: number | null;
  blister_u?: number | null;
  caja_pv?: number | null;
  caja_u?: number | null;
  paquete_pv?: number | null;
  paquete_u?: number | null;
  stock_min?: number | null;
  f_vencimiento?: string | null; // ISO 8601 format: "YYYY-MM-DD"
  f_creacion?: string | null;
  cont?: number | null;
  is_combo?: boolean;
  activo?: boolean;
  sede_id?: number | null;
  empresa_id?: number | null;
}

export interface Sale {
  id: number;
  fecha_venta?: string | null;
  usuario: string;
  cliente?: string | null;
  total: number;
  total_a_pagar?: number | null;
  descuento_porcentaje?: number | null;
  descuento_soles?: number | null;
  tipo_pago?: string | null;
  estado?: string | null;
  created_at?: string | null;
  documento_tipo?: 'boleta' | 'factura' | null;
  consejo_ticket?: string | null;
  sede_id?: number | null;
  empresa_id?: number | null;
}

export interface SaleDetail {
  id: number;
  venta_id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  usuario: string;
  tipo: SaleUnit;
  created_at?: string;
  ventas: Sale; // For joins
  sede_id?: number | null;
  empresa_id?: number | null;
}

export interface SaleDetailItem {
  id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  tipo: SaleUnit;
}

export interface Client {
  id: number;
  nombres: string;
  dni?: string | null;
  nacimiento?: string | null; // ISO 8601 YYYY-MM-DD
  lugar_nacimiento?: string | null;
  celular?: string | null;
  puntos?: number | null;
  sede_id?: number | null;
  empresa_id?: number | null;
}

export interface Proveedor {
    id: number;
    nombre: string;
    ruc?: string | null;
    nombre_contacto?: string | null;
    cel1?: string | null;
    cel2?: string | null;
    direccion?: string | null;
    email?: string | null;
    created_at?: string;
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface Empresa {
    id: number;
    nombre: string;
    ruc?: string | null;
    direccion?: string | null;
    telefono?: string | null;
    created_at?: string;
}

export interface Usuario {
    id: string; // Corresponds to auth.users.id (UUID)
    nombres: string;
    apellidos: string;
    nacimiento?: string | null;
    dni: string;
    role_id: number;
    cel?: string | null;
    email: string;
    created_at?: string;
    sede_id?: number | null;
    empresa_id?: number | null;
    avatar_url?: string | null;
    // For UI joins
    sedes?: Sede | null;
    empresas?: Empresa | null;
}

export interface Categoria {
    id: number;
    nombre: string;
    parent_id?: number | null;
    descripcion?: string | null;
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface Cargo {
    id: number;
    nombre: string;
}

export interface Caja {
    id: number;
    usuario?: string | null;
    f_apertura?: string | null;
    f_cierre?: string | null;
    monto_apertura?: number | null;
    monto_sistema?: number | null;
    monto_fisico?: number | null;
    monto_sobrante?: number | null;
    monto_faltante?: number | null;
    estado: string;
    monto_yape?: number | null;
    monto_transferencia?: number | null;
    monto_otros?: number | null;
    monto_efectivo?: number | null;
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface Promocion {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    multiplicador?: number | null;
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface ProductoCanje {
    id: number;
    id_promo: number;
    nombre: string;
    puntos_requeridos: number;
    fecha_vencimiento?: string | null;
    stock?: number | null;
    estado?: string | null;
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface HistorialCanje {
    id: number;
    cliente_id?: number | null;
    cliente?: string | null;
    producto_id: number;
    producto: string;
    fecha?: string | null;
    usuario: string;
    puntos_gastados: number;
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface Ingreso {
    id: number;
    usuario: string;
    numero_factura?: string | null;
    proveedor: string;
    observaciones?: string | null;
    producto: string;
    cantidad: number; // This represents total units entered
    precio_compra: number; // This is the cost per unit
    unidades: number; // This seems redundant with cantidad, but we will fill it for consistency
    porcentaje_venta?: number | null;
    f_ingreso?: string | null;
    f_vencimiento?: string | null;
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface OrdenCompraDetalle {
    id?: number;
    orden_id: number;
    producto_id: number;
    producto_nombre: string;
    unidades: number;
    costo_unitario_estimado: number;
    subtotal: number; // UI calculated field
}

export interface OrdenCompra {
    id: number;
    proveedor: string;
    fecha_pedido?: string | null;
    estado?: 'Borrador' | 'Enviada' | 'Recibida Parcial' | 'Recibida Completa' | 'Cancelada' | string;
    usuario?: string | null;
    created_at?: string;
    orden_compra_detalle?: OrdenCompraDetalle[]; // Fetched separately
    sede_id?: number | null;
    empresa_id?: number | null;
}


export type SaleUnit = 'Unidad' | 'Blister' | 'Caja' | 'Paquete';

export interface CartItem extends Product {
    cantidad: number;
    subtotal: number;
    selectedUnit: SaleUnit;
    price: number;
    unitsPerSelection: number;
    detail_id?: number;
    producto_nombre?: string;
    isRedeemed?: boolean;
    pointsCost?: number;
}


export interface SalesData {
  name: string;
  ventas: number;
}

export interface TableData {
  headers: string[];
  rows: (string | number | null)[][];
}

export interface AIResponse {
  displayText: string;
  table?: TableData;
  suggestions?: string[];
}

export interface ExtractedImageInfo {
    nombre?: string | null;
    laboratorio?: string | null;
    lote?: string | null;
    f_vencimiento?: string | null;
    principio_activo?: string | null;
    textos_extraidos?: string[];
}

export interface Notification {
  id: number;
  tipo: 'stock_bajo' | 'vencimiento_proximo' | 'venta_grande' | 'nuevo_cliente' | 'producto_vencido' | string;
  mensaje: string;
  fecha_creacion: string;
  estado: 'leido' | 'no leido';
  referencia_id?: number | null;
  usuario_destino?: string | null;
  sede_id?: number | null;
  empresa_id?: number | null;
}

export interface CompletedSaleInfo {
  saleData: Sale;
  details: CartItem[];
  clientName: string;
  totals: {
    subtotal: number;
    totalDiscount: number;
    baseImponible: number;
    igv: number;
    redondeo: number;
    totalAPagar: number;
    vuelto: number;
  };
};

export interface ComboComponent {
    id?: number;
    combo_product_id: number;
    component_product_id: number;
    cantidad: number;
    productos?: { // for joins
        nombre: string;
    }
}

export interface Backorder {
    id: number;
    cliente_id?: number | null;
    cliente_nombre?: string | null;
    producto_nombre: string;
    cantidad: number;
    notas?: string | null;
    estado: 'Pendiente' | 'Notificado' | 'Completado';
    created_at?: string;
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface ComisionRegla {
    id: number;
    producto_id: number;
    tipo_comision: 'porcentaje' | 'monto_fijo';
    valor_comision: number;
    fecha_inicio: string;
    fecha_fin?: string | null;
    activa: boolean;
    created_at?: string;
    // For UI
    productos?: { nombre: string };
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface ComisionGenerada {
    id: number;
    venta_id: number;
    detalle_venta_id: number;
    usuario_id: number;
    producto_id: number;
    monto_comision: number;
    fecha_generacion: string;
    regla_id: number;
    // For UI joins
    ventas?: { id: number };
    productos?: { nombre: string };
    detalle_ventas?: { subtotal: number };
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface GastoCategoria {
    id: number;
    nombre: string;
    descripcion?: string | null;
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface Gasto {
    id: number;
    fecha: string;
    monto: number;
    descripcion: string;
    categoria_id: number;
    usuario_id?: number | null;
    created_at?: string;
    // For UI joins
    gastos_categorias?: {
        nombre: string;
    };
    usuarios?: {
        usuario: string;
    }
    sede_id?: number | null;
    empresa_id?: number | null;
}

export interface Sede {
    id: number;
    nombre: string;
    direccion?: string | null;
    telefono?: string | null;
    created_at?: string;
    empresa_id?: number | null;
}
