"use client";

import { useState } from "react";
import { Check, Database, Download, HardDrive, Pencil, Store } from "lucide-react";

interface HeaderBarProps {
  nombreTienda: string;
  onSaveNombreTienda: (nuevoNombre: string) => void;
  onCargarDemo: () => void;
  onExportarRespaldo: () => void;
  statusMessage: string | null;
}

export function HeaderBar({
  nombreTienda,
  onSaveNombreTienda,
  onCargarDemo,
  onExportarRespaldo,
  statusMessage,
}: HeaderBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(nombreTienda);

  const handleStartEdit = () => {
    setDraftName(nombreTienda);
    setIsEditing(true);
  };

  const handleCommitEdit = () => {
    onSaveNombreTienda(draftName);
    setIsEditing(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6">
        {/* Identidad y nombre editable de la tienda */}
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-pos text-white">
            <Store className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
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
                  className="h-8 w-44 rounded-md border border-border-subtle bg-background px-2 text-sm font-semibold text-foreground outline-none focus:border-emerald-pos sm:w-56"
                />
                <button
                  type="submit"
                  aria-label="Guardar nombre de tienda"
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-pos text-white"
                >
                  <Check className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
                  {nombreTienda}
                </h1>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  title="Editar nombre de la tienda"
                  aria-label="Editar nombre de la tienda"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-pos">
                <HardDrive className="h-3 w-3" aria-hidden="true" />
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

        {/* Acciones discretas de prueba y respaldo */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onCargarDemo}
            title="Cargar datos de prueba de tienda colombiana"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <Database className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
            <span className="hidden sm:inline">Cargar datos de prueba</span>
            <span className="sm:hidden">Demo</span>
          </button>

          <button
            type="button"
            onClick={onExportarRespaldo}
            title="Exportar respaldo en formato JSON"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <Download className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
            <span className="hidden sm:inline">Exportar JSON</span>
            <span className="sm:hidden">JSON</span>
          </button>
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
