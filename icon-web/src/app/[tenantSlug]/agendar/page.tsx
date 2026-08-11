import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { BookingFlow } from "./BookingFlow";
import { apiUrl } from "@/lib/config";
import { TenantLogo } from "@/components/TenantLogo";

interface TenantPageProps {
  params: Promise<{ tenantSlug: string }>;
}

async function getTenantData(slug: string) {
  try {
    const res = await fetch(apiUrl(`/tenants/${slug}`), { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getServices(tenantId: string) {
  try {
    const res = await fetch(apiUrl(`/services?tenantId=${tenantId}`), {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getBarbers(tenantId: string) {
  try {
    const res = await fetch(
      apiUrl(`/barbers?tenantId=${tenantId}&isActive=true`),
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function BookingPage({ params }: TenantPageProps) {
  const resolvedParams = await params;
  const tenant = await getTenantData(resolvedParams.tenantSlug);
  if (!tenant) notFound();

  const services = await getServices(tenant.id);
  const barbers = await getBarbers(tenant.id);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={
        {
          backgroundColor: tenant.theme_bg || "#080808",
          color: tenant.theme_text || "#A1A1AA",
          fontFamily: tenant.font_family
            ? `"${tenant.font_family}", sans-serif`
            : undefined,
          "--theme-bg": tenant.theme_bg || "#080808",
          "--theme-card": tenant.theme_card || "#121212",
          "--theme-text": tenant.theme_text || "#A1A1AA",
          "--theme-title": tenant.theme_title || "#FFFFFF",
          "--theme-button-bg": tenant.theme_button_bg || "#FFFFFF",
          "--theme-button-text": tenant.theme_button_text || "#000000",
          "--theme-accent": tenant.theme_accent || "#4ade80",
        } as React.CSSProperties
      }
    >
      {tenant.font_family && (
        <style
          dangerouslySetInnerHTML={{
            __html: `@import url('https://fonts.googleapis.com/css2?family=${tenant.font_family.replace(/\s+/g, "+")}:wght@400;500;600;700;900&display=swap');`,
          }}
        />
      )}

      {/* Header */}
      <header
        className="relative z-10 px-4 md:px-8 py-4 flex items-center justify-between border-b backdrop-blur-md"
        style={{
          borderColor: "color-mix(in srgb, var(--theme-text) 12%, transparent)",
          backgroundColor:
            "color-mix(in srgb, var(--theme-bg) 80%, transparent)",
        }}
      >
        <Link
          href={`/${tenant.slug}`}
          className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: "var(--theme-text)" }}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar ao site</span>
        </Link>
        <div
          className="flex items-center gap-2 font-bold text-lg tracking-tight"
          style={{ color: "var(--theme-title)" }}
        >
          <TenantLogo
            logoUrl={tenant.logo_url}
            className="w-7 h-7 rounded-md"
            growingmanClassName="w-4 h-4"
            alt={tenant.name}
          />
          {tenant.name}
        </div>
        <div className="w-[88px] sm:w-[120px]"></div>
      </header>

      {/* Main Flow */}
      <main className="flex-1 flex flex-col pt-6 pb-12 px-4 sm:px-6 relative z-10">
        <BookingFlow
          tenant={tenant}
          services={services}
          barbers={barbers}
        />
      </main>
    </div>
  );
}
