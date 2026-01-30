
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';

const FillRecordSelection: React.FC = () => {
  const navigate = useNavigate();

  const modules = [
    { 
      path: '/module/rf', 
      label: 'RF Coding Area', 
      icon: 'fa-microchip', 
      gradient: 'from-blue-500 to-blue-700',
      bgSoft: 'bg-blue-50',
      textColor: 'text-blue-900',
      subtitle: 'NG Data Entry'
    },
    { 
      path: '/module/pcb-1ph', 
      label: 'Main PCB 1 Phase', 
      icon: 'fa-bolt', 
      gradient: 'from-green-500 to-green-700',
      bgSoft: 'bg-green-50',
      textColor: 'text-green-900',
      subtitle: 'Production Logging'
    },
    { 
      path: '/module/pcb-3ph', 
      label: 'Main PCB 3 Phase', 
      icon: 'fa-plug-circle-bolt', 
      gradient: 'from-teal-500 to-teal-700',
      bgSoft: 'bg-teal-50',
      textColor: 'text-teal-900',
      subtitle: 'Production Logging'
    },
    { 
      path: '/module/ltct', 
      label: 'LTCT Coding Area', 
      icon: 'fa-cogs', 
      gradient: 'from-orange-500 to-orange-700',
      bgSoft: 'bg-orange-50',
      textColor: 'text-orange-900',
      subtitle: 'Production Logging'
    },
    { 
      path: '/module/operator-tracking', 
      label: 'Operator Tracking', 
      icon: 'fa-users-viewfinder', 
      gradient: 'from-indigo-600 to-purple-700',
      bgSoft: 'bg-indigo-50',
      textColor: 'text-indigo-900',
      subtitle: 'Deployment Tracker'
    },
    { 
      path: '/observation', 
      label: 'Process Observation', 
      icon: 'fa-clipboard-check', 
      gradient: 'from-purple-500 to-purple-700',
      bgSoft: 'bg-purple-50',
      textColor: 'text-purple-900',
      subtitle: 'Audit Discovery'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 md:px-8">
      <PublicHeader />
      
      <div className="text-center mb-12 mt-8">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Production MIS</h2>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic">Industrial Operations Selection Node</p>
      </div>

      {/* Grid Layout containing modules only (Registry removed from here) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modules.map((m) => (
          <button
            key={m.path}
            onClick={() => navigate(m.path)}
            className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-slate-50 flex flex-col items-center text-center hover:shadow-2xl hover:border-blue-200 transition-all group relative overflow-hidden h-full min-h-[320px] justify-center"
          >
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center text-3xl md:text-4xl mb-6 bg-gradient-to-br ${m.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <i className={`fas ${m.icon}`}></i>
            </div>
            <span className={`font-black ${m.textColor} text-xl md:text-2xl uppercase tracking-tighter leading-tight`}>
              {m.label}
            </span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">
              {m.subtitle}
            </p>
            <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className={`text-[10px] font-black uppercase tracking-widest ${m.textColor.replace('900', '500')}`}>
                Access Terminal <i className="fas fa-arrow-right ml-2"></i>
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-16 flex justify-center pb-20">
        <button 
          onClick={() => navigate('/')}
          className="bg-white text-slate-500 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.4em] hover:bg-slate-900 hover:text-white transition-all flex items-center gap-5 shadow-xl border-4 border-slate-100 active:scale-95"
        >
          <i className="fas fa-power-off"></i>
          Exit to System Home
        </button>
      </div>
    </div>
  );
};

export default FillRecordSelection;
