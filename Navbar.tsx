
import React from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg text-white font-bold text-xl">K</div>
        <div>
          <h1 className="text-xl font-bold text-blue-900 leading-none">Kimbal Technology</h1>
          <p className="text-xs text-green-600 font-semibold tracking-widest uppercase">Quality Monitoring System</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-bold text-gray-800">{user.name}</span>
          <span className="text-xs text-gray-500">{user.role} | {user.employeeId}</span>
        </div>
        <button 
          onClick={onLogout}
          className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <i className="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
