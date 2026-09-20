import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/barbershop/",
  server: {
    proxy: {
      "/barbershop/api": {
        target: "http://127.0.0.1:4002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/barbershop\/api/, ""),
      },
      "/barbershop/uploads": {
        target: "http://127.0.0.1:4002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/barbershop\/uploads/, "/uploads"),
      },
    },
  },
});
