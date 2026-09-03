import { BrandHeader } from "@/components/brand/ui";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gm flex min-h-dvh flex-col overflow-x-hidden overflow-y-visible antialiased">
      <BrandHeader actionHref="/login" actionLabel="Já tenho conta" />

      <main className="relative flex flex-1 items-start px-3 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
        {/* Halos desfocados: a mesma profundidade do herói da landing */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-1/2 h-[26rem] w-[46rem] -translate-x-1/2 rounded-full bg-[#0d0c0a]/[0.09] blur-[130px]" />
          <div className="absolute top-64 -right-20 size-72 rounded-full bg-[#c9c3b6]/50 blur-[110px]" />
        </div>

        <div className="relative w-full">{children}</div>
      </main>
    </div>
  );
}
