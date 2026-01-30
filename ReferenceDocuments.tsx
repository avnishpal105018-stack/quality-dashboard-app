
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';

const DOCUMENTS = [
  { 
    id: 'rf-coding-doc', 
    title: 'RF Coding Area Document', 
    category: 'Engineering Standard', 
    icon: 'fa-microchip', 
    date: '2024-05-15', 
    type: 'form',
    path: '/module/rf-docs/rf-coding-check'
  },
  { 
    id: 'process-check-sheet', 
    title: 'Process Check Sheet – Coding Area', 
    category: 'Daily Audit', 
    icon: 'fa-tasks', 
    date: '2024-06-01', 
    type: 'form',
    path: '/module/rf-docs/process'
  },
  { 
    id: 'patrolling-inspection', 
    title: 'Patrolling Inspection – Coding Area (1 Phase)', 
    category: 'Quality Monitoring', 
    icon: 'fa-user-ninja', 
    date: '2024-06-05', 
    type: 'form',
    path: '/module/rf-docs/rf-patrolling'
  }
];

const ReferenceDocuments: React.FC = () => {
  const navigate = useNavigate();

  const handleDocClick = (doc: any) => {
    if (doc.type === 'form') {
      navigate(doc.path);
    } else {
      // PDF Viewer logic - Mapping is exact
      window.open(doc.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8">
      <PublicHeader />
      
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 mt-8">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">Coding Area Documents</h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 italic">Industrial Verification Hub</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DOCUMENTS.map(doc => (
          <button 
            key={doc.id} 
            onClick={() => handleDocClick(doc)}
            className="bg-white p-8 rounded-[3rem] border-4 border-slate-100 shadow-xl flex flex-col group hover:border-blue-600 transition-all text-left w-full h-full min-h-[300px]"
          >
             <div className="flex items-center gap-6 mb-6">
               <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-2xl group-hover:rotate-12 transition-transform">
                  <i className={`fas ${doc.icon}`}></i>
               </div>
               <div className="flex-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">{doc.category}</span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{doc.title}</h3>
               </div>
             </div>

             <div className="mb-6">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-tight line-clamp-2">
                 Digital entry and tracking portal for industrial quality verification. 
                 Public access enabled for reporting and reference.
               </p>
             </div>

             <div className="mt-auto flex flex-col gap-4">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">
                   <span>Revision: {doc.date}</span>
                   <span className="text-emerald-600">
                     <i className="fas fa-check-shield"></i>
                     VERIFIED
                   </span>
                </div>
                
                <div className="w-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                   <i className={`fas ${doc.type === 'form' ? 'fa-pen-to-square' : 'fa-file-pdf'}`}></i>
                   {doc.type === 'form' ? 'START DATA ENTRY' : 'OPEN DOCUMENT'}
                </div>
             </div>
          </button>
        ))}
      </div>

      <div className="mt-16 p-10 bg-blue-50/50 rounded-[3rem] border-4 border-slate-100 flex flex-col md:flex-row items-center gap-8 shadow-inner">
         <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-4xl shadow-xl shrink-0">
            <i className="fas fa-shield-halved"></i>
         </div>
         <div className="text-center md:text-left">
           <h4 className="text-xl font-black text-blue-900 uppercase tracking-tight">Security & Compliance Terminal</h4>
           <p className="font-black text-blue-700/60 uppercase text-[10px] tracking-widest leading-relaxed mt-2">
              All digital entries are appended to the Master Registry. Manual paper checksheets are decommissioned. 
              Credentials are no longer required for viewing Engineering Standards.
           </p>
         </div>
      </div>
    </div>
  );
};

export default ReferenceDocuments;
