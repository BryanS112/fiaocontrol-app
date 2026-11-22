"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  BookUser,
  CheckCircle2,
  Database,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { formatCOP } from "@/lib/formatters";
import type { RegistrarVentaInput } from "@/lib/storage";
import type {
  ClienteFiado,
  ItemVenta,
  MetodoPago,
  Producto,
} from "@/types/pos";
import type { ToastType } from "../ToastBanner";

interface CajaViewProps {
  nombreTienda: string;
  productos: Producto[];
  clientes: ClienteFiado[];
  onRegistrarVenta: (ventaData: RegistrarVentaInput) => { ok: boolean; error?: string };
  onCargarDemo: () => void;
  onNotify: (type: ToastType, text: string) => void;
}

interface ComprobanteVenta {
  items: ItemVenta[];
  total: number;
  metodoPago: MetodoPago;
  cambio: number | null;
  clienteNombre?: string;
}

const METODOS_PAGO: { id: MetodoPago; label: string }[] = [
  { id: "Efectivo", label: "Efectivo" },
  { id: "Nequi", label: "Nequi" },
  { id: "Daviplata", label: "Daviplata" },
  { id: "Fiado", label: "Fiado" },
];

const BILLETES_RAPIDOS = [10000, 20000, 50000, 100000];

export function CajaView({
  nombreTienda,
  productos,
  clientes,
  onRegistrarVenta,
  onCargarDemo,
  onNotify,
}: CajaViewProps) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [carrito, setCarrito] = useState<ItemVenta[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("Efectivo");
  const [clienteId, setClienteId] = useState<string>("");
  const [efectivoRecibido, setEfectivoRecibido] = useState<string>("");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [comprobanteVenta, setComprobanteVenta] = useState<ComprobanteVenta | null>(null);
  const [telefonoRecibo, setTelefonoRecibo] = useState("");

  const categorias = useMemo(() => {
    const set = new Set<string>();
    for (const p of productos) {
      if (p.categoria) set.add(p.categoria);
    }
    return ["Todos", ...Array.from(set)];
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const coincideCategoria =
        categoriaActiva === "Todos" || p.categoria === categoriaActiva;
      const coincideBusqueda =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q);
      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, busqueda, categoriaActiva]);

  const totalCarrito = useMemo(
    () => carrito.reduce((acc, item) => acc + item.subtotal, 0),
    [carrito]
  );

  const totalUnidades = useMemo(
    () => carrito.reduce((acc, item) => acc + item.cantidad, 0),
    [carrito]
  );

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => c.id === clienteId) ?? null,
    [clientes, clienteId]
  );

  const fiadoExcedeCupo =
    metodoPago === "Fiado" &&
    clienteSeleccionado !== null &&
    clienteSeleccionado.saldoDeuda + totalCarrito > clienteSeleccionado.cupoMaximo;

  const montoRecibidoNum = Number(efectivoRecibido.replace(/\D/g, "")) || 0;
  const cambioEfectivo = montoRecibidoNum - totalCarrito;

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.stock <= 0) {
      onNotify("warning", `"${producto.nombre}" está agotado.`);
      return;
    }

    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock) {
          onNotify(
            "warning",
            `Stock máximo alcanzado para "${producto.nombre}" (${producto.stock}).`
          );
          return prev;
        }
        return prev.map((i) =>
          i.productoId === producto.id
            ? {
                ...i,
                cantidad: i.cantidad + 1,
                subtotal: (i.cantidad + 1) * i.precioUnitario,
              }
            : i
        );
      }

      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precioUnitario: producto.precioVenta,
          costoUnitario: producto.costo,
          subtotal: producto.precioVenta,
        },
      ];
    });
  };

  const ajustarCantidad = (productoId: string, delta: number) => {
    const producto = productos.find((p) => p.id === productoId);
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.productoId !== productoId) return item;
          const nuevaCantidad = item.cantidad + delta;
          if (nuevaCantidad <= 0) return null;
          if (producto && nuevaCantidad > producto.stock) {
            onNotify(
              "warning",
              `Solo hay ${producto.stock} unidades de "${producto.nombre}".`
            );
            return item;
          }
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario,
          };
        })
        .filter((x): x is ItemVenta => x !== null)
    );
  };

  const eliminarItem = (productoId: string) => {
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setEfectivoRecibido("");
  };

  const handleCobrar = () => {
    if (carrito.length === 0) {
      onNotify("warning", "Agrega al menos un producto al carrito.");
      return;
    }
    if (metodoPago === "Fiado") {
      if (!clienteSeleccionado) {
        onNotify("warning", "Selecciona un cliente para registrar el fiado.");
        return;
      }
      if (fiadoExcedeCupo) {
        onNotify("error", "El total supera el cupo disponible del cliente.");
        return;
      }
    }

    const result = onRegistrarVenta({
      items: carrito,
      total: totalCarrito,
      metodoPago,
      ...(metodoPago === "Fiado" && clienteSeleccionado
        ? { clienteId: clienteSeleccionado.id }
        : {}),
    });

    if (!result.ok) {
      onNotify("error", result.error ?? "No se pudo registrar la venta.");
      return;
    }

    const cambioCalculado =
      metodoPago === "Efectivo" && montoRecibidoNum >= totalCarrito
        ? cambioEfectivo
        : null;

    setComprobanteVenta({
      items: [...carrito],
      total: totalCarrito,
      metodoPago,
      cambio: cambioCalculado,
      clienteNombre: clienteSeleccionado?.nombre,
    });
    setTelefonoRecibo(clienteSeleccionado?.telefono ?? "");

    onNotify(
      "success",
      metodoPago === "Fiado"
        ? `Fiado por ${formatCOP(totalCarrito)} anotado a ${clienteSeleccionado?.nombre}.`
        : `Venta por ${formatCOP(totalCarrito)} registrada (${metodoPago}).`
    );

    setCarrito([]);
    setEfectivoRecibido("");
    setClienteId("");
    setMetodoPago("Efectivo");
    setMobileCartOpen(false);
  };

  const puedeCobrar =
    carrito.length > 0 &&
    (metodoPago !== "Fiado" || (clienteSeleccionado !== null && !fiadoExcedeCupo));

  const renderCartContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-emerald-pos" aria-hidden="true" />
          <h3 className="text-sm font-bold text-foreground">
            Carrito actual ({totalUnidades})
          </h3>
        </div>
        {carrito.length > 0 ? (
          <button
            type="button"
            onClick={vaciarCarrito}
            className="text-xs font-medium text-text-muted hover:text-coral-pos"
          >
            Vaciar
          </button>
        ) : null}
      </div>

      {/* Lista de ítems */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {carrito.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm font-medium text-text-muted">
              Toca los productos para sumarlos a la cuenta.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {carrito.map((item) => (
              <li key={item.productoId} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.nombre}
                    </p>
                    <p className="tabular-nums text-xs text-text-muted">
                      {formatCOP(item.precioUnitario)} c/u
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarItem(item.productoId)}
                    aria-label={`Eliminar ${item.nombre}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-coral-pos"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-lg border border-border-subtle bg-background">
                    <button
                      type="button"
                      onClick={() => ajustarCantidad(item.productoId, -1)}
                      aria-label={`Restar ${item.nombre}`}
                      className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-surface-muted"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="tabular-nums min-w-[2.25rem] text-center text-sm font-bold text-foreground">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => ajustarCantidad(item.productoId, 1)}
                      aria-label={`Sumar ${item.nombre}`}
                      className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-surface-muted"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="tabular-nums text-sm font-bold text-foreground">
                    {formatCOP(item.subtotal)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Zona de pago */}
      <div className="space-y-3 border-t border-border-subtle bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-text-muted">Total a cobrar</span>
          <span className="tabular-nums text-2xl font-bold tracking-tight text-foreground">
            {formatCOP(totalCarrito)}
          </span>
        </div>

        {/* Selector de método de pago */}
        <div className="grid grid-cols-2 gap-2">
          {METODOS_PAGO.map((m) => {
            const active = metodoPago === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetodoPago(m.id)}
                className={`flex min-h-[48px] items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                  active
                    ? m.id === "Fiado"
                      ? "border-coral-pos bg-coral-pos text-white"
                      : "border-emerald-pos bg-emerald-pos text-white"
                    : "border-border-subtle bg-background text-foreground hover:bg-surface-muted"
                }`}
              >
                {m.id === "Efectivo" && <Banknote className="h-4 w-4" aria-hidden="true" />}
                {(m.id === "Nequi" || m.id === "Daviplata") && (
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                )}
                {m.id === "Fiado" && <BookUser className="h-4 w-4" aria-hidden="true" />}
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Calculadora de vueltos para Efectivo */}
        {metodoPago === "Efectivo" && carrito.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-border-subtle bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="efectivo-recibido"
                className="text-xs font-semibold text-foreground"
              >
                ¿Con cuánto paga?
              </label>
              <button
                type="button"
                onClick={() => setEfectivoRecibido(String(totalCarrito))}
                className="text-xs font-semibold text-emerald-pos hover:underline"
              >
                Pago exacto
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {BILLETES_RAPIDOS.map((billete) => (
                <button
                  key={billete}
                  type="button"
                  onClick={() => setEfectivoRecibido(String(billete))}
                  className="tabular-nums min-h-[36px] rounded-md border border-border-subtle bg-surface px-1 text-[11px] font-semibold text-foreground hover:bg-surface-muted"
                >
                  {formatCOP(billete)}
                </button>
              ))}
            </div>

            <input
              id="efectivo-recibido"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Otro monto en COP"
              value={efectivoRecibido}
              onChange={(e) => setEfectivoRecibido(e.target.value)}
              className="tabular-nums h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground outline-none focus:border-emerald-pos"
            />

            {montoRecibidoNum > 0 ? (
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-medium text-text-muted">
                  {cambioEfectivo >= 0 ? "Cambio / Vueltos:" : "Falta por pagar:"}
                </span>
                <span
                  className={`tabular-nums text-sm font-bold ${
                    cambioEfectivo >= 0 ? "text-emerald-pos" : "text-coral-pos"
                  }`}
                >
                  {formatCOP(Math.abs(cambioEfectivo))}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Selector de cliente para Fiado */}
        {metodoPago === "Fiado" ? (
          <div className="space-y-2 rounded-lg border border-border-subtle bg-background p-3">
            <label
              htmlFor="cliente-fiado-select"
              className="block text-xs font-semibold text-foreground"
            >
              Cliente que fía
            </label>

            {clientes.length === 0 ? (
              <p className="text-xs text-text-muted">
                No hay clientes registrados. Crea uno en la pestaña Fiaos.
              </p>
            ) : (
              <select
                id="cliente-fiado-select"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="h-11 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm font-medium text-foreground outline-none focus:border-emerald-pos"
              >
                <option value="">Selecciona un cliente...</option>
                {clientes.map((c) => {
                  const disponible = Math.max(0, c.cupoMaximo - c.saldoDeuda);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Disp: {formatCOP(disponible)})
                    </option>
                  );
                })}
              </select>
            )}

            {clienteSeleccionado ? (
              <div className="space-y-1 pt-1 text-xs">
                <div className="flex justify-between text-text-muted">
                  <span>Deuda actual:</span>
                  <span className="tabular-nums font-semibold text-coral-pos">
                    {formatCOP(clienteSeleccionado.saldoDeuda)}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Cupo disponible:</span>
                  <span className="tabular-nums font-semibold text-foreground">
                    {formatCOP(
                      Math.max(
                        0,
                        clienteSeleccionado.cupoMaximo - clienteSeleccionado.saldoDeuda
                      )
                    )}
                  </span>
                </div>

                {fiadoExcedeCupo ? (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-coral-pos/40 bg-coral-pos/10 p-2 text-xs font-medium text-coral-pos">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      Supera el cupo máximo por{" "}
                      <strong className="tabular-nums">
                        {formatCOP(
                          clienteSeleccionado.saldoDeuda +
                            totalCarrito -
                            clienteSeleccionado.cupoMaximo
                        )}
                      </strong>
                      . Reduce el pedido o registra un abono primero.
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          disabled={!puedeCobrar}
          onClick={handleCobrar}
          className={`flex min-h-[52px] w-full items-center justify-center rounded-xl px-4 text-sm font-bold text-white transition-opacity ${
            puedeCobrar
              ? metodoPago === "Fiado"
                ? "bg-coral-pos hover:opacity-95"
                : "bg-emerald-pos hover:opacity-95"
              : "cursor-not-allowed bg-surface-muted text-text-muted"
          }`}
        >
          {metodoPago === "Fiado"
            ? `Registrar Fiado · ${formatCOP(totalCarrito)}`
            : `Cobrar · ${formatCOP(totalCarrito)}`}
        </button>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="caja-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="caja-heading" className="text-lg font-bold tracking-tight text-foreground">
            Caja registradora
          </h2>
          <p className="text-sm text-text-muted">
            Toca un producto para sumarlo al carrito.
          </p>
        </div>
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
            Carga los 10 productos de tienda colombiana o agrega productos en Inventario.
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_370px] lg:items-start">
          {/* Columna izquierda: Buscador, categorías y cuadrícula */}
          <div className="space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto o categoría..."
                aria-label="Buscar producto o categoría"
                className="h-12 w-full rounded-xl border border-border-subtle bg-surface pr-4 pl-9 text-sm text-foreground outline-none focus:border-emerald-pos"
              />
            </div>

            {/* Filtros de categoría */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categorias.map((cat) => {
                const active = categoriaActiva === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaActiva(cat)}
                    className={`min-h-[38px] shrink-0 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                      active
                        ? "border-emerald-pos bg-emerald-pos text-white"
                        : "border-border-subtle bg-surface text-foreground hover:bg-surface-muted"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Cuadrícula de productos */}
            {productosFiltrados.length === 0 ? (
              <div className="pos-card rounded-xl p-6 text-center text-sm text-text-muted">
                No se encontraron productos con &ldquo;{busqueda}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {productosFiltrados.map((producto) => {
                  const agotado = producto.stock <= 0;
                  const stockBajo = !agotado && producto.stock <= producto.stockMinimo;
                  const enCarrito =
                    carrito.find((i) => i.productoId === producto.id)?.cantidad ?? 0;

                  return (
                    <button
                      key={producto.id}
                      type="button"
                      disabled={agotado}
                      onClick={() => agregarAlCarrito(producto)}
                      className={`pos-card relative flex min-h-[108px] flex-col justify-between rounded-xl p-3 text-left transition-colors active:scale-[0.99] ${
                        agotado
                          ? "cursor-not-allowed opacity-55"
                          : "hover:border-emerald-pos"
                      } ${enCarrito > 0 ? "border-emerald-pos ring-1 ring-emerald-pos" : ""}`}
                    >
                      {enCarrito > 0 ? (
                        <span className="tabular-nums absolute -top-2 -right-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-pos px-1.5 text-xs font-bold text-white">
                          {enCarrito}
                        </span>
                      ) : null}

                      <div>
                        <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-text-muted">
                          {producto.categoria}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                          {producto.nombre}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-1 pt-1">
                        <span className="tabular-nums text-sm font-bold text-foreground sm:text-base">
                          {formatCOP(producto.precioVenta)}
                        </span>
                        <span
                          className={`tabular-nums rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                            agotado
                              ? "bg-coral-pos/15 text-coral-pos"
                              : stockBajo
                                ? "bg-amber-pos/15 text-amber-pos"
                                : "bg-surface-muted text-text-muted"
                          }`}
                        >
                          {agotado ? "Agotado" : `${producto.stock} disp`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel derecho en escritorio */}
          <aside className="pos-card sticky top-20 hidden overflow-hidden rounded-xl lg:block">
            {renderCartContent()}
          </aside>
        </div>
      )}

      {/* Barra flotante de carrito en móvil / tablet */}
      {carrito.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-border-subtle bg-surface px-3 py-2.5 lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <span className="tabular-nums block text-xs font-medium text-text-muted">
                {totalUnidades} {totalUnidades === 1 ? "producto" : "productos"}
              </span>
              <span className="tabular-nums text-lg font-bold text-foreground">
                {formatCOP(totalCarrito)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileCartOpen(true)}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-pos px-5 text-sm font-bold text-white"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Cobrar
            </button>
          </div>
        </div>
      ) : null}

      {/* Drawer/Modal de carrito en móvil */}
      {mobileCartOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Carrito de compras"
          className="fixed inset-0 z-50 flex items-end bg-black/50 lg:hidden"
        >
          <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-border-subtle bg-surface">
            <div className="flex items-center justify-end border-b border-border-subtle px-4 py-2">
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                aria-label="Cerrar carrito"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderCartContent()}</div>
          </div>
        </div>
      ) : null}

      {/* Modal: Comprobante Rápido Post-Venta */}
      {comprobanteVenta ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-comprobante-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="pos-card w-full max-w-sm rounded-2xl p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-pos/15 text-emerald-pos">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="modal-comprobante-title" className="text-base font-bold text-foreground">
                    Venta registrada
                  </h3>
                  <p className="text-xs text-text-muted">
                    Pago con {comprobanteVenta.metodoPago}
                    {comprobanteVenta.clienteNombre
                      ? ` · ${comprobanteVenta.clienteNombre}`
                      : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComprobanteVenta(null)}
                aria-label="Cerrar comprobante"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted active:scale-[0.98]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-border-subtle bg-background p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">Total cobrado</span>
                <span className="tabular-nums text-xl font-bold text-foreground">
                  {formatCOP(comprobanteVenta.total)}
                </span>
              </div>

              {comprobanteVenta.cambio !== null ? (
                <div className="flex items-center justify-between border-t border-border-subtle pt-2">
                  <span className="text-xs font-medium text-text-muted">Cambio entregado</span>
                  <span className="tabular-nums text-base font-bold text-emerald-pos">
                    {formatCOP(comprobanteVenta.cambio)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-2">
              <label
                htmlFor="whatsapp-recibo-tel"
                className="block text-xs font-semibold text-foreground"
              >
                Enviar recibo por WhatsApp (opcional)
              </label>
              <input
                id="whatsapp-recibo-tel"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={telefonoRecibo}
                onChange={(e) => setTelefonoRecibo(e.target.value.replace(/\D/g, ""))}
                placeholder="Celular 10 dígitos (ej: 3104589210)"
                className="tabular-nums h-11 w-full rounded-lg border border-border-subtle bg-background px-3 text-sm text-foreground outline-none focus:border-emerald-pos"
              />

              {telefonoRecibo.length === 10 ? (
                <a
                  href={`https://wa.me/57${telefonoRecibo}?text=${encodeURIComponent(
                    `*${nombreTienda}*\nComprobante de ${comprobanteVenta.metodoPago === "Fiado" ? "fiado" : "compra"}:\n${comprobanteVenta.items
                      .map((i) => `• ${i.cantidad}x ${i.nombre}: ${formatCOP(i.subtotal)}`)
                      .join("\n")}\n*Total: ${formatCOP(comprobanteVenta.total)}* (${comprobanteVenta.metodoPago})\n¡Gracias por tu compra!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-pos bg-emerald-pos/10 px-4 text-sm font-bold text-emerald-pos transition-colors hover:bg-emerald-pos/15 active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Enviar recibo por WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex min-h-[48px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-muted px-4 text-xs font-semibold text-text-muted"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Ingresa 10 dígitos para enviar por WhatsApp
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setComprobanteVenta(null)}
              className="mt-3 flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl bg-emerald-pos text-sm font-bold text-white hover:opacity-95 active:scale-[0.98]"
            >
              Listo, nueva venta
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
