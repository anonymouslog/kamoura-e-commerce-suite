import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { adminUsersQuery } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { data: users = [], error, isPending, refetch } = useQuery(adminUsersQuery);

  if (isPending) {
    return <p className="py-10 text-center text-sm text-grey">Loading registered users...</p>;
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-300">
        <p>Registered users could not be loaded: {error.message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="border-b border-border pb-5">
        <p className="eyebrow">Store accounts</p>
        <h1 className="mt-1 text-2xl font-semibold text-ivory">Users</h1>
        <p className="mt-1 text-sm text-grey">{users.length} registered accounts</p>
      </header>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="table-scroll w-full text-left text-sm">
            <thead className="panel-kicker border-b border-border bg-bg-soft text-xs text-grey">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-5 py-3 font-medium">Account status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4 font-medium text-ivory">{user.name || "—"}</td>
                  <td className="px-4 py-4 text-grey">{user.email || "—"}</td>
                  <td className="px-4 py-4 text-grey">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-grey">
                      {user.confirmed ? "Email confirmed" : "Email not confirmed"}
                    </span>
                    {user.role === "admin" ? (
                      <span className="ml-2 rounded-full border border-gold/40 px-2 py-0.5 text-xs text-gold">
                        Admin
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-grey">
                    No registered users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
