"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Database,
  Download,
  Pencil,
  Settings,
  Upload,
} from "lucide-react";

interface HeaderBarProps {
  nombreTienda: string;
  onSaveNombreTienda: (nuevoNombre: string) => void;
  onCargarDemo: () => void;
  onExportarRespaldo: () => void;
  onImportarRespaldo: (contenidoTexto: string) => void;
  statusMessage: string | null;
}

export function HeaderBar({
  nombreTienda,
  onSaveNombreTienda,
  onCargarDemo,
  onExportarRespaldo,
  onImportarRespaldo,
  statusMessage,
}: HeaderBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(nombreTienda);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  const handleStartEdit = () => {
    setDraftName(nombreTienda);
    setIsEditing(true);
  };

  const handleCommitEdit = () => {
    onSaveNombreTienda(draftName);
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onImportarRespaldo(text);
    e.target.value = "";
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6">
        {/* Isotipo geométrico FiaoControl + saludo contextual + nombre tienda */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-pos shadow-sm shadow-emerald-pos/25">
            <svg
              viewBox="0 0 32 32"
              className="h-5 w-5"
              fill="none"
              aria-hidden="true"
            >
              <rect x="6" y="5" width="5" height="22" rx="1.5" fill="#FFFFFF" />
              <rect x="6" y="5" width="19" height="5" rx="1.5" fill="#FFFFFF" />
              <rect x="6" y="13.5" width="14" height="4.5" rx="1.5" fill="#FFFFFF" />
              <circle cx="23.5" cy="23.5" r="2.8" fill="#FFFFFF" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
              <span className="inline-flex items-center gap-1.5 text-emerald-pos">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-pos" />
                Caja abierta · Hoy
              </span>
              {statusMessage ? (
                <span className="hidden truncate text-text-muted sm:inline">
                  · {statusMessage}
                </span>
              ) : null}
            </div>

            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCommitEdit();
                }}
                className="mt-0.5 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={handleCommitEdit}
                  autoFocus
                  maxLength={40}
                  aria-label="Nombre de la tienda"
                  className="h-8 w-full max-w-[200px] rounded-lg border border-border-subtle bg-background px-2.5 text-sm font-bold text-foreground outline-none focus:border-emerald-pos sm:max-w-[240px]"
                />
                <button
                  type="submit"
                  aria-label="Guardar nombre de tienda"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-pos text-white active:scale-[0.98]"
                >
                  <Check className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1">
                <h1 className="truncate text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                  {nombreTienda}
                </h1>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  title="Editar nombre de la tienda"
                  aria-label="Editar nombre de la tienda"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground active:scale-[0.98]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Botón tipo pill para Respaldo / Ajustes */}
        <div ref={menuContainerRef} className="relative shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Opciones de respaldo y datos"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border-subtle bg-surface-muted px-3.5 text-xs font-semibold text-foreground transition-all hover:border-emerald-pos/40 hover:bg-surface active:scale-[0.98]"
          >
            <Settings className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span>Respaldo</span>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              aria-label="Menú de respaldo y datos"
              className="pos-card absolute right-0 mt-2 w-56 rounded-2xl p-1.5 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onExportarRespaldo();
                  setMenuOpen(false);
                }}
                className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-muted active:scale-[0.98]"
              >
                <Download className="h-4 w-4 text-emerald-pos" aria-hidden="true" />
                Exportar respaldo JSON
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-muted active:scale-[0.98]"
              >
                <Upload className="h-4 w-4 text-text-muted" aria-hidden="true" />
                Importar respaldo JSON
              </button>

              <div className="my-1 border-t border-border-subtle" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onCargarDemo();
                  setMenuOpen(false);
                }}
                className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-muted active:scale-[0.98]"
              >
                <Database className="h-4 w-4 text-amber-pos" aria-hidden="true" />
                Cargar datos de prueba
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {statusMessage ? (
        <div className="border-t border-border-subtle bg-surface-muted px-3 py-1 text-center text-xs font-medium text-foreground sm:hidden">
          {statusMessage}
        </div>
      ) : null}
    </header>
  );
}
