import { notFound } from "next/navigation";
import { apiUrl } from "@/lib/config";
import { OtpLogin } from "./OtpLogin";
import type { Metadata } from "next";

/** Idem: "Entrar | Barbearia do Zé". */
export const metadata: Metadata = { title: "Entrar" };

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

async function getTenant(slug: string) {
  try {
    const res = await fetch(apiUrl(`/tenants/${slug}`), { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ClienteLoginPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenant(tenantSlug);
  if (!tenant) notFound();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        backgroundColor: tenant.theme_bg || "#080808",
        color: tenant.theme_text || "#A1A1AA",
        ["--theme-title" as string]: tenant.theme_title || "#FFFFFF",
        ["--theme-card" as string]: tenant.theme_card || "#121212",
        ["--theme-button-bg" as string]: tenant.theme_button_bg || "#FFFFFF",
        ["--theme-button-text" as string]: tenant.theme_button_text || "#000000",
      } as React.CSSProperties}
    >
      <OtpLogin tenantId={tenant.id} tenantSlug={tenant.slug} tenantName={tenant.name} />
    </div>
  );
}
