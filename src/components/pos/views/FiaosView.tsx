"use client";

import { BookUser, Database, Phone } from "lucide-react";
import { formatCOP, formatTiempoRelativo } from "@/lib/formatters";
import type { ClienteFiado } from "@/types/pos";

interface FiaosViewProps {
  clientes: ClienteFiado[];
  onCargarDemo: () => void;
}

export function FiaosView({ clientes, onCargarDemo }: FiaosViewProps) {
  const totalPorCobrar = clientes.reduce((acc, c) => acc + c.saldoDeuda, 0);

  return (
    <section aria-labelledby="fiaos-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="fiaos-heading" className="text-lg font-bold tracking-tight text-foreground">
            Cartera de fiaos
          </h2>
          <p className="text-sm text-text-muted">
            Control de cupos, saldos pendientes y abonos.
          </p>
        </div>

        <div className="pos-card rounded-lg px-3 py-1.5 text-right">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Total por cobrar
          </span>
          <span
            className={`tabular-nums text-base font-bold ${
              totalPorCobrar > 0 ? "text-coral-pos" : "text-emerald-pos"
            }`}
          >
            {formatCOP(totalPorCobrar)}
          </span>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="pos-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-text-muted">
            <BookUser className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Sin clientes registrados
          </h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Carga los datos de prueba para ver clientes con cupo y saldos en mora.
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
        <div className="space-y-2.5">
          {clientes.map((cliente) => {
            const tieneDeuda = cliente.saldoDeuda > 0;
            const porcentajeCupo =
              cliente.cupoMaximo > 0
                ? Math.min(100, Math.round((cliente.saldoDeuda / cliente.cupoMaximo) * 100))
                : 0;

            return (
              <div key={cliente.id} className="pos-card rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-foreground sm:text-base">
                      {cliente.nombre}
                    </h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" aria-hidden="true" />
                        {cliente.telefono}
                      </span>
                      <span>· {formatTiempoRelativo(cliente.ultimaActividad)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`tabular-nums block text-base font-bold ${
                        tieneDeuda ? "text-coral-pos" : "text-emerald-pos"
                      }`}
                    >
                      {formatCOP(cliente.saldoDeuda)}
                    </span>
                    <span className="tabular-nums text-xs text-text-muted">
                      Cupo: {formatCOP(cliente.cupoMaximo)}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={`h-full rounded-full ${
                        porcentajeCupo >= 80
                          ? "bg-coral-pos"
                          : porcentajeCupo > 0
                            ? "bg-amber-pos"
                            : "bg-emerald-pos"
                      }`}
                      style={{ width: `${porcentajeCupo}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
