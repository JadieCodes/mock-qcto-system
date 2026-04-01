import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Building2 } from "lucide-react";

export default function ChooseUser() {
  const navigate = useNavigate();
  const [loadingOption, setLoadingOption] = useState<string | null>(null);

  const options = [
    {
      id: "profiles",
      title: "Profiles",
      description: "Create & manage company profiles",
      icon: User,
      route: "/profiles",
    },
    {
      id: "departments",
      title: "Departments",
      description: "Access your SETA domains",
      icon: Building2,
      route: "/departments",
    },
  ];

  const handleClick = (optionId: string, route: string) => {
    setLoadingOption(optionId);
    setTimeout(() => navigate(route), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 p-6">
      <div className="text-center max-w-4xl w-full">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-10 drop-shadow-md">
          Welcome to Your Workspace
        </h1>
        <p className="text-lg text-gray-700 mb-12">
          Select an area to continue
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 place-items-center">
          {options.map((option) => {
            const Icon = option.icon;
            const isLoading = loadingOption === option.id;

            return (
              <div
                key={option.id}
                onClick={() => handleClick(option.id, option.route)}
                className={`
                  backdrop-blur-xl bg-white/30 border border-white/40
                  rounded-3xl p-10 cursor-pointer w-80 h-80 flex flex-col 
                  items-center justify-center transition-all duration-300 shadow-xl
                  hover:shadow-2xl transform hover:-translate-y-2
                  ${isLoading ? "bg-blue-600 text-white scale-105" : ""}
                `}
              >
                {isLoading ? (
                  <Loader2 className="h-12 w-12 mb-6 animate-spin" />
                ) : (
                  <Icon className="h-16 w-16 text-blue-700 mb-6" />
                )}

                <h2 className="text-3xl font-bold mb-2">{option.title}</h2>

                <p className="text-md opacity-80">{option.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
