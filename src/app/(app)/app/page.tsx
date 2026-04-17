import { redirect } from "next/navigation";
import { getDefaultAppRoute, requireProfile } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AppIndexPage() {
  const profile = await requireProfile();

  redirect(getDefaultAppRoute(profile.role));
}
