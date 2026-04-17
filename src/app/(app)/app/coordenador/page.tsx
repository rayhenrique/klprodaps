import { CoordinatorDashboard } from "@/components/dashboard/coordinator-dashboard";
import { getCoordinatorDashboard } from "@/actions/coordinator";

export const dynamic = "force-dynamic";

type CoordenadorPageProps = {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
};

export default async function CoordenadorPage({
  searchParams,
}: CoordenadorPageProps) {
  const params = await searchParams;
  const data = await getCoordinatorDashboard(params.month, params.year);

  return <CoordinatorDashboard data={data} />;
}
