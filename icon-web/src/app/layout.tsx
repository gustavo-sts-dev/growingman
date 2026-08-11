import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Growingman - A revolução na sua Barbearia",
  description:
    "Tenha seu próprio aplicativo, agendamentos inteligentes e controle financeiro total. Growingman é a plataforma White-Label definitiva para barbearias premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="dark"
      style={{ colorScheme: "dark" }}
    >
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          outfit.variable,
        )}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
