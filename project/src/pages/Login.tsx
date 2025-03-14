import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [centre, setCentre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: user.id,
              full_name: fullName,
              student_id: studentId,
              centre,
            }
          ]);
          if (profileError) throw profileError;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center bg-cover bg-center relative"
      style={{ 
        backgroundImage: 'url("https://images.unsplash.com/photos/a-light-fixture-hanging-from-the-ceiling-of-a-room-7ej8VWfwFsg?auto=format&fit=crop&w=2940")',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backgroundBlend: 'overlay'
      }}
    >
      <div className="w-full bg-blue-600/90 backdrop-blur-sm py-4 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <img src="https://www.cdac.in/img/cdac-logo.png" alt="CDAC Logo" className="h-12 brightness-0 invert" />
            <h1 className="text-3xl font-bold text-white ml-4">Student Portal</h1>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="mb-6">
          <div className="flex border-b border-blue-200">
            <button
              className={`flex-1 py-2 ${isLogin ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setIsLogin(true)}
            >
              <LogIn className="inline mr-2" size={18} />
              Login
            </button>
            <button
              className={`flex-1 py-2 ${!isLogin ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setIsLogin(false)}
            >
              <UserPlus className="inline mr-2" size={18} />
              Sign Up
            </button>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
            required
          />
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
                required
              />
              <input
                type="text"
                placeholder="Student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
                required
              />
              <input
                type="text"
                placeholder="CDAC Centre"
                value={centre}
                onChange={(e) => setCentre(e.target.value)}
                className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
                required
              />
            </>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-4">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}