import type { NextConfig } from "next";

// "standalone" para a imagem Docker; NEXT_OUTPUT=export gera o site estático em `out/`, usado no
// deploy no Cloudflare (todas as páginas são estáticas e os dados ficam no navegador).
const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === "export" ? "export" : "standalone",
};

export default nextConfig;
