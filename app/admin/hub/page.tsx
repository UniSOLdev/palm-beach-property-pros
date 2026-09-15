import { EmployeeHub } from "@/components/admin/employee-hub";
import { listHubCrewMembers } from "@/lib/admin/actions/hub";

export const dynamic = "force-dynamic";
export const metadata = { title: "Employee Hub" };

export default async function EmployeeHubPage() {
  let crewMembers: Awaited<ReturnType<typeof listHubCrewMembers>> = [];
  let loadError = "";

  try {
    crewMembers = await listHubCrewMembers();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load crew";
  }

  return (
    <div className="space-y-4">
      {loadError ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          {" — "}
          Run the employee hub migration on Supabase if tables are missing.
        </p>
      ) : null}
      <EmployeeHub crewMembers={crewMembers} />
    </div>
  );
}
