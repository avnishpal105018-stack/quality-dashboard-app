
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface LandingPageProps {
  user: User | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 p-6 overflow-y-auto">
      <div className="w-full max-w-6xl flex flex-col gap-10">
        
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-2xl">K</div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Kimbal Quality MIS</h1>
          <p className="text-xs text-blue-600 font-black uppercase tracking-[0.4em] mt-2">Factory Information System v2.1</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Fill Record Flow */}
          <div className={`bg-white p-10 rounded-[3rem] shadow-xl border-t-[12px] border-green-600 flex flex-col items-center text-center transform transition-all hover:scale-[1.02] ${user ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <div className="w-20 h-20 bg-green-100 rounded-[2rem] flex items-center justify-center text-green-600 text-4xl mb-6">
              <i className="fas fa-file-pen"></i>
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase mb-4">NG Entry</h2>
            <p className="text-gray-500 mb-8 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Public Terminal<br/>Operator & Inspector Flow
            </p>
            <button 
              onClick={() => navigate('/fill-record')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl shadow-lg shadow-green-100 text-lg flex items-center justify-center gap-3 transition-all"
            >
              START ENTRY
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          {/* New Landing Card: Coding Area Documents (RENAMED) */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border-t-[12px] border-slate-800 flex flex-col items-center text-center transform transition-all hover:scale-[1.02]">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-800 text-4xl mb-6">
              <i className="fas fa-book-atlas"></i>
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase mb-4 text-center leading-tight">Coding Area Documents</h2>
            <p className="text-gray-500 mb-8 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Coding Area<br/>Compliance Documents
            </p>
            <button 
              onClick={() => navigate('/module/rf-docs/reference')}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-lg text-lg flex items-center justify-center gap-3 transition-all"
            >
              OPEN LIBRARY
              <i className="fas fa-folder-open"></i>
            </button>
          </div>

          {/* Management Portal */}
          <div className={`bg-white p-10 rounded-[3rem] shadow-xl border-t-[12px] border-blue-600 flex flex-col items-center text-center transform transition-all hover:scale-[1.02] ${user ? 'ring-8 ring-blue-500 ring-opacity-20' : ''}`}>
            <div className="w-20 h-20 bg-blue-100 rounded-[2rem] flex items-center justify-center text-blue-600 text-4xl mb-6">
              <i className="fas fa-user-shield"></i>
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase mb-4">Management</h2>
            <p className="text-gray-500 mb-8 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Restricted Access<br/>Dashboard & User Mgmt
            </p>
            <button 
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-100 text-lg flex items-center justify-center gap-3 transition-all"
            >
              {user ? 'GO TO MIS' : 'ADMIN LOGIN'}
              <i className={user ? 'fas fa-chart-line' : 'fas fa-lock'}></i>
            </button>
          </div>

        </div>

        <div className="text-center opacity-30">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Secure Industrial Network Connection — Active</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
