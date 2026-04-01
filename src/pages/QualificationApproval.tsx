const approvalLevels = [
  "Responsible Manager",
  "Deputy Director",
  "Director",
  "Chief Director",
  "CEO",
  "SAQA",
];

export default function QualificationApproval() {
  return (
    <div>
      <h3 className="text-lg font-semibold">
        Qualification Approval
      </h3>

      <div className="space-y-3 mt-4">
        {approvalLevels.map((level) => (
          <ApprovalStep key={level} role={level} />
        ))}
      </div>
    </div>
  );
}

function ApprovalStep({ role }: { role: string }) {
  return (
    <div className="border rounded p-3 flex justify-between">
      <span>{role}</span>
      <button className="bg-green-600 text-white px-3 py-1 rounded">
        Approve
      </button>
    </div>
  );
}
