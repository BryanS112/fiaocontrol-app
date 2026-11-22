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
    description: "Registrar ventas rápidas",
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
    description: "Productos y stock",
    icon: Package,
  },
  {
    id: "resumen",
    label: "Resumen",
    description: "Cierre y métricas",
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
        className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-border-subtle md:bg-surface"
      >
        <nav className="flex flex-col gap-1 p-3">
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
                className={`flex min-h-[48px] w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "bg-emerald-pos text-white"
                    : "text-foreground hover:bg-surface-muted"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold leading-tight">
                      {item.label}
                    </span>
                    <span
                      className={`block text-xs leading-tight ${
                        isActive ? "text-white/85" : "text-text-muted"
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </span>

                {typeof badge === "number" && badge > 0 ? (
                  <span
                    className={`tabular-nums rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
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
          <p className="font-semibold text-foreground">FiaoControl POS</p>
          <p className="mt-0.5">Sprint 1 · Persistencia local</p>
        </div>
      </aside>

      {/* Barra inferior fija en móvil (botones táctiles >= 48px) */}
      <nav
        aria-label="Navegación inferior"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface md:hidden"
      >
        <div className="grid grid-cols-4">
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
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-emerald-pos"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-10 bg-emerald-pos"
                  />
                ) : null}
                <div className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {typeof badge === "number" && badge > 0 ? (
                    <span className="tabular-nums absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-pos px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  ) : null}
                </div>
                <span className={isActive ? "font-semibold" : ""}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
