"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  Banknote,
  BarChart3,
  BookUser,
  Calendar,
  Database,
  Receipt,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { formatCOP, formatFechaHora, formatHora } from "@/lib/formatters";
import type { AbonoFiado, ClienteFiado, Producto, Venta } from "@/types/pos";

interface ResumenViewProps {
  productos: Producto[];
  clientes: ClienteFiado[];
  ventas: Venta[];
  abonos: AbonoFiado[];
  onCargarDemo: () => void;
}

function getLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameLocalDate(isoString: string, yyyyMmDd: string): boolean {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return false;
  return getLocalDateInputValue(d) === yyyyMmDd;
}

type MovimientoCronologico =
  | {
      kind: "venta";
      id: string;
      fecha: string;
      titulo: string;
      metodoPago: string;
      monto: number;
      esFiado: boolean;
    }
  | {
      kind: "abono";
      id: string;
      fecha: string;
      titulo: string;
      metodoPago: string;
      monto: number;
      esFiado: false;
    };

export function ResumenView({
  productos,
  clientes,
  ventas,
  abonos,
  onCargarDemo,
}: ResumenViewProps) {
  const [fechaFiltro, setFechaFiltro] = useState<string>(() =>
    getLocalDateInputValue()
  );
  const [verTodo, setVerTodo] = useState(false);

  const ventasFiltradas = useMemo(() => {
    if (verTodo) return ventas;
    return ventas.filter((v) => isSameLocalDate(v.fecha, fechaFiltro));
  }, [ventas, fechaFiltro, verTodo]);

  const abonosFiltrados = useMemo(() => {
    if (verTodo) return abonos;
    return abonos.filter((a) => isSameLocalDate(a.fecha, fechaFiltro));
  }, [abonos, fechaFiltro, verTodo]);

  const metricas = useMemo(() => {
    const ventasTotales = ventasFiltradas.reduce((acc, v) => acc + v.total, 0);

    const ventasEfectivo = ventasFiltradas
      .filter((v) => v.metodoPago === "Efectivo")
      .reduce((acc, v) => acc + v.total, 0);
    const abonosEfectivo = abonosFiltrados
      .filter((a) => a.metodoPago === "Efectivo")
      .reduce((acc, a) => acc + a.monto, 0);
    const dineroEfectivo = ventasEfectivo + abonosEfectivo;

    const ventasDigital = ventasFiltradas
      .filter((v) => v.metodoPago === "Nequi" || v.metodoPago === "Daviplata")
      .reduce((acc, v) => acc + v.total, 0);
    const abonosDigital = abonosFiltrados
      .filter((a) => a.metodoPago === "Nequi" || a.metodoPago === "Daviplata")
      .reduce((acc, a) => acc + a.monto, 0);
    const transferencias = ventasDigital + abonosDigital;

    const nuevoFiado = ventasFiltradas
      .filter((v) => v.metodoPago === "Fiado")
      .reduce((acc, v) => acc + v.total, 0);

    const gananciaNeta = ventasFiltradas.reduce((accVenta, venta) => {
      const gananciaItems = venta.items.reduce((accItem, item) => {
        const prod = productos.find((p) => p.id === item.productoId);
        const costoUnit = item.costoUnitario ?? prod?.costo ?? 0;
        return accItem + (item.precioUnitario - costoUnit) * item.cantidad;
      }, 0);
      return accVenta + gananciaItems;
    }, 0);

    const baseDistribucion = dineroEfectivo + transferencias + nuevoFiado;
    const pctEfectivo =
      baseDistribucion > 0
        ? Math.round((dineroEfectivo / baseDistribucion) * 100)
        : 0;
    const pctTransferencias =
      baseDistribucion > 0
        ? Math.round((transferencias / baseDistribucion) * 100)
        : 0;
    const pctFiado =
      baseDistribucion > 0
        ? Math.max(0, 100 - pctEfectivo - pctTransferencias)
        : 0;

    return {
      ventasTotales,
      dineroEfectivo,
      transferencias,
      nuevoFiado,
      gananciaNeta,
      baseDistribucion,
      pctEfectivo,
      pctTransferencias,
      pctFiado,
    };
  }, [ventasFiltradas, abonosFiltrados, productos]);

  const historialCronologico = useMemo<MovimientoCronologico[]>(() => {
    const listaVentas: MovimientoCronologico[] = ventasFiltradas.map((v) => {
      const cliente = v.clienteId
        ? clientes.find((c) => c.id === v.clienteId)
        : undefined;
      const resumenItems = v.items
        .map((i) => `${i.cantidad}x ${i.nombre}`)
        .join(", ");
      return {
        kind: "venta",
        id: v.id,
        fecha: v.fecha,
        titulo: cliente ? `${resumenItems} (${cliente.nombre})` : resumenItems,
        metodoPago: v.metodoPago,
        monto: v.total,
        esFiado: v.metodoPago === "Fiado",
      };
    });

    const listaAbonos: MovimientoCronologico[] = abonosFiltrados.map((a) => {
      const cliente = clientes.find((c) => c.id === a.clienteId);
      return {
        kind: "abono",
        id: a.id,
        fecha: a.fecha,
        titulo: `Abono fiado · ${cliente?.nombre ?? "Cliente"}`,
        metodoPago: a.metodoPago,
        monto: a.monto,
        esFiado: false,
      };
    });

    return [...listaVentas, ...listaAbonos].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [ventasFiltradas, abonosFiltrados, clientes]);

  const hoy = getLocalDateInputValue();

  return (
    <section aria-labelledby="resumen-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="resumen-heading" className="text-lg font-extrabold tracking-tight text-foreground">
            Cierre de caja y ganancia
          </h2>
          <p className="text-xs font-medium text-text-muted sm:text-sm">
            {verTodo
              ? "Mostrando todo el historial acumulado."
              : fechaFiltro === hoy
                ? "Resumen de operaciones de hoy."
                : `Resumen del ${fechaFiltro}.`}
          </p>
        </div>

        {/* Filtro por fecha */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => {
                setVerTodo(false);
                setFechaFiltro(e.target.value || hoy);
              }}
              aria-label="Filtrar cierre por fecha"
              className="pos-card h-10 rounded-xl pr-3 pl-9 text-xs font-bold text-foreground outline-none focus:border-emerald-pos"
            />
          </div>

          <button
            type="button"
            onClick={() => setVerTodo((prev) => !prev)}
            className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-bold transition-all active:scale-[0.98] ${
              verTodo
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "pos-card text-foreground hover:bg-surface-muted"
            }`}
          >
            {verTodo ? "Solo hoy" : "Ver todo"}
          </button>
        </div>
      </div>

      {/* Barra visual comparativa de distribución de ingresos */}
      <div className="pos-card rounded-2xl p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Distribución de ingresos
          </span>
          <span className="tabular-nums text-xs font-bold text-foreground">
            {formatCOP(metricas.baseDistribucion)}
          </span>
        </div>

        {metricas.baseDistribucion === 0 ? (
          <div className="h-3 w-full rounded-full bg-surface-muted" />
        ) : (
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted">
            {metricas.pctEfectivo > 0 ? (
              <div
                style={{ width: `${metricas.pctEfectivo}%` }}
                className="bg-emerald-500 transition-all"
                title={`Efectivo: ${metricas.pctEfectivo}%`}
              />
            ) : null}
            {metricas.pctTransferencias > 0 ? (
              <div
                style={{ width: `${metricas.pctTransferencias}%` }}
                className="bg-sky-500 transition-all"
                title={`Transferencias: ${metricas.pctTransferencias}%`}
              />
            ) : null}
            {metricas.pctFiado > 0 ? (
              <div
                style={{ width: `${metricas.pctFiado}%` }}
                className="bg-amber-500 transition-all"
                title={`Fiado: ${metricas.pctFiado}%`}
              />
            ) : null}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Efectivo <strong className="tabular-nums text-foreground">{metricas.pctEfectivo}%</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            Nequi / Daviplata{" "}
            <strong className="tabular-nums text-foreground">{metricas.pctTransferencias}%</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Fiado <strong className="tabular-nums text-foreground">{metricas.pctFiado}%</strong>
          </span>
        </div>
      </div>

      {/* Tarjetas KPI con contenedores suaves de iconos */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="pos-card rounded-2xl p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/10 text-slate-700 dark:text-zinc-300">
            <Receipt className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-xs font-semibold text-text-muted">
            Ventas totales
          </span>
          <p className="tabular-nums mt-0.5 text-xl font-extrabold tracking-tight text-foreground">
            {formatCOP(metricas.ventasTotales)}
          </p>
          <span className="tabular-nums mt-1 block text-[11px] text-text-muted">
            {ventasFiltradas.length}{" "}
            {ventasFiltradas.length === 1 ? "venta" : "ventas"}
          </span>
        </div>

        <div className="pos-card rounded-2xl p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Banknote className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-xs font-semibold text-text-muted">
            Dinero en efectivo
          </span>
          <p className="tabular-nums mt-0.5 text-xl font-extrabold tracking-tight text-emerald-pos">
            {formatCOP(metricas.dineroEfectivo)}
          </p>
          <span className="mt-1 block text-[11px] text-text-muted">
            Ventas + abonos
          </span>
        </div>

        <div className="pos-card rounded-2xl p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Smartphone className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-xs font-semibold text-text-muted">
            Nequi / Daviplata
          </span>
          <p className="tabular-nums mt-0.5 text-xl font-extrabold tracking-tight text-foreground">
            {formatCOP(metricas.transferencias)}
          </p>
          <span className="mt-1 block text-[11px] text-text-muted">
            Ventas + abonos
          </span>
        </div>

        <div className="pos-card rounded-2xl p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <BookUser className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-xs font-semibold text-text-muted">
            Nuevo fiado hoy
          </span>
          <p className="tabular-nums mt-0.5 text-xl font-extrabold tracking-tight text-coral-pos">
            {formatCOP(metricas.nuevoFiado)}
          </p>
          <span className="mt-1 block text-[11px] text-text-muted">
            A cartera por cobrar
          </span>
        </div>

        <div className="pos-card col-span-2 rounded-2xl p-4 lg:col-span-1">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-xs font-semibold text-text-muted">
            Ganancia neta est.
          </span>
          <p className="tabular-nums mt-0.5 text-xl font-extrabold tracking-tight text-emerald-pos">
            {formatCOP(metricas.gananciaNeta)}
          </p>
          <span className="mt-1 block text-[11px] text-text-muted">
            Venta menos costo
          </span>
        </div>
      </div>

      {/* Historial cronológico */}
      <div className="pos-card rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            Historial cronológico ({historialCronologico.length})
          </h3>
        </div>

        {historialCronologico.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-pos">
              <BarChart3 className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-foreground">
              Sin movimientos registrados
            </p>
            <p className="mt-1 max-w-sm text-xs text-text-muted">
              {ventas.length === 0 && abonos.length === 0
                ? "Registra tu primera venta en Caja o carga los datos de prueba para ver el cierre."
                : "No hay ventas ni abonos para la fecha seleccionada."}
            </p>
            {ventas.length === 0 && abonos.length === 0 ? (
              <button
                type="button"
                onClick={onCargarDemo}
                className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-[0.98]"
              >
                <Database className="h-4 w-4" aria-hidden="true" />
                Cargar datos de prueba
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {historialCronologico.map((mov) => (
              <li
                key={mov.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      mov.kind === "abono"
                        ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                        : "bg-surface-muted text-text-muted"
                    }`}
                  >
                    {mov.kind === "abono" ? (
                      <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Receipt className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {mov.titulo}
                    </p>
                    <p className="text-xs text-text-muted">
                      {verTodo ? formatFechaHora(mov.fecha) : formatHora(mov.fecha)} ·{" "}
                      <span className="font-semibold text-foreground">
                        {mov.metodoPago}
                      </span>
                    </p>
                  </div>
                </div>

                <span
                  className={`tabular-nums shrink-0 text-sm font-extrabold ${
                    mov.esFiado ? "text-coral-pos" : "text-emerald-pos"
                  }`}
                >
                  {formatCOP(mov.monto)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
