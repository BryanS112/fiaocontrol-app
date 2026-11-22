export type MetodoPago = 'Efectivo' | 'Nequi' | 'Daviplata' | 'Fiado';

export type MetodoAbono = Exclude<MetodoPago, 'Fiado'>;

export type CategoriaProducto =
  | 'Abarrotes'
  | 'Lácteos y Huevos'
  | 'Bebidas'
  | 'Panadería'
  | 'Aseo'
  | 'Snacks'
  | 'Otros';

export interface Producto {
  id: string;
  nombre: string;
  categoria: CategoriaProducto | string;
  precioVenta: number;
  costo: number;
  stock: number;
  stockMinimo: number;
}

export interface ClienteFiado {
  id: string;
  nombre: string;
  telefono: string;
  cupoMaximo: number;
  saldoDeuda: number;
  ultimaActividad: string; // ISO 8601
}

export interface ItemVenta {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  fecha: string; // ISO 8601
  items: ItemVenta[];
  total: number;
  metodoPago: MetodoPago;
  clienteId?: string;
}

export interface AbonoFiado {
  id: string;
  clienteId: string;
  fecha: string; // ISO 8601
  monto: number;
  metodoPago: MetodoAbono;
}

export interface StoreConfig {
  nombreTienda: string;
  actualizadoEn: string; // ISO 8601
}

export interface PosBackupData {
  version: number;
  exportadoEn: string; // ISO 8601
  config: StoreConfig;
  productos: Producto[];
  clientes: ClienteFiado[];
  ventas: Venta[];
  abonos: AbonoFiado[];
}

export type PosSection = 'caja' | 'fiaos' | 'inventario' | 'resumen';
