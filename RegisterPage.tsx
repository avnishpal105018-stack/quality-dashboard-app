
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { UserRole } from '../types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<{
    name: string;
    employeeId: string;
    mobile: string;
    email: string;
    username: string;
    password: string;
    role: UserRole.SHIFT_INCHARGE | UserRole.MANAGER;
  }>({
    name: '',
    employeeId: '',
    mobile: '',
    email: '',
    username: '',
    password: '',
    role: UserRole.SHIFT_INCHARGE
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!dbService.isUsernameAvailable(formData.username)) {
      setError('Username already taken. Please choose another.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    dbService.addUser(formData);
    alert('Account created successfully! You can now login.');
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 p-4 overflow-y-auto">
      {/* Back Button - Top Left */}
      <button 
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 bg-white px-5 py-3 rounded-2xl shadow-lg border border-gray-100 text-blue-900 hover:text-blue-600 font-black transition-all flex items-center gap-3 group"
      >
        <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-sm uppercase tracking-widest">Back to Home</span>
      </button>

      <div className="bg-white p-8 my-8 rounded-[2.5rem] shadow-2xl w-full max-w-xl relative border border-white/50">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-xl shadow-blue-100">K</div>
          <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Create System Account</h2>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Management Registration</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-black border border-red-100 mb-6 flex items-center gap-3">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" placeholder="Enter your full name" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Employee ID</label>
            <input type="text" name="employeeId" required value={formData.employeeId} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" placeholder="KIM-XXXX" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Mobile Number</label>
            <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" placeholder="98XXXXXXXX" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" placeholder="corporate@kimbal.com" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Username</label>
            <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" placeholder="Pick a username" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Password</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" placeholder="Min 6 characters" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Assigned Role</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-blue-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all">
              <option value={UserRole.SHIFT_INCHARGE}>{UserRole.SHIFT_INCHARGE}</option>
              <option value={UserRole.MANAGER}>{UserRole.MANAGER}</option>
            </select>
          </div>
          
          <button type="submit" className="md:col-span-2 w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-100 mt-6 text-xl flex items-center justify-center gap-3 transform active:scale-[0.98] transition-all">
            REGISTER ACCOUNT
            <i className="fas fa-id-card"></i>
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-50 text-center">
          <span className="text-gray-400 font-bold text-sm">Already have access? </span>
          <Link to="/login" className="text-blue-600 font-black hover:underline ml-1">Login to Portal</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
