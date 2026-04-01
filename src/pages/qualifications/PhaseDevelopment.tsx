import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhaseContent from "./PhaseContent";

const phases = [
  { id: "phase1", label: "Phase 1: Development Phases Overview" },
  { id: "phase2", label: "Phase 2: Scoping" },
  { id: "phase3", label: "Phase 3: Profile" },
  { id: "phase4", label: "Phase 4: Curriculum Specification Development" },
  { id: "phase5", label: "Phase 5: Knowledge / Practice / Workplace Requirements" },
  { id: "phase6", label: "Phase 6: Qualification Document" },
  { id: "phase7", label: "Phase 7: QAS Verification" },
  { id: "phase8", label: "Phase 8: Final Verification" },
];

export default function PhaseDevelopment() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Phase Development (Design Tool)</h3>
        <p className="text-sm text-muted-foreground">
          Manage each phase of the qualification development process
        </p>
      </div>

      <Tabs defaultValue="phase1" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent">
          {phases.map((phase) => (
            <TabsTrigger
              key={phase.id}
              value={phase.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-xs"
            >
              {phase.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {phases.map((phase) => (
          <TabsContent key={phase.id} value={phase.id} className="mt-6">
            <PhaseContent phaseId={phase.id} phaseLabel={phase.label} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}