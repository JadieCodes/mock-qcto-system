import { useNavigate } from 'react-router-dom';

export default function ProfilesLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Profiles</h1>
        <p className="text-gray-600 mb-8">Choose an option to continue:</p>

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
      </div>
    </div>
  );
}
