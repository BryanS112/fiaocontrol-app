"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Database,
  Layers,
  Package,
  Pencil,
  Plus,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { formatCOP } from "@/lib/formatters";
import type { Producto } from "@/types/pos";
import type { ToastType } from "../ToastBanner";

interface InventarioViewProps {
  productos: Producto[];
  onCrearProducto: (data: Omit<Producto, "id">) => void;
  onActualizarProducto: (
    id: string,
    patch: Partial<Omit<Producto, "id">>
  ) => void;
  onReponerStock: (id: string, delta: number) => void;
  onCargarDemo: () => void;
  onNotify: (type: ToastType, text: string) => void;
}

const CATEGORIAS_SUGERIDAS = [
  "Abarrotes",
  "Lácteos y Huevos",
  "Bebidas",
  "Panadería",
  "Aseo",
  "Snacks",
  "Otros",
];

interface ProductoFormState {
  nombre: string;
  categoria: string;
  precioVenta: string;
  costo: string;
  stock: string;
  stockMinimo: string;
}

const EMPTY_FORM: ProductoFormState = {
  nombre: "",
  categoria: "Abarrotes",
  precioVenta: "",
  costo: "",
  stock: "10",
  stockMinimo: "5",
};

export function InventarioView({
  productos,
  onCrearProducto,
  onActualizarProducto,
  onReponerStock,
  onCargarDemo,
  onNotify,
}: InventarioViewProps) {
  const [busqueda, setBusqueda] = useState("");
  const [soloAgotarse, setSoloAgotarse] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductoFormState>(EMPTY_FORM);

  const productosStockBajo = useMemo(
    () => productos.filter((p) => p.stock <= p.stockMinimo),
    [productos]
  );

  const valorInventarioCosto = useMemo(
    () => productos.reduce((acc, p) => acc + p.costo * p.stock, 0),
    [productos]
  );

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      if (soloAgotarse && p.stock > p.stockMinimo) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
      );
    });
  }, [productos, busqueda, soloAgotarse]);

  const abrirNuevoProducto = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const abrirEditarProducto = (producto: Producto) => {
    setEditingId(producto.id);
    setForm({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precioVenta: String(producto.precioVenta),
      costo: String(producto.costo),
      stock: String(producto.stock),
      stockMinimo: String(producto.stockMinimo),
    });
    setModalOpen(true);
  };

  const handleGuardarProducto = (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const precioVenta = Number(form.precioVenta) || 0;
    const costo = Number(form.costo) || 0;
    const stock = Number(form.stock) || 0;
    const stockMinimo = Number(form.stockMinimo) || 0;

    if (nombre.length < 2) {
      onNotify("warning", "Ingresa el nombre del producto.");
      return;
    }
    if (precioVenta <= 0) {
      onNotify("warning", "El precio de venta debe ser mayor a $ 0.");
      return;
    }

    const payload = {
      nombre,
      categoria: form.categoria.trim() || "Otros",
      precioVenta,
      costo,
      stock,
      stockMinimo,
    };

    if (editingId) {
      onActualizarProducto(editingId, payload);
      onNotify("success", `"${nombre}" actualizado.`);
    } else {
      onCrearProducto(payload);
      onNotify("success", `"${nombre}" agregado al inventario.`);
    }

    setModalOpen(false);
    setEditingId(null);
  };

  const handleReposicionRapida = (producto: Producto, cantidad: number) => {
    onReponerStock(producto.id, cantidad);
    onNotify("success", `+${cantidad} unidades agregadas a "${producto.nombre}".`);
  };

  return (
    <section aria-labelledby="inventario-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="inventario-heading" className="text-lg font-extrabold tracking-tight text-foreground">
            Inventario y alertas
          </h2>
          <p className="text-xs font-medium text-text-muted sm:text-sm">
            Niveles de stock, márgenes y reposición rápida.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNuevoProducto}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo Producto
        </button>
      </div>

      {/* Contadores KPI superiores */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="pos-card flex items-center gap-3 rounded-2xl p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
            <Layers className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Total productos
            </span>
            <p className="tabular-nums text-xl font-extrabold text-foreground">
              {productos.length}
            </p>
          </div>
        </div>

        <div className="pos-card flex items-center gap-3 rounded-2xl p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Valor (costo)
            </span>
            <p className="tabular-nums text-xl font-extrabold text-foreground">
              {formatCOP(valorInventarioCosto)}
            </p>
          </div>
        </div>

        <div className="pos-card flex items-center gap-3 rounded-2xl p-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              productosStockBajo.length > 0
                ? "bg-amber-500/12 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Por agotarse
            </span>
            <p
              className={`tabular-nums text-xl font-extrabold ${
                productosStockBajo.length > 0 ? "text-amber-pos" : "text-emerald-pos"
              }`}
            >
              {productosStockBajo.length}
            </p>
          </div>
        </div>
      </div>

      {productos.length === 0 ? (
        <div className="pos-card flex flex-col items-center justify-center rounded-2xl p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-pos">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Inventario vacío
          </h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Agrega tu primer producto o carga el catálogo de prueba de tienda colombiana.
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
        <>
          {/* Buscador y switch "Solo por agotarse" */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en inventario..."
                aria-label="Buscar en inventario"
                className="pos-card h-11 w-full rounded-xl pr-4 pl-10 text-sm font-medium text-foreground outline-none focus:border-emerald-pos"
              />
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={soloAgotarse}
              onClick={() => setSoloAgotarse((prev) => !prev)}
              className={`inline-flex min-h-[44px] shrink-0 items-center justify-between gap-2.5 rounded-xl border px-3.5 text-xs font-bold transition-all active:scale-[0.98] ${
                soloAgotarse
                  ? "border-amber-pos bg-amber-500/12 text-amber-pos"
                  : "pos-card text-foreground hover:bg-surface-muted"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Solo por agotarse ({productosStockBajo.length})
              </span>
              <span
                className={`inline-block h-4 w-7 rounded-full p-0.5 transition-colors ${
                  soloAgotarse ? "bg-amber-pos" : "bg-slate-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`block h-3 w-3 rounded-full bg-white transition-transform ${
                    soloAgotarse ? "translate-x-3" : "translate-x-0"
                  }`}
                />
              </span>
            </button>
          </div>

          {/* Catálogo con barras visuales de capacidad de stock */}
          {productosFiltrados.length === 0 ? (
            <div className="pos-card rounded-2xl p-6 text-center text-sm text-text-muted">
              {soloAgotarse
                ? "Excelente: no tienes productos por agotarse."
                : "No hay productos que coincidan con tu búsqueda."}
            </div>
          ) : (
            <div className="space-y-3">
              {productosFiltrados.map((producto) => {
                const agotado = producto.stock === 0;
                const stockBajo = !agotado && producto.stock <= producto.stockMinimo;
                const margen = producto.precioVenta - producto.costo;

                // Capacidad visual respecto a 3x stock mínimo (mínimo referencia 15)
                const referenciaCapacidad = Math.max(15, producto.stockMinimo * 3);
                const porcentajeStock = Math.min(
                  100,
                  Math.round((producto.stock / referenciaCapacidad) * 100)
                );

                return (
                  <div key={producto.id} className="pos-card rounded-2xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                          {producto.categoria}
                        </span>
                        <h3 className="text-sm font-bold text-foreground sm:text-base">
                          {producto.nombre}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                          <span className="tabular-nums">
                            Venta:{" "}
                            <strong className="font-bold text-foreground">
                              {formatCOP(producto.precioVenta)}
                            </strong>
                          </span>
                          <span className="tabular-nums">
                            Costo: {formatCOP(producto.costo)}
                          </span>
                          <span className="tabular-nums font-semibold text-emerald-pos">
                            Margen: {formatCOP(margen)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`tabular-nums inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          agotado
                            ? "bg-coral-pos/12 text-coral-pos"
                            : stockBajo
                              ? "bg-amber-500/12 text-amber-pos"
                              : "bg-emerald-500/12 text-emerald-pos"
                        }`}
                      >
                        {agotado
                          ? "Agotado"
                          : stockBajo
                            ? `Bajo · ${producto.stock} uds`
                            : `${producto.stock} uds`}
                      </span>
                    </div>

                    {/* Barra visual de capacidad de stock */}
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] font-medium text-text-muted">
                        <span>Nivel de inventario</span>
                        <span className="tabular-nums">
                          Mínimo recomendado: {producto.stockMinimo}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            agotado
                              ? "bg-coral-pos"
                              : stockBajo
                                ? "bg-amber-pos"
                                : "bg-emerald-pos"
                          }`}
                          style={{ width: `${agotado ? 4 : porcentajeStock}%` }}
                        />
                      </div>
                    </div>

                    {/* Acciones rápidas de reposición y edición */}
                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="mr-1 text-xs font-semibold text-text-muted">
                          Reponer:
                        </span>
                        {[1, 5, 10].map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => handleReposicionRapida(producto, qty)}
                            className="tabular-nums min-h-[36px] rounded-full border border-border-subtle bg-surface-muted px-3 text-xs font-bold text-foreground transition-colors hover:border-emerald-pos hover:text-emerald-pos active:scale-[0.96]"
                          >
                            +{qty}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => abrirEditarProducto(producto)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border-subtle bg-surface-muted px-3.5 text-xs font-bold text-foreground transition-colors hover:bg-surface active:scale-[0.97]"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Editar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal: Nuevo / Editar Producto */}
      {modalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-producto-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
        >
          <div className="pos-card w-full max-w-md rounded-3xl p-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 id="modal-producto-title" className="text-base font-extrabold text-foreground">
                {editingId ? "Editar producto" : "Nuevo producto"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar modal"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarProducto} className="mt-4 space-y-3">
              <div>
                <label htmlFor="prod-nombre" className="mb-1 block text-xs font-bold text-foreground">
                  Nombre del producto
                </label>
                <input
                  id="prod-nombre"
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Arroz Diana x 1 kg"
                  className="h-11 w-full rounded-xl border border-border-subtle bg-surface-muted px-3 text-sm text-foreground outline-none focus:border-emerald-pos"
                />
              </div>

              <div>
                <label htmlFor="prod-categoria" className="mb-1 block text-xs font-bold text-foreground">
                  Categoría
                </label>
                <select
                  id="prod-categoria"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="h-11 w-full rounded-xl border border-border-subtle bg-surface-muted px-3 text-sm text-foreground outline-none focus:border-emerald-pos"
                >
                  {CATEGORIAS_SUGERIDAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="prod-venta" className="mb-1 block text-xs font-bold text-foreground">
                    Precio venta (COP)
                  </label>
                  <input
                    id="prod-venta"
                    type="number"
                    inputMode="numeric"
                    required
                    min={50}
                    value={form.precioVenta}
                    onChange={(e) => setForm({ ...form, precioVenta: e.target.value })}
                    className="tabular-nums h-11 w-full rounded-xl border border-border-subtle bg-surface-muted px-3 text-sm font-bold text-foreground outline-none focus:border-emerald-pos"
                  />
                </div>

                <div>
                  <label htmlFor="prod-costo" className="mb-1 block text-xs font-bold text-foreground">
                    Costo (COP)
                  </label>
                  <input
                    id="prod-costo"
                    type="number"
                    inputMode="numeric"
                    required
                    min={0}
                    value={form.costo}
                    onChange={(e) => setForm({ ...form, costo: e.target.value })}
                    className="tabular-nums h-11 w-full rounded-xl border border-border-subtle bg-surface-muted px-3 text-sm font-bold text-foreground outline-none focus:border-emerald-pos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="prod-stock" className="mb-1 block text-xs font-bold text-foreground">
                    Stock actual
                  </label>
                  <input
                    id="prod-stock"
                    type="number"
                    inputMode="numeric"
                    required
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="tabular-nums h-11 w-full rounded-xl border border-border-subtle bg-surface-muted px-3 text-sm font-bold text-foreground outline-none focus:border-emerald-pos"
                  />
                </div>

                <div>
                  <label htmlFor="prod-min" className="mb-1 block text-xs font-bold text-foreground">
                    Stock mínimo
                  </label>
                  <input
                    id="prod-min"
                    type="number"
                    inputMode="numeric"
                    required
                    min={0}
                    value={form.stockMinimo}
                    onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                    className="tabular-nums h-11 w-full rounded-xl border border-border-subtle bg-surface-muted px-3 text-sm font-bold text-foreground outline-none focus:border-emerald-pos"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[48px] flex-1 rounded-xl border border-border-subtle bg-surface-muted text-sm font-bold text-foreground hover:bg-surface active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] flex-1 rounded-xl bg-emerald-600 text-sm font-extrabold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.98]"
                >
                  {editingId ? "Guardar Cambios" : "Crear Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
