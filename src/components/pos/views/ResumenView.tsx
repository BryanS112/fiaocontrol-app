"use client";

import { BarChart3, Receipt } from "lucide-react";
import { formatCOP, formatFechaHora } from "@/lib/formatters";
import type { AbonoFiado, ClienteFiado, Producto, Venta } from "@/types/pos";

interface ResumenViewProps {
  productos: Producto[];
  clientes: ClienteFiado[];
  ventas: Venta[];
  abonos: AbonoFiado[];
}

export function ResumenView({
  productos,
  clientes,
  ventas,
  abonos,
}: ResumenViewProps) {
  const totalVendido = ventas.reduce((acc, v) => acc + v.total, 0);
  const totalFiado = clientes.reduce((acc, c) => acc + c.saldoDeuda, 0);
  const totalAbonos = abonos.reduce((acc, a) => acc + a.monto, 0);
  const valorInventario = productos.reduce(
    (acc, p) => acc + p.costo * p.stock,
    0
  );

  return (
    <section aria-labelledby="resumen-heading" className="space-y-4">
      <div>
        <h2
          id="resumen-heading"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          Resumen del negocio
        </h2>
        <p className="text-sm text-text-muted">
          Indicadores consolidados desde el almacenamiento local.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="pos-card rounded-xl p-4">
          <span className="text-xs font-medium text-text-muted">
            Ventas registradas
          </span>
          <p className="tabular-nums mt-1 text-xl font-bold text-emerald-pos">
            {formatCOP(totalVendido)}
          </p>
          <span className="tabular-nums mt-1 block text-xs text-text-muted">
            {ventas.length} {ventas.length === 1 ? "factura" : "facturas"}
          </span>
        </div>

        <div className="pos-card rounded-xl p-4">
          <span className="text-xs font-medium text-text-muted">
            Cartera en fiaos
          </span>
          <p className="tabular-nums mt-1 text-xl font-bold text-coral-pos">
            {formatCOP(totalFiado)}
          </p>
          <span className="tabular-nums mt-1 block text-xs text-text-muted">
            {clientes.filter((c) => c.saldoDeuda > 0).length} clientes con saldo
          </span>
        </div>

        <div className="pos-card rounded-xl p-4">
          <span className="text-xs font-medium text-text-muted">
            Abonos recibidos
          </span>
          <p className="tabular-nums mt-1 text-xl font-bold text-foreground">
            {formatCOP(totalAbonos)}
          </p>
          <span className="tabular-nums mt-1 block text-xs text-text-muted">
            {abonos.length} {abonos.length === 1 ? "abono" : "abonos"}
          </span>
        </div>

        <div className="pos-card rounded-xl p-4">
          <span className="text-xs font-medium text-text-muted">
            Costo de inventario
          </span>
          <p className="tabular-nums mt-1 text-xl font-bold text-foreground">
            {formatCOP(valorInventario)}
          </p>
          <span className="tabular-nums mt-1 block text-xs text-text-muted">
            {productos.length} referencias
          </span>
        </div>
      </div>

      <div className="pos-card rounded-xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-text-muted" aria-hidden="true" />
          <h3 className="text-sm font-bold text-foreground">
            Últimos movimientos
          </h3>
        </div>

        {ventas.length === 0 ? (
          <p className="text-sm text-text-muted">
            No hay ventas registradas todavía. Usa &ldquo;Cargar datos de prueba&rdquo; en la barra superior para explorar movimientos de ejemplo.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {ventas.map((venta) => (
              <li
                key={venta.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-muted">
                    <Receipt className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {venta.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(", ")}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatFechaHora(venta.fecha)} · {venta.metodoPago}
                    </p>
                  </div>
                </div>

                <span
                  className={`tabular-nums shrink-0 text-sm font-bold ${
                    venta.metodoPago === "Fiado"
                      ? "text-coral-pos"
                      : "text-emerald-pos"
                  }`}
                >
                  {formatCOP(venta.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
