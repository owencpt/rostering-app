import React, { useState } from 'react';
import { Calendar, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const LoginPage = () => {
  const { handleAuth: authHandler } = useAuth(); // Add this line
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Replace the existing handleAuth function with this:
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const result = await authHandler(authData, authMode);
      if (!result.success) {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-blue-600 mr-3" />
            <span className="text-2xl font-bold text-gray-900">RosterPro</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {authMode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {authMode === 'login' ? 'Sign in to access your schedule' : 'Join the team'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={authData.name}
                  onChange={(e) => setAuthData({...authData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={authData.role}
                  onChange={(e) => setAuthData({...authData, role: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={authData.email}
                onChange={(e) => setAuthData({...authData, email: e.target.value})}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={authData.password}
                onChange={(e) => setAuthData({...authData, password: e.target.value})}
                className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{authError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setAuthError('');
                setAuthData({ email: '', password: '', name: '', role: 'staff' });
              }}
              className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;