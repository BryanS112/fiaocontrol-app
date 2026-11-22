"use client";

import { AlertTriangle, Database, Package } from "lucide-react";
import { formatCOP } from "@/lib/formatters";
import type { Producto } from "@/types/pos";

interface InventarioViewProps {
  productos: Producto[];
  onCargarDemo: () => void;
}

export function InventarioView({ productos, onCargarDemo }: InventarioViewProps) {
  const productosStockBajo = productos.filter((p) => p.stock <= p.stockMinimo);

  return (
    <section aria-labelledby="inventario-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="inventario-heading"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Inventario
          </h2>
          <p className="text-sm text-text-muted">
            Costos, precios de venta y alertas de reposición.
          </p>
        </div>

        {productosStockBajo.length > 0 ? (
          <span className="tabular-nums inline-flex items-center gap-1.5 rounded-lg bg-amber-pos/15 px-2.5 py-1 text-xs font-semibold text-amber-pos">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {productosStockBajo.length} con stock bajo
          </span>
        ) : null}
      </div>

      {productos.length === 0 ? (
        <div className="pos-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-text-muted">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Inventario vacío
          </h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Carga el catálogo inicial de tienda colombiana para visualizar márgenes y alertas.
          </p>
          <button
            type="button"
            onClick={onCargarDemo}
            className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-emerald-pos px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
          >
            <Database className="h-4 w-4" aria-hidden="true" />
            Cargar datos de prueba
          </button>
        </div>
      ) : (
        <div className="pos-card overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-muted/60 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-right">Costo</th>
                  <th className="px-4 py-3 text-right">Venta</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {productos.map((producto) => {
                  const stockBajo = producto.stock <= producto.stockMinimo;
                  return (
                    <tr key={producto.id} className="hover:bg-surface-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {producto.nombre}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {producto.categoria}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-right text-text-muted">
                        {formatCOP(producto.costo)}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-right font-semibold text-foreground">
                        {formatCOP(producto.precioVenta)}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                            stockBajo
                              ? "bg-amber-pos/15 text-amber-pos"
                              : "bg-surface-muted text-foreground"
                          }`}
                        >
                          {stockBajo ? (
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          ) : null}
                          {producto.stock} / mín {producto.stockMinimo}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
