import type {
  AbonoFiado,
  ClienteFiado,
  MetodoAbono,
  PosBackupData,
  Producto,
  StoreConfig,
  Venta,
} from '@/types/pos';

const STORAGE_KEYS = {
  CONFIG: 'fiaocontrol:v1:config',
  PRODUCTOS: 'fiaocontrol:v1:productos',
  CLIENTES: 'fiaocontrol:v1:clientes',
  VENTAS: 'fiaocontrol:v1:ventas',
  ABONOS: 'fiaocontrol:v1:abonos',
} as const;

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  nombreTienda: 'Tienda El Progreso',
  actualizadoEn: new Date().toISOString(),
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function generateId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${Date.now()}-${randomPart}`;
}

function readFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeToStorage<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// --- Configuración de la tienda ---

export function getStoreConfig(): StoreConfig {
  return readFromStorage<StoreConfig>(STORAGE_KEYS.CONFIG, DEFAULT_STORE_CONFIG);
}

export function saveStoreConfig(config: StoreConfig): StoreConfig {
  const updated: StoreConfig = {
    nombreTienda: config.nombreTienda.trim() || DEFAULT_STORE_CONFIG.nombreTienda,
    actualizadoEn: new Date().toISOString(),
  };
  writeToStorage(STORAGE_KEYS.CONFIG, updated);
  return updated;
}

// --- Productos ---

export function getProductos(): Producto[] {
  return readFromStorage<Producto[]>(STORAGE_KEYS.PRODUCTOS, []);
}

export function saveProductos(productos: Producto[]): void {
  writeToStorage(STORAGE_KEYS.PRODUCTOS, productos);
}

export function crearProducto(data: Omit<Producto, 'id'>): Producto[] {
  const productos = getProductos();
  const nuevo: Producto = {
    ...data,
    id: generateId('prod'),
    nombre: data.nombre.trim(),
    categoria: data.categoria.trim() || 'Otros',
    precioVenta: Math.max(0, Math.round(data.precioVenta)),
    costo: Math.max(0, Math.round(data.costo)),
    stock: Math.max(0, Math.round(data.stock)),
    stockMinimo: Math.max(0, Math.round(data.stockMinimo)),
  };
  const actualizados = [nuevo, ...productos];
  saveProductos(actualizados);
  return actualizados;
}

export function actualizarProducto(
  id: string,
  patch: Partial<Omit<Producto, 'id'>>
): Producto[] {
  const productos = getProductos();
  const actualizados = productos.map((p) => {
    if (p.id !== id) return p;
    return {
      ...p,
      ...patch,
      nombre: patch.nombre !== undefined ? patch.nombre.trim() : p.nombre,
      categoria: patch.categoria !== undefined ? patch.categoria.trim() || 'Otros' : p.categoria,
      precioVenta:
        patch.precioVenta !== undefined
          ? Math.max(0, Math.round(patch.precioVenta))
          : p.precioVenta,
      costo: patch.costo !== undefined ? Math.max(0, Math.round(patch.costo)) : p.costo,
      stock: patch.stock !== undefined ? Math.max(0, Math.round(patch.stock)) : p.stock,
      stockMinimo:
        patch.stockMinimo !== undefined
          ? Math.max(0, Math.round(patch.stockMinimo))
          : p.stockMinimo,
    };
  });
  saveProductos(actualizados);
  return actualizados;
}

export function reponerStockProducto(id: string, cantidadDelta: number): Producto[] {
  const productos = getProductos();
  const actualizados = productos.map((p) => {
    if (p.id !== id) return p;
    return {
      ...p,
      stock: Math.max(0, p.stock + Math.round(cantidadDelta)),
    };
  });
  saveProductos(actualizados);
  return actualizados;
}

// --- Clientes Fiados ---

export function getClientesFiados(): ClienteFiado[] {
  return readFromStorage<ClienteFiado[]>(STORAGE_KEYS.CLIENTES, []);
}

export function saveClientesFiados(clientes: ClienteFiado[]): void {
  writeToStorage(STORAGE_KEYS.CLIENTES, clientes);
}

export function crearClienteFiado(
  data: Omit<ClienteFiado, 'id' | 'saldoDeuda' | 'ultimaActividad'>
): ClienteFiado[] {
  const clientes = getClientesFiados();
  const nuevo: ClienteFiado = {
    id: generateId('cli'),
    nombre: data.nombre.trim(),
    telefono: data.telefono.replace(/\D/g, ''),
    cupoMaximo: Math.max(0, Math.round(data.cupoMaximo)),
    saldoDeuda: 0,
    ultimaActividad: new Date().toISOString(),
  };
  const actualizados = [nuevo, ...clientes];
  saveClientesFiados(actualizados);
  return actualizados;
}

// --- Ventas ---

export function getVentas(): Venta[] {
  return readFromStorage<Venta[]>(STORAGE_KEYS.VENTAS, []);
}

export function saveVentas(ventas: Venta[]): void {
  writeToStorage(STORAGE_KEYS.VENTAS, ventas);
}

export type RegistrarVentaInput = Omit<Venta, 'id' | 'fecha'>;

export type RegistrarVentaResult =
  | {
      ok: true;
      venta: Venta;
      productos: Producto[];
      clientes: ClienteFiado[];
      ventas: Venta[];
    }
  | {
      ok: false;
      error: string;
    };

export function registrarVenta(ventaData: RegistrarVentaInput): RegistrarVentaResult {
  if (!ventaData.items || ventaData.items.length === 0) {
    return { ok: false, error: 'El carrito está vacío.' };
  }

  const productos = getProductos();
  const clientes = getClientesFiados();
  const ventas = getVentas();

  // Verificar stock disponible de cada ítem
  for (const item of ventaData.items) {
    const prod = productos.find((p) => p.id === item.productoId);
    if (!prod) {
      return { ok: false, error: `El producto "${item.nombre}" ya no existe.` };
    }
    if (item.cantidad <= 0) {
      return { ok: false, error: `Cantidad inválida para "${item.nombre}".` };
    }
    if (prod.stock < item.cantidad) {
      return {
        ok: false,
        error: `Stock insuficiente para "${prod.nombre}" (disponible: ${prod.stock}).`,
      };
    }
  }

  // Verificar cupo si es Fiado
  if (ventaData.metodoPago === 'Fiado') {
    if (!ventaData.clienteId) {
      return { ok: false, error: 'Selecciona un cliente para registrar el fiado.' };
    }
    const cliente = clientes.find((c) => c.id === ventaData.clienteId);
    if (!cliente) {
      return { ok: false, error: 'Cliente de fiado no encontrado.' };
    }
    if (cliente.saldoDeuda + ventaData.total > cliente.cupoMaximo) {
      return {
        ok: false,
        error: `El monto supera el cupo disponible de ${cliente.nombre}.`,
      };
    }
  }

  const ahoraIso = new Date().toISOString();

  // Enriquecer costoUnitario para cálculo histórico de ganancia
  const itemsConCosto = ventaData.items.map((item) => {
    const prod = productos.find((p) => p.id === item.productoId);
    return {
      ...item,
      costoUnitario: item.costoUnitario ?? prod?.costo ?? 0,
    };
  });

  const nuevaVenta: Venta = {
    id: generateId('vta'),
    fecha: ahoraIso,
    items: itemsConCosto,
    total: Math.round(ventaData.total),
    metodoPago: ventaData.metodoPago,
    ...(ventaData.clienteId ? { clienteId: ventaData.clienteId } : {}),
  };

  // Descontar stock
  const productosActualizados = productos.map((prod) => {
    const vendido = itemsConCosto
      .filter((i) => i.productoId === prod.id)
      .reduce((acc, i) => acc + i.cantidad, 0);
    if (vendido === 0) return prod;
    return {
      ...prod,
      stock: Math.max(0, prod.stock - vendido),
    };
  });

  // Actualizar deuda si es fiado
  const clientesActualizados =
    ventaData.metodoPago === 'Fiado' && ventaData.clienteId
      ? clientes.map((cli) => {
          if (cli.id !== ventaData.clienteId) return cli;
          return {
            ...cli,
            saldoDeuda: cli.saldoDeuda + nuevaVenta.total,
            ultimaActividad: ahoraIso,
          };
        })
      : clientes;

  const ventasActualizadas = [nuevaVenta, ...ventas];

  saveProductos(productosActualizados);
  saveClientesFiados(clientesActualizados);
  saveVentas(ventasActualizadas);

  return {
    ok: true,
    venta: nuevaVenta,
    productos: productosActualizados,
    clientes: clientesActualizados,
    ventas: ventasActualizadas,
  };
}

// --- Abonos de Fiados ---

export function getAbonosFiados(): AbonoFiado[] {
  return readFromStorage<AbonoFiado[]>(STORAGE_KEYS.ABONOS, []);
}

export function saveAbonosFiados(abonos: AbonoFiado[]): void {
  writeToStorage(STORAGE_KEYS.ABONOS, abonos);
}

export type RegistrarAbonoResult =
  | {
      ok: true;
      abono: AbonoFiado;
      clientes: ClienteFiado[];
      abonos: AbonoFiado[];
    }
  | {
      ok: false;
      error: string;
    };

export function registrarAbono(
  clienteId: string,
  monto: number,
  metodoPago: MetodoAbono
): RegistrarAbonoResult {
  const montoLimpio = Math.round(monto);
  if (!Number.isFinite(montoLimpio) || montoLimpio <= 0) {
    return { ok: false, error: 'Ingresa un monto de abono válido mayor a $ 0.' };
  }

  const clientes = getClientesFiados();
  const cliente = clientes.find((c) => c.id === clienteId);
  if (!cliente) {
    return { ok: false, error: 'Cliente no encontrado.' };
  }

  if (cliente.saldoDeuda <= 0) {
    return { ok: false, error: 'Este cliente no tiene saldo pendiente.' };
  }

  const montoAplicado = Math.min(montoLimpio, cliente.saldoDeuda);
  const ahoraIso = new Date().toISOString();

  const nuevoAbono: AbonoFiado = {
    id: generateId('abn'),
    clienteId,
    fecha: ahoraIso,
    monto: montoAplicado,
    metodoPago,
  };

  const clientesActualizados = clientes.map((cli) => {
    if (cli.id !== clienteId) return cli;
    return {
      ...cli,
      saldoDeuda: Math.max(0, cli.saldoDeuda - montoAplicado),
      ultimaActividad: ahoraIso,
    };
  });

  const abonosActualizados = [nuevoAbono, ...getAbonosFiados()];

  saveClientesFiados(clientesActualizados);
  saveAbonosFiados(abonosActualizados);

  return {
    ok: true,
    abono: nuevoAbono,
    clientes: clientesActualizados,
    abonos: abonosActualizados,
  };
}

// --- Respaldo JSON ---

export function exportarRespaldoJSON(): PosBackupData {
  const backup: PosBackupData = {
    version: 1,
    exportadoEn: new Date().toISOString(),
    config: getStoreConfig(),
    productos: getProductos(),
    clientes: getClientesFiados(),
    ventas: getVentas(),
    abonos: getAbonosFiados(),
  };

  if (isBrowser()) {
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `fiaocontrol-respaldo-${fechaArchivo}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return backup;
}

// --- Datos Demo Colombia ---

export interface DemoDataResult {
  productos: Producto[];
  clientes: ClienteFiado[];
  ventas: Venta[];
  abonos: AbonoFiado[];
}

export function cargarDatosDemoColombia(): DemoDataResult {
  const ahora = new Date();
  const hace2Horas = new Date(ahora.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const ayer = new Date(ahora.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const hace3Dias = new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const productos: Producto[] = [
    {
      id: 'prod-arroz-diana-1kg',
      nombre: 'Arroz Diana x 1 kg',
      categoria: 'Abarrotes',
      precioVenta: 4800,
      costo: 3900,
      stock: 24,
      stockMinimo: 6,
    },
    {
      id: 'prod-aceite-gourmet-1l',
      nombre: 'Aceite Gourmet x 1 L',
      categoria: 'Abarrotes',
      precioVenta: 13500,
      costo: 11200,
      stock: 10,
      stockMinimo: 4,
    },
    {
      id: 'prod-huevos-aa-30',
      nombre: 'Huevos AA Cubeta x 30',
      categoria: 'Lácteos y Huevos',
      precioVenta: 17500,
      costo: 14800,
      stock: 5,
      stockMinimo: 6,
    },
    {
      id: 'prod-gaseosa-postobon-15l',
      nombre: 'Gaseosa Postobón Manzana 1.5 L',
      categoria: 'Bebidas',
      precioVenta: 5500,
      costo: 4200,
      stock: 18,
      stockMinimo: 6,
    },
    {
      id: 'prod-pan-tajado-bimbo',
      nombre: 'Pan Tajado Bimbo Blanco 600 g',
      categoria: 'Panadería',
      precioVenta: 7800,
      costo: 6300,
      stock: 4,
      stockMinimo: 5,
    },
    {
      id: 'prod-leche-alqueria-1100',
      nombre: 'Leche Alquería Entera 1.1 L',
      categoria: 'Lácteos y Huevos',
      precioVenta: 5200,
      costo: 4300,
      stock: 16,
      stockMinimo: 6,
    },
    {
      id: 'prod-cafe-sello-rojo-250g',
      nombre: 'Café Sello Rojo Molido 250 g',
      categoria: 'Abarrotes',
      precioVenta: 10900,
      costo: 8900,
      stock: 11,
      stockMinimo: 4,
    },
    {
      id: 'prod-panela-redonda-500g',
      nombre: 'Panela Valluna Redonda x 500 g',
      categoria: 'Abarrotes',
      precioVenta: 3200,
      costo: 2400,
      stock: 20,
      stockMinimo: 6,
    },
    {
      id: 'prod-detergente-fab-500g',
      nombre: 'Detergente Fab Limón 500 g',
      categoria: 'Aseo',
      precioVenta: 6400,
      costo: 5000,
      stock: 3,
      stockMinimo: 5,
    },
    {
      id: 'prod-papas-margarita-105g',
      nombre: 'Papas Margarita Pollo 105 g',
      categoria: 'Snacks',
      precioVenta: 4500,
      costo: 3400,
      stock: 14,
      stockMinimo: 5,
    },
  ];

  const clientes: ClienteFiado[] = [
    {
      id: 'cli-dona-martha',
      nombre: 'Martha Lucía Gómez',
      telefono: '3104589210',
      cupoMaximo: 150000,
      saldoDeuda: 48500,
      ultimaActividad: hace2Horas,
    },
    {
      id: 'cli-don-carlos',
      nombre: 'Carlos Alberto Ruiz',
      telefono: '3208123405',
      cupoMaximo: 100000,
      saldoDeuda: 82000,
      ultimaActividad: ayer,
    },
    {
      id: 'cli-andrea-torres',
      nombre: 'Andrea Torres Mejía',
      telefono: '3156397741',
      cupoMaximo: 80000,
      saldoDeuda: 0,
      ultimaActividad: hace3Dias,
    },
  ];

  const ventas: Venta[] = [
    {
      id: 'vta-demo-001',
      fecha: hace2Horas,
      items: [
        {
          productoId: 'prod-arroz-diana-1kg',
          nombre: 'Arroz Diana x 1 kg',
          cantidad: 2,
          precioUnitario: 4800,
          costoUnitario: 3900,
          subtotal: 9600,
        },
        {
          productoId: 'prod-huevos-aa-30',
          nombre: 'Huevos AA Cubeta x 30',
          cantidad: 1,
          precioUnitario: 17500,
          costoUnitario: 14800,
          subtotal: 17500,
        },
      ],
      total: 27100,
      metodoPago: 'Efectivo',
    },
    {
      id: 'vta-demo-002',
      fecha: ayer,
      items: [
        {
          productoId: 'prod-aceite-gourmet-1l',
          nombre: 'Aceite Gourmet x 1 L',
          cantidad: 1,
          precioUnitario: 13500,
          costoUnitario: 11200,
          subtotal: 13500,
        },
        {
          productoId: 'prod-leche-alqueria-1100',
          nombre: 'Leche Alquería Entera 1.1 L',
          cantidad: 2,
          precioUnitario: 5200,
          costoUnitario: 4300,
          subtotal: 10400,
        },
      ],
      total: 23900,
      metodoPago: 'Fiado',
      clienteId: 'cli-dona-martha',
    },
  ];

  const abonos: AbonoFiado[] = [
    {
      id: 'abn-demo-001',
      clienteId: 'cli-andrea-torres',
      fecha: hace3Dias,
      monto: 25000,
      metodoPago: 'Nequi',
    },
  ];

  saveProductos(productos);
  saveClientesFiados(clientes);
  saveVentas(ventas);
  saveAbonosFiados(abonos);

  return { productos, clientes, ventas, abonos };
}
