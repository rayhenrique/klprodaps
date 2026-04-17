import { AdminPanel } from "@/components/dashboard/admin-panel";
import { getAdminPanelData } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAdminPanelData();

  return <AdminPanel data={data} />;
}
