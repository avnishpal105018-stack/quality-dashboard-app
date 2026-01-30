
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PublicHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 mb-6 -mx-4 md:-mx-8 sticky top-0 z-10 flex items-center justify-between">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold transition-all text-sm px-3 py-2 rounded-lg hover:bg-gray-50"
      >
        <i className="fas fa-arrow-left"></i>
        <span>Back to start</span>
      </button>
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">K</div>
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest hidden sm:inline">Kimbal Technology</span>
      </div>
    </div>
  );
};

export default PublicHeader;
