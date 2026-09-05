"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";

/**
 * Evento do Chrome/Edge/Android, fora do padrão e ausente do `lib.dom`.
 * O navegador o dispara quando o site cumpre os critérios de instalação —
 * manifest válido, service worker registrado e HTTPS.
 */
type EventoDeInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Convite para instalar o painel como aplicativo.
 *
 * Mora no rodapé da sidebar, ao lado do PushToggle, e some sozinho em três
 * casos: já instalado, navegador sem suporte, ou instalação concluída agora.
 *
 * O iOS é tratado à parte porque o Safari NUNCA dispara `beforeinstallprompt` —
 * lá não existe instalação por API, só o caminho manual pelo menu Compartilhar.
 * Sem esse ramo, o botão simplesmente não apareceria no iPhone, que é justamente
 * onde o painel mais se beneficia de virar app.
 */
/**
 * "Já está rodando instalado?" é estado do AMBIENTE, não do componente: uma
 * media query que o navegador mantém e sabe avisar quando muda. Por isso
 * `useSyncExternalStore` em vez de ler dentro de um efeito e guardar em estado —
 * o React lê a fonte direto, e o instantâneo do servidor devolve `true`
 * (pessimista) para o botão não piscar na tela de quem já tem o app.
 */
const CONSULTA = "(display-mode: standalone)";

const assinarModoExibicao = (aoMudar: () => void) => {
  const mq = window.matchMedia?.(CONSULTA);
  mq?.addEventListener("change", aoMudar);
  return () => mq?.removeEventListener("change", aoMudar);
};

const lerInstalado = () =>
  window.matchMedia?.(CONSULTA).matches ||
  // iOS não implementa `display-mode`; a marca dele é esta.
  (window.navigator as { standalone?: boolean }).standalone === true;

/** O sistema não muda no meio da sessão: assina nada e só lê. */
const semAssinatura = () => () => {};
const lerIOS = () => /iPad|iPhone|iPod/.test(window.navigator.userAgent);

export function InstallAppButton() {
  const [evento, setEvento] = useState<EventoDeInstalacao | null>(null);
  const [instalouAgora, setInstalouAgora] = useState(false);
  const [mostrarDica, setMostrarDica] = useState(false);

  const rodandoInstalado = useSyncExternalStore(assinarModoExibicao, lerInstalado, () => true);
  const ehIOS = useSyncExternalStore(semAssinatura, lerIOS, () => false);
  const instalado = rodandoInstalado || instalouAgora;

  useEffect(() => {
    const aoOferecer = (e: Event) => {
      // Sem isto o Chrome mostra a barra dele no rodapé, e ficariam dois
      // convites na mesma tela dizendo a mesma coisa.
      e.preventDefault();
      setEvento(e as EventoDeInstalacao);
    };
    const aoInstalar = () => {
      // A aba atual continua em modo navegador depois de instalar, então a
      // media query não muda aqui — este estado é o que faz o convite sumir.
      setInstalouAgora(true);
      setEvento(null);
    };

    window.addEventListener("beforeinstallprompt", aoOferecer);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoOferecer);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  if (instalado) return null;
  // Sem evento e fora do iOS: navegador que não instala nada. Nada a oferecer.
  if (!evento && !ehIOS) return null;

  const classe =
    "flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all md:min-h-0";

  if (ehIOS && !evento) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setMostrarDica((v) => !v)}
          className={`${classe} text-neutral-400 hover:bg-white/5 hover:text-white active:bg-white/10`}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span className="truncate">Instalar aplicativo</span>
        </button>

        {mostrarDica && (
          <div className="mt-1 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[0.78rem] leading-5 text-neutral-400">
            <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-white">
              <Share className="h-3.5 w-3.5 shrink-0" />
              No iPhone é pelo Safari
              <button
                type="button"
                onClick={() => setMostrarDica(false)}
                aria-label="Fechar"
                className="ml-auto rounded-md p-0.5 text-neutral-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            Toque em <strong className="text-neutral-200">Compartilhar</strong> e depois em{" "}
            <strong className="text-neutral-200">Adicionar à Tela de Início</strong>.
          </div>
        )}
      </div>
    );
  }

  const instalar = async () => {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    // O evento é de uso único: aceito ou recusado, ele não serve mais. Se
    // recusou, o navegador oferece de novo numa próxima visita.
    setEvento(null);
    if (outcome === "accepted") setInstalouAgora(true);
  };

  return (
    <button
      type="button"
      onClick={instalar}
      className={`${classe} bg-white/[0.06] text-white hover:bg-white/10 active:bg-white/15`}
    >
      <Download className="h-4 w-4 shrink-0" />
      <span className="truncate">Instalar aplicativo</span>
    </button>
  );
}
