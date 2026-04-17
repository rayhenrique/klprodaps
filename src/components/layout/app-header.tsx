import Link from "next/link";
import { Building2, LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GlobalSettingsRecord, ProfileWithUbs } from "@/types/domain";

type AppHeaderProps = {
  profile: ProfileWithUbs;
  settings: GlobalSettingsRecord;
};

const roleLabels = {
  diretor: "Diretor",
  coordenador: "Coordenador",
  superadmin: "Superadmin",
} as const;

export function AppHeader({ profile, settings }: AppHeaderProps) {
  const initials = profile.nome_completo
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase())
    .join("");

  return (
    <Card className="sticky top-4 z-20 mb-6 rounded-3xl px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/app" className="text-lg font-semibold tracking-tight">
                {settings.nome_sistema}
              </Link>
              <Badge variant="outline">{roleLabels[profile.role]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {profile.ubs?.nome || "Sem UBS vinculada"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2">
            <Avatar>
              <AvatarFallback>{initials || "PA"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile.nome_completo}</p>
              <p className="truncate text-xs text-muted-foreground">
                Perfil autenticado com RLS
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>

          <form action={signOut}>
            <Button variant="outline" className="w-full sm:w-auto">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
