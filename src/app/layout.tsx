import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SmoothScroll } from "@/components/anim/SmoothScroll";
import { Preloader } from "@/components/anim/Preloader";
import { Cursor } from "@/components/anim/Cursor";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Trilhado Desenvolvimento — diário técnico de Micaías Viola",
  description:
    "A história do meu desenvolvimento semana a semana: decisões, tecnologias, desafios e entregas na ECQUA Engenharia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`no-js ${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col font-sans">
        {/* no-js → js antes da pintura (TREINO-PERFORMANCE §10) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.replace('no-js','js')",
          }}
        />
        <Preloader />
        <Cursor />
        <SmoothScroll>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
