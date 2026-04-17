import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";
import { getPublicSettings } from "@/lib/auth/guards";
import { getWhatsAppHref } from "@/lib/env";

export const metadata: Metadata = {
  title: "ProdAPS | Gestao estrategica para Secretarias de Saude",
  description:
    "SaaS para Secretarias Municipais de Saude acompanharem metas, pendencias e produtividade das UBS em tempo real.",
};

export default async function MarketingPage() {
  const settings = await getPublicSettings();

  return (
    <LandingPage
      systemName={settings.nome_sistema}
      logoUrl={settings.logo_url}
      whatsappHref={getWhatsAppHref()}
    />
  );
}
