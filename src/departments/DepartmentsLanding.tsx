import { Building2, Book, CheckCircle, ClipboardList, Award, FileSearch, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DepartmentsLanding() {
  const navigate = useNavigate();

  const departments = [
    {
      id: "certification",
      title: "Certification Domain",
      description: "Manage certification batches, intakes, integrations & printing",
      icon: CheckCircle,
      route: "/certification",
    },
    {
      id: "qualifications",
      title: "Qualifications Domain",
      description: "Manage qualification programs and curriculum frameworks",
      icon: Book,
      route: "/departments/qualifications",
    },
    {
      id: "assessment",
      title: "Assessment Domain",
      description: "Manage learners, assessors and assessment processes",
      icon: ClipboardList,
      route: "/departments/assessment",
    },
    {
      id: "accreditation",
      title: "Accreditation Domain",
      description: "View and manage accreditation records",
      icon: Award,
      route: "/departments/accreditation",
    },
    {
      id: "qa",
      title: "Quality Assurance Domain",
      description: "Moderation, verification & compliance reports",
      icon: FileSearch,
      route: "/departments/qa",
    },
    {
      id: "research",
      title: "Research Domain",
      description: "Access stats, analytics & sector insights",
      icon: Building2,
      route: "/departments/research",
    },
  ];

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 p-10">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Selection
        </button>
      </div>

      <h1 className="text-4xl font-bold text-gray-800 mb-10 text-center">
        Select a Department
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {departments.map(({ id, title, description, icon: Icon, route }) => (
          <div
            key={id}
            onClick={() => navigate(route)}
            className="cursor-pointer p-8 bg-white rounded-3xl shadow-lg border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all"
          >
            <Icon className="w-14 h-14 text-blue-700 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600 text-md">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}