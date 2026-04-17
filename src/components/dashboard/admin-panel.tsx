"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, useTransition } from "react";
import {
  Building2,
  LayoutDashboard,
  Palette,
  Pencil,
  Settings2,
  ShieldCheck,
  ShieldPlus,
  Trash2,
  Upload,
  Users2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createUserWithProfile, deleteUser, updateBranding, updateUserProfile } from "@/actions/admin";
import { deleteUbs, saveUbs } from "@/actions/coordinator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminPanelData, AdminUserRow, UbsRecord } from "@/types/domain";

type AdminPanelProps = {
  data: AdminPanelData;
};

type AdminModule = "dashboard" | "users" | "ubs" | "settings";

const moduleMeta: Array<{
  id: AdminModule;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}> = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Resumo operacional do ambiente admin.",
  },
  {
    id: "users",
    label: "Utilizadores",
    icon: Users2,
    description: "Criacao, edicao e remocao de acessos.",
  },
  {
    id: "ubs",
    label: "UBS",
    icon: Building2,
    description: "Cadastro e manutencao das unidades.",
  },
  {
    id: "settings",
    label: "Configuracoes",
    icon: Settings2,
    description: "Branding e identidade do sistema.",
  },
];

function roleLabel(role: AdminUserRow["role"]) {
  switch (role) {
    case "superadmin":
      return "Superadmin";
    case "coordenador":
      return "Coordenador";
    default:
      return "Diretor";
  }
}

function roleVariant(role: AdminUserRow["role"]) {
  switch (role) {
    case "superadmin":
      return "info" as const;
    case "coordenador":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export function AdminPanel({ data }: AdminPanelProps) {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<AdminModule>("dashboard");
  const [createPending, startCreateTransition] = useTransition();
  const [brandingPending, startBrandingTransition] = useTransition();
  const [saveUserPending, startSaveUserTransition] = useTransition();
  const [saveUbsPending, startSaveUbsTransition] = useTransition();
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [role, setRole] = useState("diretor");
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [editingUbs, setEditingUbs] = useState<UbsRecord | null>(null);

  const metrics = useMemo(() => {
    const superadmins = data.users.filter((user) => user.role === "superadmin").length;
    const coordenadores = data.users.filter((user) => user.role === "coordenador").length;
    const diretores = data.users.filter((user) => user.role === "diretor").length;
    const semUbs = data.users.filter((user) => user.role === "diretor" && !user.ubs_id).length;

    return {
      superadmins,
      coordenadores,
      diretores,
      semUbs,
    };
  }, [data.users]);

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const ubsId = String(formData.get("ubs_id") || "");
    const payload = {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      nome_completo: String(formData.get("nome_completo") || ""),
      role: String(formData.get("role") || "diretor"),
      ubs_id: ubsId || null,
    };

    startCreateTransition(async () => {
      const result = await createUserWithProfile(payload);

      if (!result.success) {
        toast.error(result.issues?.join(" ") || result.message);
        return;
      }

      toast.success(result.message);
      form.reset();
      setRole("diretor");
      router.refresh();
    });
  }

  async function handleUpdateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const ubsId = String(formData.get("ubs_id") || "");
    const payload = {
      id: String(formData.get("id") || ""),
      nome_completo: String(formData.get("nome_completo") || ""),
      role: String(formData.get("role") || "diretor"),
      password: String(formData.get("password") || ""),
      ubs_id: ubsId || null,
    };

    startSaveUserTransition(async () => {
      const result = await updateUserProfile(payload);

      if (!result.success) {
        toast.error(result.issues?.join(" ") || result.message);
        return;
      }

      toast.success(result.message);
      setEditingUser(null);
      form.reset();
      router.refresh();
    });
  }

  async function handleDeleteUser(user: AdminUserRow) {
    if (user.id === data.currentUserId) {
      toast.error("Nao e permitido apagar o proprio utilizador.");
      return;
    }

    if (!window.confirm(`Remover o utilizador ${user.nome_completo}?`)) {
      return;
    }

    setDeletePendingId(user.id);
    const result = await deleteUser(user.id);
    setDeletePendingId(null);

    if (!result.success) {
      toast.error(result.issues?.join(" ") || result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  async function handleSaveUbs(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    startSaveUbsTransition(async () => {
      const result = await saveUbs(payload as Record<string, unknown> & { id?: string });

      if (!result.success) {
        toast.error(result.issues?.join(" ") || result.message);
        return;
      }

      toast.success(result.message);
      setEditingUbs(null);
      form.reset();
      router.refresh();
    });
  }

  async function handleDeleteUbs(ubs: UbsRecord) {
    if (!window.confirm(`Remover a UBS ${ubs.nome}?`)) {
      return;
    }

    setDeletePendingId(ubs.id);
    const result = await deleteUbs(ubs.id);
    setDeletePendingId(null);

    if (!result.success) {
      toast.error(result.issues?.join(" ") || result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  async function handleBranding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startBrandingTransition(async () => {
      const result = await updateBranding(formData);

      if (!result.success) {
        toast.error(result.issues?.join(" ") || result.message);
        return;
      }

      toast.success(result.message);
      form.reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-slate-200 bg-white/90">
        <CardHeader className="gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge>Area do superadmin</Badge>
            <CardTitle className="text-3xl tracking-tight">
              Dashboard e modulos de administracao
            </CardTitle>
            <CardDescription className="max-w-3xl">
              Controle o acesso ao sistema, mantenha a base de UBS e configure a
              identidade institucional do ProdAPS em um unico painel.
            </CardDescription>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-[1.5rem] border-blue-200 bg-blue-50/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm text-slate-600">Utilizadores</p>
                <p className="mt-1 text-3xl font-semibold">{data.users.length}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-emerald-200 bg-emerald-50/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm text-slate-600">UBS</p>
                <p className="mt-1 text-3xl font-semibold">{data.ubsOptions.length}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-indigo-200 bg-indigo-50/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm text-slate-600">Coordenadores</p>
                <p className="mt-1 text-3xl font-semibold">{metrics.coordenadores}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-orange-200 bg-orange-50/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm text-slate-600">Diretores sem UBS</p>
                <p className="mt-1 text-3xl font-semibold">{metrics.semUbs}</p>
              </CardContent>
            </Card>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-[2rem]">
        <CardContent className="p-3">
          <div className="grid gap-3 md:grid-cols-4">
            {moduleMeta.map((module) => {
              const Icon = module.icon;

              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setActiveModule(module.id)}
                  className={[
                    "rounded-[1.4rem] border px-4 py-4 text-left transition-all",
                    activeModule === module.id
                      ? "border-slate-900 bg-slate-950 text-white shadow-lg"
                      : "border-border bg-background hover:-translate-y-0.5 hover:bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-2xl",
                        activeModule === module.id
                          ? "bg-white/10 text-white"
                          : "bg-slate-950 text-white",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{module.label}</p>
                      <p
                        className={[
                          "text-sm",
                          activeModule === module.id ? "text-slate-300" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {module.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {activeModule === "dashboard" ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Visao geral do ambiente</CardTitle>
              <CardDescription>
                Acompanhamento rapido dos modulos administrativos do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Superadmins ativos</p>
                <p className="mt-1 text-3xl font-semibold">{metrics.superadmins}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Perfis com acesso total ao backoffice.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Diretores cadastrados</p>
                <p className="mt-1 text-3xl font-semibold">{metrics.diretores}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Perfis operacionais vinculados as UBS.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Nome do sistema</p>
                <p className="mt-1 text-2xl font-semibold">{data.settings.nome_sistema}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Configuracao ativa no header e na landing.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Base de UBS</p>
                <p className="mt-1 text-3xl font-semibold">{data.ubsOptions.length}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Unidades disponiveis para vinculacao e metas.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Atalhos administrativos</CardTitle>
                <CardDescription>
                  Use o menu acima para navegar entre os modulos principais.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-border bg-background px-4 py-4">
                  <p className="font-medium">Utilizadores</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crie contas, redefina papeis e remova acessos.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-4">
                  <p className="font-medium">UBS</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cadastre unidades, atualize endereco e mantenha contactos.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-4">
                  <p className="font-medium">Configuracoes</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ajuste branding, nome institucional e logotipo oficial.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Ultimos utilizadores</CardTitle>
                <CardDescription>Leitura rapida da base atual.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.users.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{user.nome_completo}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={roleVariant(user.role)}>{roleLabel(user.role)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {activeModule === "users" ? (
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldPlus className="h-5 w-5" />
                CRUD de utilizadores
              </CardTitle>
              <CardDescription>
                Crie novos acessos e distribua perfis por papel e UBS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleCreateUser}>
                <Input name="nome_completo" placeholder="Nome completo" required />
                <Input name="email" placeholder="email@orgao.gov.br" required type="email" />
                <Input name="password" placeholder="Senha inicial" required type="password" />

                <div className="space-y-2">
                  <Label htmlFor="role">Perfil</Label>
                  <select
                    id="role"
                    name="role"
                    className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    <option value="diretor">Diretor</option>
                    <option value="coordenador">Coordenador</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ubs_id">UBS vinculada</Label>
                  <select
                    id="ubs_id"
                    name="ubs_id"
                    className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                    disabled={role !== "diretor"}
                    defaultValue=""
                  >
                    <option value="">Sem vinculacao</option>
                    {data.ubsOptions.map((ubs) => (
                      <option key={ubs.id} value={ubs.id}>
                        {ubs.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <Button disabled={createPending} type="submit">
                  <ShieldPlus className="h-4 w-4" />
                  {createPending ? "Criando..." : "Criar utilizador"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Base de utilizadores</CardTitle>
              <CardDescription>
                Edite o perfil, ajuste a UBS e remova acessos quando necessario.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-3xl border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{user.nome_completo}</p>
                        <Badge variant={roleVariant(user.role)}>{roleLabel(user.role)}</Badge>
                        {user.id === data.currentUserId ? (
                          <Badge variant="secondary">Sessao atual</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {user.ubs_nome || "Sem UBS vinculada"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={deletePendingId === user.id || user.id === data.currentUserId}
                        onClick={() => void handleDeleteUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletePendingId === user.id ? "Removendo..." : "Excluir"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeModule === "ubs" ? (
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                CRUD de UBS
              </CardTitle>
              <CardDescription>
                Cadastre novas unidades e mantenha a base operacional atualizada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSaveUbs}>
                <Input name="nome" placeholder="Nome da UBS" required />
                <Input name="endereco" placeholder="Endereco completo" required />
                <Input name="contato" placeholder="Telefone ou email de contacto" />
                <Button disabled={saveUbsPending} type="submit">
                  <Building2 className="h-4 w-4" />
                  {saveUbsPending ? "Salvando..." : "Salvar UBS"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Unidades cadastradas</CardTitle>
              <CardDescription>
                Edite dados da UBS ou remova registros obsoletos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.ubsOptions.map((ubs) => (
                <div
                  key={ubs.id}
                  className="rounded-3xl border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold">{ubs.nome}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{ubs.endereco}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ubs.contato || "Sem contacto"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingUbs(ubs)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={deletePendingId === ubs.id}
                        onClick={() => void handleDeleteUbs(ubs)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletePendingId === ubs.id ? "Removendo..." : "Excluir"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeModule === "settings" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Configuracoes do sistema
              </CardTitle>
              <CardDescription>
                Defina o nome institucional e o logotipo ativo do ProdAPS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.settings.logo_url ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-white p-4">
                  <img
                    src={data.settings.logo_url}
                    alt="Logotipo atual"
                    className="max-h-16 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                  Nenhum logotipo configurado no momento.
                </div>
              )}

              <form className="grid gap-3" onSubmit={handleBranding}>
                <Input
                  defaultValue={data.settings.nome_sistema}
                  name="nome_sistema"
                  placeholder="Nome do sistema"
                  required
                />
                <div className="space-y-2">
                  <Label htmlFor="logo">Logotipo</Label>
                  <Input id="logo" name="logo" type="file" accept="image/*" />
                </div>
                <Button disabled={brandingPending} type="submit">
                  <Upload className="h-4 w-4" />
                  {brandingPending ? "Atualizando..." : "Salvar configuracoes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Estado atual da plataforma</CardTitle>
              <CardDescription>
                Resumo da identidade ativa e da cobertura administrativa.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Nome exibido</p>
                <p className="mt-2 text-2xl font-semibold">{data.settings.nome_sistema}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Superadmins</p>
                <p className="mt-2 text-2xl font-semibold">{metrics.superadmins}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Coordenadores</p>
                <p className="mt-2 text-2xl font-semibold">{metrics.coordenadores}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Cobertura de UBS</p>
                <p className="mt-2 text-2xl font-semibold">{data.ubsOptions.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => (!open ? setEditingUser(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar utilizador</DialogTitle>
            <DialogDescription>
              Atualize nome, perfil, UBS e opcionalmente redefina a senha.
            </DialogDescription>
          </DialogHeader>

          {editingUser ? (
            <form className="grid gap-3" onSubmit={handleUpdateUser}>
              <input type="hidden" name="id" value={editingUser.id} />
              <Input
                defaultValue={editingUser.nome_completo}
                name="nome_completo"
                placeholder="Nome completo"
                required
              />
              <Input value={editingUser.email} disabled readOnly />

              <div className="space-y-2">
                <Label htmlFor="edit-role">Perfil</Label>
                <select
                  id="edit-role"
                  name="role"
                  className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  defaultValue={editingUser.role}
                >
                  <option value="diretor">Diretor</option>
                  <option value="coordenador">Coordenador</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ubs">UBS vinculada</Label>
                <select
                  id="edit-ubs"
                  name="ubs_id"
                  className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  defaultValue={editingUser.ubs_id || ""}
                >
                  <option value="">Sem vinculacao</option>
                  {data.ubsOptions.map((ubs) => (
                    <option key={ubs.id} value={ubs.id}>
                      {ubs.nome}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                name="password"
                placeholder="Nova senha (opcional)"
                type="password"
              />

              <Button disabled={saveUserPending} type="submit">
                <ShieldCheck className="h-4 w-4" />
                {saveUserPending ? "Salvando..." : "Salvar alteracoes"}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingUbs)} onOpenChange={(open) => (!open ? setEditingUbs(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar UBS</DialogTitle>
            <DialogDescription>
              Atualize os dados principais da unidade selecionada.
            </DialogDescription>
          </DialogHeader>

          {editingUbs ? (
            <form className="grid gap-3" onSubmit={handleSaveUbs}>
              <input type="hidden" name="id" value={editingUbs.id} />
              <Input defaultValue={editingUbs.nome} name="nome" placeholder="Nome da UBS" required />
              <Input
                defaultValue={editingUbs.endereco}
                name="endereco"
                placeholder="Endereco completo"
                required
              />
              <Input
                defaultValue={editingUbs.contato || ""}
                name="contato"
                placeholder="Telefone ou email de contacto"
              />
              <Button disabled={saveUbsPending} type="submit">
                <Building2 className="h-4 w-4" />
                {saveUbsPending ? "Salvando..." : "Salvar alteracoes"}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
