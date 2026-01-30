
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const from = location.state?.from || '/dashboard';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both Username and Password.');
      return;
    }

    const user = dbService.validateCredentials(username, password);
    if (user) {
      if (user.status === 'disabled') {
        setError('Your account has been disabled. Contact manager.');
        return;
      }
      dbService.updateLastLogin(user.id);
      onLogin(user);
      navigate(from);
    } else {
      setError('Invalid credentials. Check Username or Password.');
    }
  };

  const hasValue = (val: string) => val.trim().length > 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 p-4 overflow-y-auto">
      <button 
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 bg-white px-5 py-3 rounded-2xl shadow-lg border-4 border-slate-100 text-blue-900 hover:text-blue-600 font-black transition-all flex items-center gap-3 group"
      >
        <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-sm uppercase tracking-widest">Back to Home</span>
      </button>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md my-auto relative border-4 border-white/50">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl shadow-blue-200">
            K
          </div>
          <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">System Access</h2>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2 text-center">Kimbal Technology Quality MIS Secure Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-sm font-black border-4 border-red-100 flex items-center gap-4 animate-bounce">
              <i className="fas fa-exclamation-triangle text-xl"></i>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-widest ml-2">System Username</label>
            <div className="relative group">
              <span className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${hasValue(username) ? 'text-blue-600' : 'text-slate-400'}`}>
                <i className="fas fa-user text-lg"></i>
              </span>
              <input
                type="text"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full pl-16 pr-6 py-5 border-4 rounded-2xl transition-all text-xl font-black text-slate-900 caret-blue-600 outline-none focus:ring-8 focus:ring-blue-100 ${
                  hasValue(username) ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-400'
                }`}
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-widest ml-2">Access Password</label>
            <div className="relative group">
              <span className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${hasValue(password) ? 'text-blue-600' : 'text-slate-400'}`}>
                <i className="fas fa-lock text-lg"></i>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-16 pr-6 py-5 border-4 rounded-2xl transition-all text-xl font-black text-slate-900 caret-blue-600 outline-none focus:ring-8 focus:ring-blue-100 ${
                  hasValue(password) ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-400'
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-2xl shadow-2xl shadow-blue-200 transition-all flex items-center justify-center gap-4 text-xl transform active:scale-95 border-b-8 border-blue-800"
          >
            SIGN IN TO SYSTEM
            <i className="fas fa-shield-alt"></i>
          </button>
        </form>

        <div className="mt-12 pt-10 border-t-4 border-slate-50 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
             {/* One-time rule: User ID and Password creation */}
             <Link to="/register" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-black transition-all shadow-xl">
               <i className="fas fa-user-plus"></i>
               Create User ID and Password
             </Link>
             <div className="flex justify-between items-center px-2">
                <Link to="/forgot-password" title="Recover your credentials" className="text-slate-400 hover:text-blue-600 transition-colors font-black text-xs uppercase tracking-widest">
                  Recovery Center
                </Link>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">v2.1 Industrial</p>
             </div>
          </div>
          <div className="flex items-center justify-center gap-2 opacity-30">
            <i className="fas fa-lock text-[10px]"></i>
            <p className="text-center text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Secure Industrial Node</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
