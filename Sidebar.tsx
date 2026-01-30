
import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  // Management only menu items
  const menuItems = [
    { to: '/dashboard', icon: 'fa-chart-pie', label: 'MIS DASHBOARD' },
    { to: '/reports', icon: 'fa-file-invoice', label: 'QUALITY REPORTS' },
    { to: '/users', icon: 'fa-users-cog', label: 'USER MANAGEMENT' },
  ];

  return (
    <aside className="w-80 bg-white border-r border-gray-200 hidden lg:flex flex-col">
      <div className="p-8">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">System Management</p>
        <nav className="space-y-4">
          {menuItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all font-black text-sm uppercase tracking-tight border-4 ${
                  isActive 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-200 scale-105' 
                  : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-blue-700 hover:border-slate-100'
                }`
              }
            >
              <i className={`fas ${item.icon} text-xl`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-8 border-t border-gray-100">
        <div className="bg-blue-600 rounded-[2rem] p-6 shadow-xl shadow-blue-100">
          <p className="text-xs font-black text-blue-100 mb-2 uppercase tracking-widest">Network Status</p>
          <div className="flex items-center gap-3 text-white font-black text-xs">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></span>
            CLOUD SYNCHRONIZED
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
