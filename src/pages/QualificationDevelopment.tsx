import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QualificationCyclePlan from "./qualifications/QualificationCyclePlan";
import PhaseDevelopment from "./qualifications/PhaseDevelopment";

export default function QualificationsDevelopment() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Qualifications Development</h2>
        <p className="text-muted-foreground">
          Manage qualification development phases and cycle plans
        </p>
      </div>

      <Tabs defaultValue="cycle-plan" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cycle-plan">Qualification Development Plan</TabsTrigger>
          <TabsTrigger value="phase-development">Phase Development (Design Tool)</TabsTrigger>
        </TabsList>
        <TabsContent value="cycle-plan">
          <QualificationCyclePlan />
        </TabsContent>
        <TabsContent value="phase-development">
          <PhaseDevelopment />
        </TabsContent>
      </Tabs>
    </div>
  );
}