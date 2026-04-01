import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ProfilesLanding() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Profiles</h1>
        <p className="text-gray-600 mb-8 text-center">Choose an option to continue:</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/profiles/login')}
            className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>

          <button
            onClick={() => navigate('/profiles/create')}
            className="border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition"
          >
            Create Profile
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Selection
          </button>
        </div>
      </div>
    </div>
  );
}