
import React, { useState } from 'react';
import { dbService } from '../services/dbService';
import { UserRole } from '../types';

const UserManagement: React.FC = () => {
  const users = dbService.getUsers();
  const [renderTrigger, setRenderTrigger] = useState(0); 

  const toggleStatus = (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    dbService.updateUserStatus(userId, nextStatus);
    setRenderTrigger(prev => prev + 1);
  };

  const handleDelete = (userId: string, name: string) => {
    if (userId === '1') {
      alert("Primary Admin account cannot be deleted.");
      return;
    }
    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE account: ${name}? This action cannot be undone.`)) {
      dbService.deleteUser(userId);
      setRenderTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tight">Access Control</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Management Personnel Directory</p>
        </div>
        <div className="bg-blue-50 px-6 py-3 rounded-2xl border-4 border-blue-100 flex items-center gap-3">
          <i className="fas fa-users text-blue-600"></i>
          <span className="font-black text-blue-900 text-sm">{users.length} ACTIVE ACCOUNTS</span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="px-8 py-5 border-r border-slate-700">Account Identity</th>
              <th className="px-8 py-5 border-r border-slate-700">System Role</th>
              <th className="px-8 py-5 border-r border-slate-700">Audit Trail</th>
              <th className="px-8 py-5 border-r border-slate-700 text-center">Security Status</th>
              <th className="px-8 py-5 text-center">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-8 py-6 border-r border-slate-50">
                  <div className="font-black text-slate-900 text-lg uppercase tracking-tight">{u.name}</div>
                  <div className="text-xs font-black text-blue-600 mt-0.5">@{u.username} • ID: {u.employeeId}</div>
                </td>
                <td className="px-8 py-6 border-r border-slate-50">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
                    u.role === UserRole.MANAGER ? 'bg-red-50 border-red-200 text-red-700' :
                    u.role === UserRole.SHIFT_INCHARGE ? 'bg-purple-50 border-purple-200 text-purple-700' :
                    'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-6 border-r border-slate-50">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Entry</div>
                  <div className="text-xs font-bold text-slate-700 mt-1">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'PENDING ACTIVATION'}
                  </div>
                </td>
                <td className="px-8 py-6 border-r border-slate-50 text-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black border-2 ${
                    u.status === 'active' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}></span>
                    {u.status.toUpperCase()}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      onClick={() => toggleStatus(u.id, u.status)}
                      className={`text-[10px] font-black px-4 py-2.5 rounded-xl border-4 transition-all shadow-sm ${
                        u.status === 'active' 
                        ? 'border-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white' 
                        : 'border-green-100 text-green-600 hover:bg-green-600 hover:text-white'
                      }`}
                    >
                      {u.status === 'active' ? 'DISABLE' : 'ENABLE'}
                    </button>
                    {u.id !== '1' && (
                      <button 
                        onClick={() => handleDelete(u.id, u.name)}
                        className="text-[10px] font-black px-4 py-2.5 rounded-xl border-4 border-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        DELETE
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
