import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { getPublicSettings, requireProfile } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [profile, settings] = await Promise.all([
    requireProfile(),
    getPublicSettings(),
  ]);

  return (
    <main className="page-shell py-4 pb-10 sm:py-6">
      <AppHeader profile={profile} settings={settings} />
      {children}
    </main>
  );
}
