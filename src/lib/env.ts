const requiredPublicKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

type PublicKey = (typeof requiredPublicKeys)[number];

export function hasSupabaseEnv() {
  return requiredPublicKeys.every((key) => Boolean(process.env[key]));
}

export function getSupabaseEnv() {
  const missing = requiredPublicKeys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase env vars: ${missing.join(", ")}`);
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  };
}

export function getServiceRoleKey() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Missing Supabase env var: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return key;
}

export function getSystemName() {
  return process.env.NEXT_PUBLIC_SYSTEM_NAME || "ProdAPS";
}

export function getSystemTagline() {
  return (
    process.env.NEXT_PUBLIC_SYSTEM_TAGLINE ||
    "Governanca quantitativa em tempo real para UBS"
  );
}

export function getWhatsAppHref() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5585999999999";
  const message =
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ||
    "Ola! Gostaria de conhecer o ProdAPS.";

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function getRequiredEnvVar(key: PublicKey) {
  return process.env[key] as string | undefined;
}
