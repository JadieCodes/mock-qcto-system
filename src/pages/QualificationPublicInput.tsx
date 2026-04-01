export default function QualificationPublicInput() {
  return (
    <div>
      <h3 className="text-lg font-semibold">
        Qualifications Public Input
      </h3>

      <div className="space-y-3 mt-4">
        <PublicInputCard />
        <PublicInputCard />
      </div>
    </div>
  );
}

function PublicInputCard() {
  return (
    <div className="border rounded p-3">
      <p className="font-medium">Industry Feedback</p>
      <p className="text-sm text-muted-foreground">
        Recommendation to update workplace component
      </p>

      <button className="mt-2 text-primary">
        Review & Resolve
      </button>
    </div>
  );
}
