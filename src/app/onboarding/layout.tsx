import Image from "next/image";
import Link from "next/link";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="border-b border-neutral-900">
        <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Growingman — página inicial">
            <Image src="/logo.png" width={32} height={32} alt="" className="rounded-md" />
            <span className="font-heading text-lg font-semibold tracking-tight">Growingman</span>
          </Link>
          <Link href="/login" className="text-sm text-neutral-400 hover:text-white">Já tenho conta</Link>
        </div>
      </header>
      <main className="flex flex-1 items-center px-5 py-12 sm:px-8">{children}</main>
    </div>
  );
}
