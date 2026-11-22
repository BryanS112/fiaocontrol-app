"use client";

import type { ComponentType } from "react";
import { BarChart3, BookUser, Package, ShoppingBag } from "lucide-react";
import type { PosSection } from "@/types/pos";

interface NavItem {
  id: PosSection;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "caja",
    label: "Caja",
    description: "Cobro rápido",
    icon: ShoppingBag,
  },
  {
    id: "fiaos",
    label: "Fiaos",
    description: "Créditos y abonos",
    icon: BookUser,
  },
  {
    id: "inventario",
    label: "Inventario",
    description: "Catálogo y stock",
    icon: Package,
  },
  {
    id: "resumen",
    label: "Resumen",
    description: "Cierre diario",
    icon: BarChart3,
  },
];

interface BottomNavProps {
  activeSection: PosSection;
  onSelectSection: (section: PosSection) => void;
  badges?: Partial<Record<PosSection, number>>;
}

export function BottomNav({
  activeSection,
  onSelectSection,
  badges,
}: BottomNavProps) {
  return (
    <>
      {/* Barra lateral limpia en escritorio */}
      <aside
        aria-label="Navegación principal"
        className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r md:border-border-subtle md:bg-surface"
      >
        <nav className="flex flex-col gap-1.5 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const badge = badges?.[item.id];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[50px] w-full items-center justify-between rounded-xl px-3.5 py-2 text-left transition-all active:scale-[0.98] ${
                  isActive
                    ? "bg-emerald-pos text-white shadow-sm shadow-emerald-pos/25"
                    : "text-foreground hover:bg-surface-muted"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-bold leading-tight">
                      {item.label}
                    </span>
                    <span
                      className={`block text-[11px] leading-tight ${
                        isActive ? "text-white/85" : "text-text-muted"
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </span>

                {typeof badge === "number" && badge > 0 ? (
                  <span
                    className={`tabular-nums rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : item.id === "caja"
                          ? "bg-emerald-pos text-white"
                          : "bg-surface-muted text-foreground"
                    }`}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border-subtle p-4 text-xs text-text-muted">
          <p className="font-bold text-foreground">FiaoControl POS</p>
          <p className="mt-0.5">Modo local · Pesos COP</p>
        </div>
      </aside>

      {/* Barra flotante moderna con efecto cristal en móvil */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 md:hidden">
        <nav
          aria-label="Navegación inferior"
          className="pointer-events-auto mx-auto grid max-w-md grid-cols-4 rounded-2xl border border-border-subtle bg-white/85 p-1.5 shadow-lg backdrop-blur-xl dark:bg-zinc-950/85"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const badge = badges?.[item.id];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition-all active:scale-[0.98] ${
                  isActive
                    ? "bg-emerald-pos/12 text-emerald-pos"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {typeof badge === "number" && badge > 0 ? (
                    <span
                      className={`tabular-nums absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                        item.id === "caja"
                          ? "bg-emerald-pos"
                          : item.id === "fiaos"
                            ? "bg-coral-pos"
                            : "bg-amber-pos"
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </div>
                <span className={isActive ? "font-bold" : ""}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
