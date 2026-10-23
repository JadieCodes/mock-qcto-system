// Renders instead of the module's real content for any role the visibility matrix
// (shared/visibility/moduleAccess.ts) blocks — including a direct URL visit, not just a
// hidden nav link. Deliberately shows no data of any kind, only this message.
export function RoleBlocked() {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
      <p className="font-semibold text-gray-900">You do not have access</p>
      <p className="text-sm text-gray-400 mt-1">
        This section isn't part of your current role's access. Switch roles using the switcher above if you reached this by a
        direct link.
      </p>
    </div>
  );
}
