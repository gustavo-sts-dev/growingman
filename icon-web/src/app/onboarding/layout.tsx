import Link from "next/link";
import { Scissors } from "lucide-react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden selection:bg-white/20">
      {/* Subtle background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900/50 via-black to-black pointer-events-none" />

      {/* Minimal Header */}
      <header className="w-full p-6 flex justify-between items-center relative z-10">
        <Link
          href="/"
          className="flex items-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-white tracking-tight">
            Growingman
          </span>
        </Link>
        <div className="text-sm text-neutral-500 font-medium">
          Precisa de ajuda?{" "}
          <Link
            href="#"
            className="text-white hover:underline"
          >
            Fale conosco
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {children}
      </main>
    </div>
  );
}
