"use client";

import { Database, ShoppingBag } from "lucide-react";
import { formatCOP } from "@/lib/formatters";
import type { Producto } from "@/types/pos";

interface CajaViewProps {
  productos: Producto[];
  onCargarDemo: () => void;
}

export function CajaView({ productos, onCargarDemo }: CajaViewProps) {
  return (
    <section aria-labelledby="caja-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="caja-heading" className="text-lg font-bold tracking-tight text-foreground">
            Caja registradora
          </h2>
          <p className="text-sm text-text-muted">
            Catálogo local listo para cobro rápido en Sprint 2.
          </p>
        </div>
        <span className="tabular-nums rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
          {productos.length} productos
        </span>
      </div>

      {productos.length === 0 ? (
        <div className="pos-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-text-muted">
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Sin productos en caja
          </h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Carga los 10 productos de tienda colombiana para probar precios en COP y stock.
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
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((producto) => {
            const stockBajo = producto.stock <= producto.stockMinimo;
            return (
              <div
                key={producto.id}
                className="pos-card flex flex-col justify-between rounded-xl p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                      {producto.categoria}
                    </span>
                    <h3 className="mt-0.5 truncate text-sm font-semibold text-foreground">
                      {producto.nombre}
                    </h3>
                  </div>
                  <span
                    className={`tabular-nums shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                      stockBajo
                        ? "bg-amber-pos/15 text-amber-pos"
                        : "bg-surface-muted text-text-muted"
                    }`}
                  >
                    Stock: {producto.stock}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5">
                  <span className="tabular-nums text-base font-bold text-foreground">
                    {formatCOP(producto.precioVenta)}
                  </span>
                  <span className="text-xs font-medium text-emerald-pos">
                    Disponible
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
