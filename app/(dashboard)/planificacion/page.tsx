import { getLaborCalendar } from "@/lib/actions/labor";
import { LaborCalendarClient } from "@/components/planificacion/LaborCalendarClient";

export const metadata = { title: "Planificación HH · ForgeOps" };

export default async function PlanificacionPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : new Date().toISOString().slice(0, 7);
  const data = await getLaborCalendar(month);
  return <LaborCalendarClient month={month} assignments={data.assignments} entries={data.entries} />;
}
