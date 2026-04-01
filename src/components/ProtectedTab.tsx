import { useState, useEffect } from "react";
import DomainLoginModal from "./DomainLoginModal";

interface ProtectedTabProps {
  domainName: string;
  children: React.ReactNode;
}

export default function ProtectedTab({ domainName, children }: ProtectedTabProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if this domain has been unlocked
    const unlockedDomains = JSON.parse(localStorage.getItem("unlockedDomains") || "[]");
    setIsUnlocked(unlockedDomains.includes(domainName));
  }, [domainName]);

  const handleAccess = () => {
    if (!isUnlocked) {
      setShowModal(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsUnlocked(true);
    setShowModal(false);
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="bg-gray-100 rounded-full p-6 mb-4">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V6a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Access Restricted</h3>
        <p className="text-gray-600 mb-6">
          This domain is password protected. Please enter the domain password to access this content.
        </p>
        <button
          onClick={handleAccess}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Enter Password
        </button>

        {showModal && (
          <DomainLoginModal
            domainName={domainName}
            onClose={() => setShowModal(false)}
            onSuccess={handleLoginSuccess}
          />
        )}
      </div>
    );
  }

  return <>{children}</>;
}