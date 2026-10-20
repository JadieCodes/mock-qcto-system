import type { NavItem } from '../../config/nav';

export function ComingSoon({ item }: { item: NavItem }) {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
      <p className="font-semibold text-gray-900">{item.label}</p>
      <p className="text-sm text-gray-500 mt-1">
        {item.comingInPhase ? `Built in Phase ${item.comingInPhase}.` : 'Not built yet.'}
      </p>
    </div>
  );
}
