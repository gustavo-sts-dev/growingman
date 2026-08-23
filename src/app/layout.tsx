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
  title: {
    // `default` vale nas rotas que não definem título; `template` monta o das que
    // definem. O layout de cada barbearia sobrescreve o template com o nome dela,
    // para a aba do cliente mostrar a barbearia, e não a plataforma.
    default: "Growingman | Gestão para barbearias",
    template: "%s | Growingman",
  },
  description:
    "Agenda online, equipe, clientes, serviços, estoque e financeiro em um só sistema para barbearias.",
  // Ícone NÃO declarado aqui, de propósito.
  //
  // Havia `icons: { icon: ... }` convivendo com um `app/favicon.ico`, e os dois
  // emitiam <link rel="icon"> na mesma página. O do arquivo vinha com `sizes` e
  // `type` declarados e ganhava a disputa — por isso o logo "não funcionava".
  // Agora o ícone vem só de `app/icon.png` e `app/apple-icon.png`: é a API
  // baseada em arquivo que a documentação do Next recomenda, com um lugar só e
  // nenhuma config para manter em sincronia.
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
