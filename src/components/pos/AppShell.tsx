"use client";

import { useEffect, useState } from "react";
import {
  cargarDatosDemoColombia,
  DEFAULT_STORE_CONFIG,
  exportarRespaldoJSON,
  getAbonosFiados,
  getClientesFiados,
  getProductos,
  getStoreConfig,
  getVentas,
  saveStoreConfig,
} from "@/lib/storage";
import type {
  AbonoFiado,
  ClienteFiado,
  PosSection,
  Producto,
  Venta,
} from "@/types/pos";
import { BottomNav } from "./BottomNav";
import { HeaderBar } from "./HeaderBar";
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

  const showStatus = (message: string) => {
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
    showStatus("Nombre de tienda guardado");
  };

  const handleCargarDemo = () => {
    const demo = cargarDatosDemoColombia();
    setProductos(demo.productos);
    setClientes(demo.clientes);
    setVentas(demo.ventas);
    setAbonos(demo.abonos);
    showStatus("Datos de prueba cargados (10 productos, 3 clientes)");
  };

  const handleExportarRespaldo = () => {
    exportarRespaldoJSON();
    showStatus("Respaldo JSON descargado");
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

        <main className="min-w-0 flex-1 px-3 py-4 pb-24 sm:px-6 md:pb-8">
          {activeSection === "caja" && (
            <CajaView productos={productos} onCargarDemo={handleCargarDemo} />
          )}
          {activeSection === "fiaos" && (
            <FiaosView clientes={clientes} onCargarDemo={handleCargarDemo} />
          )}
          {activeSection === "inventario" && (
            <InventarioView
              productos={productos}
              onCargarDemo={handleCargarDemo}
            />
          )}
          {activeSection === "resumen" && (
            <ResumenView
              productos={productos}
              clientes={clientes}
              ventas={ventas}
              abonos={abonos}
            />
          )}
        </main>
      </div>
    </div>
  );
}
