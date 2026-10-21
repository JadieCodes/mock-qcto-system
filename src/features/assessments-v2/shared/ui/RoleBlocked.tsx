// CR-018: SDPs must not see EISA Instrument Validation at all. This renders instead of the
// module's real content for any role the nav item is hidden for — it protects a direct URL
// visit too, not just the nav link.
export function RoleBlocked() {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
      <p className="font-semibold text-gray-900">Not available for this role</p>
      <p className="text-sm text-gray-500 mt-1">
        This section isn't part of your current role's access. Switch roles using the switcher above if you reached this by a
        direct link.
      </p>
    </div>
  );
}
