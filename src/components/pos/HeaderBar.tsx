"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Database,
  Download,
  HardDrive,
  Pencil,
  Settings,
  Store,
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
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6">
        {/* Identidad y nombre editable de la tienda */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-pos text-white">
            <Store className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCommitEdit();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={handleCommitEdit}
                  autoFocus
                  maxLength={40}
                  aria-label="Nombre de la tienda"
                  className="h-8 w-full max-w-[200px] rounded-md border border-border-subtle bg-background px-2 text-sm font-semibold text-foreground outline-none focus:border-emerald-pos sm:max-w-[240px]"
                />
                <button
                  type="submit"
                  aria-label="Guardar nombre de tienda"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-emerald-pos text-white active:scale-[0.98]"
                >
                  <Check className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1">
                <h1 className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
                  {nombreTienda}
                </h1>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  title="Editar nombre de la tienda"
                  aria-label="Editar nombre de la tienda"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground active:scale-[0.98]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-pos">
                <HardDrive className="h-3 w-3 shrink-0" aria-hidden="true" />
                Modo local activo
              </span>
              {statusMessage ? (
                <span className="hidden truncate text-xs text-text-muted sm:inline">
                  · {statusMessage}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Menú discreto de ajustes y respaldo */}
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
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle bg-background px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted active:scale-[0.98]"
          >
            <Settings className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="hidden sm:inline">Respaldo</span>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              aria-label="Menú de respaldo y datos"
              className="pos-card absolute right-0 mt-2 w-56 rounded-xl p-1.5 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onExportarRespaldo();
                  setMenuOpen(false);
                }}
                className="flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-muted active:scale-[0.98]"
              >
                <Download className="h-4 w-4 text-emerald-pos" aria-hidden="true" />
                Exportar respaldo
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-muted active:scale-[0.98]"
              >
                <Upload className="h-4 w-4 text-text-muted" aria-hidden="true" />
                Importar respaldo
              </button>

              <div className="my-1 border-t border-border-subtle" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onCargarDemo();
                  setMenuOpen(false);
                }}
                className="flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-muted active:scale-[0.98]"
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
