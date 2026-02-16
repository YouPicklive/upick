import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "app-icon-square.png", "app-icon-1024.png", "app-icon-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,webp,woff,woff2}"],
      },
      manifest: {
        id: "/",
        name: "YouPick — Alignment Through Movement",
        short_name: "YouPick",
        description: "When you can't decide what to do, spin the wheel and let fate guide you.",
        theme_color: "#C96A2B",
        background_color: "#F7F1E8",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/app-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/app-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/app-icon-1024.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "any",
          },
        ],
        screenshots: [
          {
            src: "/screenshot-wide.png",
            sizes: "1280x736",
            type: "image/png",
            form_factor: "wide",
            label: "YouPick desktop — YOU SET THE VIBE",
          },
          {
            src: "/screenshot-mobile-categories.png",
            sizes: "540x960",
            type: "image/png",
            form_factor: "narrow",
            label: "YouPick — What are you looking for?",
          },
          {
            src: "/screenshot-mobile-fortunes.png",
            sizes: "540x960",
            type: "image/png",
            form_factor: "narrow",
            label: "YouPick — Fortune Pack selection",
          },
          {
            src: "/screenshot-mobile-result.png",
            sizes: "540x960",
            type: "image/png",
            form_factor: "narrow",
            label: "YouPick — Result card discovery",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
