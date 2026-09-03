import type { Metadata, Viewport } from "next";
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
  // PWA: torna o painel instalável e habilita o Web Push de agendamento. O
  // service worker é registrado no layout da área logada (dashboard/layout.tsx).
  manifest: "/manifest.webmanifest",
  // Ícone NÃO declarado aqui, de propósito.
  //
  // Havia `icons: { icon: ... }` convivendo com um `app/favicon.ico`, e os dois
  // emitiam <link rel="icon"> na mesma página. O do arquivo vinha com `sizes` e
  // `type` declarados e ganhava a disputa — por isso o logo "não funcionava".
  // Agora o ícone vem só de `app/icon.png` e `app/apple-icon.png`: é a API
  // baseada em arquivo que a documentação do Next recomenda, com um lugar só e
  // nenhuma config para manter em sincronia.
};

/**
 * Viewport — é daqui que sai a sensação de app no celular.
 *
 * `viewportFit: "cover"` faz a página ocupar a tela inteira do aparelho, por
 * baixo do entalhe e da barra de gestos, e é o que LIBERA as variáveis
 * `env(safe-area-inset-*)`. Sem ele elas valem zero, e todo o cuidado com
 * rodapé fixo e folhas que sobem do fundo não teria efeito nenhum — o conteúdo
 * ficaria embaixo da barra de gestos do iPhone.
 *
 * `maximumScale: 5` de propósito, em vez do `1` que costuma aparecer nesse
 * lugar: travar o zoom é a maneira fácil de impedir o salto de escala do
 * Safari ao focar um campo, mas tira de quem enxerga pouco o único recurso de
 * ampliação que existe. Esse salto já está resolvido pelo piso de 16px nos
 * campos (globals.css), então não há motivo para pagar esse preço.
 *
 * `themeColor` pinta a barra de status do sistema com o fundo do painel: é o
 * que apaga a emenda entre o navegador e a interface.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#080808",
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
