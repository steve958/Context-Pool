import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono  = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Context Pool — Document Q&A Without Embeddings",
  description:
    "Self-hosted, open-source document Q&A. Ask questions across any document set — every chunk is checked, every answer is cited. Works with OpenAI, Anthropic, Gemini, and Ollama.",
  keywords: ["document Q&A", "RAG", "self-hosted", "open source", "LLM", "embeddings-free"],
  authors: [{ name: "Context Pool contributors" }],
  openGraph: {
    title: "Context Pool — Document Q&A Without Embeddings",
    description:
      "Self-hosted document Q&A without embeddings or vector databases. Every chunk is checked. Every answer is cited.",
    type: "website",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Context Pool" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Context Pool",
    description: "Self-hosted document Q&A without embeddings. Open source.",
    images: ["/og.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg",  type: "image/svg+xml" },
      { url: "/favicon.ico",  sizes: "any" },
      { url: "/icon-32.png",  type: "image/png", sizes: "32x32" },
      { url: "/icon-16.png",  type: "image/png", sizes: "16x16" },
    ],
    apple:    [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
