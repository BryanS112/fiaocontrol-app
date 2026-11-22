import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FiaoControl POS — Caja, Fiaos e Inventario",
    short_name: "FiaoControl",
    description:
      "Punto de venta, control de inventario y gestión de fiaos en pesos colombianos para tiendas de barrio y minimarkets.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#059669",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
