import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/external-api": {
        target: "http://192.168.1.75:8003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/external-api/, ""),
      },
    },
  }
});

