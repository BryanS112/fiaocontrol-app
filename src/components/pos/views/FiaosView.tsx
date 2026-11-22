"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  BookUser,
  CheckCircle2,
  Database,
  MessageCircle,
  Phone,
  Plus,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import { formatCOP, formatTiempoRelativo } from "@/lib/formatters";
import type {
  ClienteFiado,
  MetodoAbono,
  Venta,
} from "@/types/pos";
import type { ToastType } from "../ToastBanner";

interface FiaosViewProps {
  nombreTienda: string;
  clientes: ClienteFiado[];
  ventas: Venta[];
  onCrearCliente: (data: {
    nombre: string;
    telefono: string;
    cupoMaximo: number;
  }) => void;
  onRegistrarAbono: (
    clienteId: string,
    monto: number,
    metodoPago: MetodoAbono
  ) => { ok: boolean; error?: string };
  onCargarDemo: () => void;
  onNotify: (type: ToastType, text: string) => void;
}

const METODOS_ABONO: MetodoAbono[] = ["Efectivo", "Nequi", "Daviplata"];

const AVATAR_PALETTES = [
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getAvatarClass(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

export function FiaosView({
  nombreTienda,
  clientes,
  ventas,
  onCrearCliente,
  onRegistrarAbono,
  onCargarDemo,
  onNotify,
}: FiaosViewProps) {
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoCupo, setNuevoCupo] = useState("100000");

  const [clienteAbono, setClienteAbono] = useState<ClienteFiado | null>(null);
  const [montoAbono, setMontoAbono] = useState("");
  const [metodoAbono, setMetodoAbono] = useState<MetodoAbono>("Efectivo");

  const totalPorCobrar = useMemo(
    () => clientes.reduce((acc, c) => acc + c.saldoDeuda, 0),
    [clientes]
  );
  const cupoTotalOtorgado = useMemo(
    () => clientes.reduce((acc, c) => acc + c.cupoMaximo, 0),
    [clientes]
  );
  const clientesConSaldo = useMemo(
    () => clientes.filter((c) => c.saldoDeuda > 0).length,
    [clientes]
  );

  const porcentajeCarteraUsada =
    cupoTotalOtorgado > 0
      ? Math.min(100, Math.round((totalPorCobrar / cupoTotalOtorgado) * 100))
      : 0;

  const construirUrlWhatsApp = (cliente: ClienteFiado): string => {
    const telefonoLimpio = cliente.telefono.replace(/\D/g, "");
    const ultimosFiados = ventas
      .filter((v) => v.metodoPago === "Fiado" && v.clienteId === cliente.id)
      .slice(0, 2)
      .flatMap((v) => v.items.map((i) => `${i.cantidad}x ${i.nombre}`))
      .slice(0, 4);

    const detalleProductos =
      ultimosFiados.length > 0
        ? `\nÚltimos productos anotados: ${ultimosFiados.join(", ")}.`
        : "";

    const mensaje = `Hola ${cliente.nombre}, te saludamos de *${nombreTienda}*. Te recordamos con mucho gusto tu saldo pendiente de fiado por *${formatCOP(cliente.saldoDeuda)}*.${detalleProductos}\n¡Muchas gracias por tu compra!`;

    return `https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
  };

  const handleCrearClienteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nuevoNombre.trim();
    const telefonoLimpio = nuevoTelefono.replace(/\D/g, "");
    const cupoNum = Number(nuevoCupo.replace(/\D/g, "")) || 0;

    if (nombreLimpio.length < 2) {
      onNotify("warning", "Ingresa el nombre del cliente.");
      return;
    }
    if (telefonoLimpio.length !== 10) {
      onNotify("warning", "El teléfono debe tener 10 dígitos (ej: 3104589210).");
      return;
    }
    if (cupoNum <= 0) {
      onNotify("warning", "El cupo máximo debe ser mayor a $ 0.");
      return;
    }

    onCrearCliente({
      nombre: nombreLimpio,
      telefono: telefonoLimpio,
      cupoMaximo: cupoNum,
    });

    onNotify("success", `Cliente "${nombreLimpio}" creado.`);
    setNuevoNombre("");
    setNuevoTelefono("");
    setNuevoCupo("100000");
    setModalNuevoOpen(false);
  };

  const abrirModalAbono = (cliente: ClienteFiado) => {
    setClienteAbono(cliente);
    setMontoAbono(String(cliente.saldoDeuda));
    setMetodoAbono("Efectivo");
  };

  const handleConfirmarAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteAbono) return;
    const montoNum = Number(montoAbono.replace(/\D/g, "")) || 0;

    const result = onRegistrarAbono(clienteAbono.id, montoNum, metodoAbono);
    if (!result.ok) {
      onNotify("error", result.error ?? "No se pudo registrar el abono.");
      return;
    }

    const abonado = Math.min(montoNum, clienteAbono.saldoDeuda);
    onNotify(
      "success",
      `Abono de ${formatCOP(abonado)} registrado a ${clienteAbono.nombre} (${metodoAbono}).`
    );
    setClienteAbono(null);
    setMontoAbono("");
  };

  return (
    <section aria-labelledby="fiaos-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="fiaos-heading" className="text-lg font-extrabold tracking-tight text-foreground">
            Cartera de fiaos
          </h2>
          <p className="text-xs font-medium text-text-muted sm:text-sm">
            Control de cupos, abonos y cobranza directa por WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNuevoOpen(true)}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo Cliente
        </button>
      </div>

      {/* Hero Card Financiera (#0F172A) */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              Total en la calle
            </span>
            <p className="tabular-nums mt-1.5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {formatCOP(totalPorCobrar)}
            </p>
          </div>

          <div className="flex gap-4 text-right">
            <div>
              <span className="block text-[11px] font-medium text-slate-400">
                Con saldo
              </span>
              <span className="tabular-nums text-lg font-extrabold text-rose-400">
                {clientesConSaldo}
              </span>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="block text-[11px] font-medium text-slate-400">
                Al día
              </span>
              <span className="tabular-nums text-lg font-extrabold text-emerald-400">
                {Math.max(0, clientes.length - clientesConSaldo)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Uso de cupo global ({porcentajeCarteraUsada}%)</span>
            <span className="tabular-nums">
              Cupo total: {formatCOP(cupoTotalOtorgado)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                porcentajeCarteraUsada >= 80
                  ? "bg-rose-500"
                  : porcentajeCarteraUsada > 0
                    ? "bg-emerald-400"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${porcentajeCarteraUsada}%` }}
            />
          </div>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="pos-card flex flex-col items-center justify-center rounded-2xl p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-pos">
            <BookUser className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Sin clientes registrados
          </h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Crea un cliente nuevo o carga los datos de prueba para gestionar fiaos.
          </p>
          <button
            type="button"
            onClick={onCargarDemo}
            className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-[0.98]"
          >
            <Database className="h-4 w-4" aria-hidden="true" />
            Cargar datos de prueba
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clientes.map((cliente) => {
            const tieneDeuda = cliente.saldoDeuda > 0;
            const porcentajeCupo =
              cliente.cupoMaximo > 0
                ? Math.min(100, Math.round((cliente.saldoDeuda / cliente.cupoMaximo) * 100))
                : 0;
            const avatarColor = getAvatarClass(cliente.id);

            return (
              <div key={cliente.id} className="pos-card rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${avatarColor}`}
                    >
                      {getInitials(cliente.nombre)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-foreground">
                          {cliente.nombre}
                        </h3>
                        {!tieneDeuda ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-bold text-emerald-pos">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Al día
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2.5 text-xs text-text-muted">
                        <span className="tabular-nums inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" aria-hidden="true" />
                          {cliente.telefono}
                        </span>
                        <span>· {formatTiempoRelativo(cliente.ultimaActividad)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`tabular-nums block text-lg font-extrabold tracking-tight ${
                        tieneDeuda ? "text-coral-pos" : "text-emerald-pos"
                      }`}
                    >
                      {tieneDeuda ? formatCOP(cliente.saldoDeuda) : "$ 0"}
                    </span>
                    <span className="tabular-nums text-[11px] font-medium text-text-muted">
                      Cupo: {formatCOP(cliente.cupoMaximo)}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso estilizada */}
                <div className="mt-3.5">
                  <div className="mb-1 flex justify-between text-[11px] font-medium text-text-muted">
                    <span>Cupo usado ({porcentajeCupo}%)</span>
                    <span className="tabular-nums">
                      Disponible:{" "}
                      <strong className="text-foreground">
                        {formatCOP(Math.max(0, cliente.cupoMaximo - cliente.saldoDeuda))}
                      </strong>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
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

                {/* Botones modernos de acción */}
                <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={!tieneDeuda}
                    onClick={() => abrirModalAbono(cliente)}
                    className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all active:scale-[0.98] sm:text-sm ${
                      tieneDeuda
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500"
                        : "cursor-not-allowed bg-surface-muted text-text-muted"
                    }`}
                  >
                    <Banknote className="h-4 w-4" aria-hidden="true" />
                    Abonar
                  </button>

                  {tieneDeuda ? (
                    <a
                      href={construirUrlWhatsApp(cliente)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#20bd5a] active:scale-[0.98] sm:text-sm"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Cobrar WhatsApp
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex min-h-[46px] cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface-muted px-3 text-xs font-semibold text-text-muted opacity-60 sm:text-sm"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Cobrar WhatsApp
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Nuevo Cliente */}
      {modalNuevoOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-nuevo-cliente-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
        >
          <div className="pos-card w-full max-w-md rounded-3xl p-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 id="modal-nuevo-cliente-title" className="text-base font-extrabold text-foreground">
                Nuevo cliente de fiado
              </h3>
              <button
                type="button"
                onClick={() => setModalNuevoOpen(false)}
                aria-label="Cerrar modal"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCrearClienteSubmit} className="mt-4 space-y-3.5">
              <div>
                <label htmlFor="cli-nombre" className="mb-1 block text-xs font-bold text-foreground">
                  Nombre completo
                </label>
                <input
                  id="cli-nombre"
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Martha Lucía Gómez"
                  className="h-11 w-full rounded-xl border border-border-subtle bg-surface-muted px-3 text-sm text-foreground outline-none focus:border-emerald-pos"
                />
              </div>

              <div>
                <label htmlFor="cli-telefono" className="mb-1 block text-xs font-bold text-foreground">
                  Teléfono celular (10 dígitos)
                </label>
                <input
                  id="cli-telefono"
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value.replace(/\D/g, ""))}
                  placeholder="3104589210"
                  className="tabular-nums h-11 w-full rounded-xl border border-border-subtle bg-surface-muted px-3 text-sm text-foreground outline-none focus:border-emerald-pos"
                />
              </div>

              <div>
                <label htmlFor="cli-cupo" className="mb-1 block text-xs font-bold text-foreground">
                  Cupo máximo (COP)
                </label>
                <input
                  id="cli-cupo"
                  type="number"
                  inputMode="numeric"
                  required
                  min={1000}
                  step={1000}
                  value={nuevoCupo}
                  onChange={(e) => setNuevoCupo(e.target.value)}
                  className="tabular-nums h-11 w-full rounded-xl border border-border-subtle bg-surface-muted px-3 text-sm font-bold text-foreground outline-none focus:border-emerald-pos"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoOpen(false)}
                  className="min-h-[48px] flex-1 rounded-xl border border-border-subtle bg-surface-muted text-sm font-bold text-foreground hover:bg-surface active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] flex-1 rounded-xl bg-emerald-600 text-sm font-extrabold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.98]"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal: Registrar Abono */}
      {clienteAbono ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-abono-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
        >
          <div className="pos-card w-full max-w-md rounded-3xl p-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 id="modal-abono-title" className="text-base font-extrabold text-foreground">
                  Registrar abono
                </h3>
                <p className="text-xs font-medium text-text-muted">{clienteAbono.nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setClienteAbono(null)}
                aria-label="Cerrar modal"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarAbono} className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-muted px-3.5 py-2.5">
                <span className="text-xs font-semibold text-text-muted">Deuda actual</span>
                <span className="tabular-nums text-base font-extrabold text-coral-pos">
                  {formatCOP(clienteAbono.saldoDeuda)}
                </span>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="abono-monto" className="text-xs font-bold text-foreground">
                    Monto del abono (COP)
                  </label>
                  <button
                    type="button"
                    onClick={() => setMontoAbono(String(clienteAbono.saldoDeuda))}
                    className="text-xs font-bold text-emerald-pos hover:underline"
                  >
                    Liquidar total
                  </button>
                </div>
                <input
                  id="abono-monto"
                  type="number"
                  inputMode="numeric"
                  required
                  min={100}
                  max={clienteAbono.saldoDeuda}
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  className="tabular-nums h-12 w-full rounded-xl border border-border-subtle bg-surface-muted px-3 text-base font-extrabold text-foreground outline-none focus:border-emerald-pos"
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold text-foreground">
                  Método de pago
                </span>
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-surface-muted p-1">
                  {METODOS_ABONO.map((metodo) => {
                    const active = metodoAbono === metodo;
                    return (
                      <button
                        key={metodo}
                        type="button"
                        onClick={() => setMetodoAbono(metodo)}
                        className={`flex min-h-[44px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold transition-all active:scale-[0.98] ${
                          active
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-text-muted hover:text-foreground"
                        }`}
                      >
                        {metodo === "Efectivo" ? (
                          <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {metodo}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setClienteAbono(null)}
                  className="min-h-[48px] flex-1 rounded-xl border border-border-subtle bg-surface-muted text-sm font-bold text-foreground hover:bg-surface active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] flex-1 rounded-xl bg-emerald-600 text-sm font-extrabold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.98]"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
