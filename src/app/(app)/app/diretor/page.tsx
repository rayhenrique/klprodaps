import { DirectorDashboard } from "@/components/dashboard/director-dashboard";
import { getMonthlyDirectorDashboard } from "@/actions/production";

export const dynamic = "force-dynamic";

export default async function DiretorPage() {
  const data = await getMonthlyDirectorDashboard();

  return <DirectorDashboard data={data} />;
}
