import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicSettings } from "@/lib/auth/guards";

export default async function LoginPage() {
  const settings = await getPublicSettings();

  return (
    <main className="page-shell flex min-h-screen items-center py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-6">
          <Badge variant="secondary" className="w-fit">
            Acesso seguro
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {settings.nome_sistema} substitui planilhas por governanca quantitativa em tempo real.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Entre com as credenciais criadas pelo superadmin e acesse o painel que corresponde ao seu papel.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/">
                <ShieldCheck className="h-4 w-4" />
                Ver landing page
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/app">Ir para o app</Link>
            </Button>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-md rounded-[2rem]">
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Entrar no painel</CardTitle>
            <CardDescription>
              Autenticacao por email e senha com refresh de sessao via proxy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
