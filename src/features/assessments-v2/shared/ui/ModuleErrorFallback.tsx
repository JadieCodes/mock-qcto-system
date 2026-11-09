import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ModuleErrorFallback() {
  const navigate = useNavigate();
  return (
    <div role="alert" className="mx-auto max-w-md space-y-3 rounded-2xl border bg-white p-6 text-center">
      <p className="text-sm text-gray-700">Something went wrong on this screen. Your data is safe. Go back or reload.</p>
      <Button type="button" variant="outline" onClick={() => navigate(-1)}>
        Back
      </Button>
    </div>
  );
}
