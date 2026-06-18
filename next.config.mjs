/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rotas /projetos (lista) e /linha-do-tempo foram unificadas na Home (showcase).
  // Redirect temporário (307) evita 404 em links/bookmarks antigos sem cache agressivo.
  async redirects() {
    return [
      { source: "/projetos", destination: "/", permanent: false },
      { source: "/linha-do-tempo", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
