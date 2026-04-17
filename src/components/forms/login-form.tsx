"use client";

import { useActionState, useEffect } from "react";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/types/domain";

const initialState: ActionResult = {
  success: false,
  message: "",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="gestao@secretaria.gov.br"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          placeholder="********"
          required
          type="password"
        />
      </div>

      <Button className="w-full" disabled={pending} size="lg" type="submit">
        <LogIn className="h-4 w-4" />
        {pending ? "Entrando..." : "Acessar painel"}
      </Button>
    </form>
  );
}
