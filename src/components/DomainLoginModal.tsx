import { useState } from "react";
import { Lock, X } from "lucide-react";

interface DomainLoginModalProps {
  domainName: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Domain passwords for each domain
const domainPasswords: Record<string, string> = {
  "Certification Domain": "CertPass123",
  "Qualifications Domain": "QualPass123",
  "Assessment Domain": "AssessPass123",
  "Accreditation Domain": "AccredPass123",
  "Quality Assurance Domain": "QAPass123",
  "Research Domain": "ResearchPass123",
};

export default function DomainLoginModal({ domainName, onClose, onSuccess }: DomainLoginModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      const correctPassword = domainPasswords[domainName];
      
      if (password === correctPassword) {
        // Store successful login for this domain
        const unlockedDomains = JSON.parse(localStorage.getItem("unlockedDomains") || "[]");
        if (!unlockedDomains.includes(domainName)) {
          unlockedDomains.push(domainName);
          localStorage.setItem("unlockedDomains", JSON.stringify(unlockedDomains));
        }
        onSuccess();
      } else {
        setError("Incorrect password. Please try again.");
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Access Required</h2>
            <p className="text-gray-600 mt-2">
              Please enter the password to access <strong>{domainName}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter domain password"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Verifying...
                </>
              ) : (
                "Access Domain"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}