"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  actualizarProducto,
  cargarDatosDemoColombia,
  crearClienteFiado,
  crearProducto,
  DEFAULT_STORE_CONFIG,
  exportarRespaldoJSON,
  getAbonosFiados,
  getClientesFiados,
  getProductos,
  getStoreConfig,
  getVentas,
  importarRespaldoJSON,
  registrarAbono,
  registrarVenta,
  reponerStockProducto,
  saveStoreConfig,
  type RegistrarVentaInput,
} from "@/lib/storage";
import type {
  AbonoFiado,
  ClienteFiado,
  MetodoAbono,
  PosSection,
  Producto,
  Venta,
} from "@/types/pos";
import { BottomNav } from "./BottomNav";
import { HeaderBar } from "./HeaderBar";
import { ToastBanner, type ToastMessage, type ToastType } from "./ToastBanner";
import { CajaView } from "./views/CajaView";
import { FiaosView } from "./views/FiaosView";
import { InventarioView } from "./views/InventarioView";
import { ResumenView } from "./views/ResumenView";

export function AppShell() {
  const [activeSection, setActiveSection] = useState<PosSection>("caja");
  const [nombreTienda, setNombreTienda] = useState<string>(
    DEFAULT_STORE_CONFIG.nombreTienda
  );
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<ClienteFiado[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [abonos, setAbonos] = useState<AbonoFiado[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const syncFromStorage = () => {
      const config = getStoreConfig();
      setNombreTienda(config.nombreTienda);
      setProductos(getProductos());
      setClientes(getClientesFiados());
      setVentas(getVentas());
      setAbonos(getAbonosFiados());
    };
    syncFromStorage();
  }, []);

  const notify = useCallback((type: ToastType, text: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    const id = Date.now();
    setToast({ id, type, text });
    toastTimerRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3800);
  }, []);

  const showHeaderStatus = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => {
      setStatusMessage((current) => (current === message ? null : current));
    }, 3500);
  };

  const handleSaveNombreTienda = (nuevoNombre: string) => {
    const saved = saveStoreConfig({
      nombreTienda: nuevoNombre,
      actualizadoEn: new Date().toISOString(),
    });
    setNombreTienda(saved.nombreTienda);
    showHeaderStatus("Nombre actualizado");
    notify("success", `Nombre de tienda guardado: "${saved.nombreTienda}".`);
  };

  const handleCargarDemo = () => {
    const demo = cargarDatosDemoColombia();
    setProductos(demo.productos);
    setClientes(demo.clientes);
    setVentas(demo.ventas);
    setAbonos(demo.abonos);
    showHeaderStatus("Datos demo cargados");
    notify("success", "Datos de prueba cargados (10 productos, 3 clientes).");
  };

  const handleExportarRespaldo = () => {
    exportarRespaldoJSON();
    showHeaderStatus("Respaldo descargado");
    notify("success", "Respaldo JSON descargado.");
  };

  const handleImportarRespaldo = (contenidoTexto: string) => {
    const result = importarRespaldoJSON(contenidoTexto);
    if (!result.ok) {
      notify("error", result.error);
      return;
    }
    setNombreTienda(result.data.config.nombreTienda);
    setProductos(result.data.productos);
    setClientes(result.data.clientes);
    setVentas(result.data.ventas);
    setAbonos(result.data.abonos);
    showHeaderStatus("Respaldo restaurado");
    notify(
      "success",
      `Respaldo importado (${result.data.productos.length} productos, ${result.data.clientes.length} clientes).`
    );
  };

  // --- Transacciones reactivas sincronizadas ---

  const handleRegistrarVenta = (ventaData: RegistrarVentaInput) => {
    const result = registrarVenta(ventaData);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setProductos(result.productos);
    setClientes(result.clientes);
    setVentas(result.ventas);
    return { ok: true };
  };

  const handleRegistrarAbono = (
    clienteId: string,
    monto: number,
    metodoPago: MetodoAbono
  ) => {
    const result = registrarAbono(clienteId, monto, metodoPago);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setClientes(result.clientes);
    setAbonos(result.abonos);
    return { ok: true };
  };

  const handleCrearCliente = (data: {
    nombre: string;
    telefono: string;
    cupoMaximo: number;
  }) => {
    const actualizados = crearClienteFiado(data);
    setClientes(actualizados);
  };

  const handleCrearProducto = (data: Omit<Producto, "id">) => {
    const actualizados = crearProducto(data);
    setProductos(actualizados);
  };

  const handleActualizarProducto = (
    id: string,
    patch: Partial<Omit<Producto, "id">>
  ) => {
    const actualizados = actualizarProducto(id, patch);
    setProductos(actualizados);
  };

  const handleReponerStock = (id: string, delta: number) => {
    const actualizados = reponerStockProducto(id, delta);
    setProductos(actualizados);
  };

  const stockBajoCount = productos.filter((p) => p.stock <= p.stockMinimo).length;
  const fiaosActivosCount = clientes.filter((c) => c.saldoDeuda > 0).length;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <HeaderBar
        nombreTienda={nombreTienda}
        onSaveNombreTienda={handleSaveNombreTienda}
        onCargarDemo={handleCargarDemo}
        onExportarRespaldo={handleExportarRespaldo}
        onImportarRespaldo={handleImportarRespaldo}
        statusMessage={statusMessage}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-1">
        <BottomNav
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          badges={{
            inventario: stockBajoCount,
            fiaos: fiaosActivosCount,
          }}
        />

        <main className="min-w-0 flex-1 px-3 py-4 pb-36 sm:px-6 md:pb-8">
          {activeSection === "caja" && (
            <CajaView
              nombreTienda={nombreTienda}
              productos={productos}
              clientes={clientes}
              onRegistrarVenta={handleRegistrarVenta}
              onCargarDemo={handleCargarDemo}
              onNotify={notify}
            />
          )}
          {activeSection === "fiaos" && (
            <FiaosView
              nombreTienda={nombreTienda}
              clientes={clientes}
              ventas={ventas}
              onCrearCliente={handleCrearCliente}
              onRegistrarAbono={handleRegistrarAbono}
              onCargarDemo={handleCargarDemo}
              onNotify={notify}
            />
          )}
          {activeSection === "inventario" && (
            <InventarioView
              productos={productos}
              onCrearProducto={handleCrearProducto}
              onActualizarProducto={handleActualizarProducto}
              onReponerStock={handleReponerStock}
              onCargarDemo={handleCargarDemo}
              onNotify={notify}
            />
          )}
          {activeSection === "resumen" && (
            <ResumenView
              productos={productos}
              clientes={clientes}
              ventas={ventas}
              abonos={abonos}
              onCargarDemo={handleCargarDemo}
            />
          )}
        </main>
      </div>

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
