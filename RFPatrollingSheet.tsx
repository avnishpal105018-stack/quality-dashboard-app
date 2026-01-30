
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import PublicHeader from '../components/PublicHeader';
import { PatrollingCheckSheetRecord } from '../types';

const CHECKPOINTS = [
  "Proper soldering without short circuit",
  "SIM inserted correctly",
  "Proper fitment, no damage",
  "Correct firmware used, no error",
  "Check firmwere version Matches customer requirement",
  "No scratches, clean finish, all components fitted properly"
];

const SHIFT_A_SLOTS = [
  "07:00 AM-08:00 AM", "08:00 AM-09:00 AM", "09:00 AM-10:00 AM", 
  "10:00 AM-11:00 AM", "11:00 AM-12:00 PM", "12:00 PM-01:00 PM", 
  "01:00 PM-02:00 PM", "02:00 PM-03:00 PM", "03:00 PM-03:30 PM"
];

const SHIFT_B_SLOTS = [
  "03:30 PM-04:30 PM", "04:30 PM-05:30 PM", "05:30 PM-06:30 PM", 
  "06:30 PM-07:30 PM", "07:30 PM-08:30 PM", "08:30 PM-09:30 PM", 
  "09:30 PM-10:30 PM", "10:30 PM-11:30 PM", "11:30 PM-12:00 AM"
];

const RFPatrollingSheet: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const clickTimer = useRef<{ [key: string]: any }>({});
  const [activeSlotIdx, setActiveSlotIdx] = useState(0);
  
  const [formData, setFormData] = useState<Omit<PatrollingCheckSheetRecord, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    area: 'RF Coding Area',
    lineNo: '',
    lineLeader: '',
    supervisor: '',
    qualityChecker: '',
    userId: '',
    shift: 'A',
    timeSlot: SHIFT_A_SLOTS[0],
    checkpoints: CHECKPOINTS.map((desc, idx) => ({
      id: `PATR_RF_COD_${idx}`,
      description: desc,
      status: '' as any,
      remarks: ''
    }))
  });

  const availableSlots = useMemo(() => formData.shift === 'A' ? SHIFT_A_SLOTS : SHIFT_B_SLOTS, [formData.shift]);

  const handleStatusClick = (idx: number) => {
    const key = `cp_${idx}`;
    if (clickTimer.current[key]) {
      window.clearTimeout(clickTimer.current[key]);
      clickTimer.current[key] = null;
      updateStatus(idx, 'NOK');
    } else {
      clickTimer.current[key] = window.setTimeout(() => {
        updateStatus(idx, 'OK');
        clickTimer.current[key] = null;
      }, 300);
    }
  };

  const updateStatus = (idx: number, status: 'OK' | 'NOK') => {
    const newCP = [...formData.checkpoints];
    newCP[idx].status = status;
    if (status === 'OK') newCP[idx].remarks = '';
    setFormData(prev => ({ ...prev, checkpoints: newCP }));
  };

  const handleRemarksChange = (idx: number, val: string) => {
    const newCP = [...formData.checkpoints];
    newCP[idx].remarks = val;
    setFormData(prev => ({ ...prev, checkpoints: newCP }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lineNo) { alert("Line Number is required."); return; }
    
    const unanswered = formData.checkpoints.some(cp => !cp.status);
    if (unanswered) { alert("Please complete all checkpoints for the active slot."); return; }

    const missingRemarks = formData.checkpoints.some(cp => cp.status === 'NOK' && !cp.remarks.trim());
    if (missingRemarks) { alert("Remarks are mandatory for any NOK status."); return; }

    setIsSubmitting(true);
    try {
      await dbService.addPatrollingSheet({ 
        ...formData, 
        timeSlot: availableSlots[activeSlotIdx],
        userId: 'OPERATOR' 
      });
      setIsSubmitted(true);
    } catch (err) {
      alert("Error sync failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-slate-100 max-w-md w-full">
           <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">
              <i className="fas fa-check-double"></i>
           </div>
           <h2 className="text-3xl font-black text-slate-900 uppercase mb-4 tracking-tighter">RF Patrol Committed</h2>
           <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-10">Historical record created for {availableSlots[activeSlotIdx]}.</p>
           <button onClick={() => navigate('/module/rf-docs/reference')} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">FINISH</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32">
      <div className="bg-[#1e293b] text-white px-6 py-6 sticky top-0 z-50 flex items-center gap-6 shadow-xl">
        <button onClick={() => navigate(-1)} className="text-2xl hover:text-blue-400 transition-colors">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
            <i className="fas fa-microchip"></i>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">RF Coding Area Patrol</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-lg border-2 border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Line Number</label>
            <input 
              type="text" 
              value={formData.lineNo}
              onChange={(e) => setFormData(p => ({...p, lineNo: e.target.value}))}
              placeholder="Line No."
              className="w-full p-6 bg-slate-50 border-4 border-slate-200 rounded-2xl font-black text-2xl text-slate-900 outline-none focus:border-blue-500 transition-all shadow-inner"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Active Shift</label>
            <select 
              value={formData.shift}
              onChange={(e) => {
                const s = e.target.value as 'A'|'B';
                setFormData(p => ({...p, shift: s}));
                setActiveSlotIdx(0);
              }}
              className="w-full p-6 bg-slate-50 border-4 border-slate-200 rounded-2xl font-black text-2xl text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="A">SHIFT A (07:00 AM - 03:30 PM)</option>
              <option value="B">SHIFT B (03:30 PM - 12:00 AM)</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#f8fafc] text-slate-900 border-b-4 border-slate-50">
              <tr>
                <th className="px-6 py-6 w-12 text-center text-xs font-black uppercase tracking-widest">Sl. No.</th>
                <th className="px-6 py-6 w-96 text-xs font-black uppercase tracking-widest">Check Points</th>
                {availableSlots.map((slot, sIdx) => (
                  <th 
                    key={slot} 
                    onClick={() => setActiveSlotIdx(sIdx)}
                    className={`px-2 py-6 text-center text-[9px] font-black uppercase tracking-tight cursor-pointer transition-colors border-x border-slate-100 ${activeSlotIdx === sIdx ? 'bg-blue-600 text-white' : 'hover:bg-slate-200'}`}
                  >
                    {slot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {formData.checkpoints.map((cp, idx) => (
                <React.Fragment key={cp.id}>
                  <tr className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-6 py-8 text-center font-black text-slate-400 text-sm">{idx + 1}</td>
                    <td className="px-6 py-8">
                      <p className="font-bold text-slate-800 text-[13px] leading-tight uppercase tracking-tight">{cp.description}</p>
                    </td>
                    {availableSlots.map((_, sIdx) => (
                      <td key={sIdx} className={`px-2 py-8 border-x border-slate-50 ${activeSlotIdx === sIdx ? 'bg-blue-50/30' : ''}`}>
                        {activeSlotIdx === sIdx ? (
                          <div className="flex items-center justify-center">
                            <div 
                              onClick={() => handleStatusClick(idx)}
                              className={`w-12 h-12 rounded-xl border-4 cursor-pointer transition-all flex items-center justify-center text-xl shadow-sm select-none ${
                                cp.status === 'OK' ? 'bg-green-500 border-green-600 text-white' : 
                                cp.status === 'NOK' ? 'bg-red-500 border-red-600 text-white' : 
                                'bg-slate-100 border-slate-200 text-slate-300'
                              }`}
                            >
                              {cp.status === 'OK' && <span className="font-black">O</span>}
                              {cp.status === 'NOK' && <span className="font-black">X</span>}
                              {!cp.status && <div className="w-3 h-0.5 bg-slate-300 rounded-full"></div>}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center opacity-10">
                             <div className="w-10 h-10 rounded-lg border-2 border-slate-200"></div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                  {cp.status === 'NOK' && (
                    <tr className="bg-red-50/30">
                      <td colSpan={availableSlots.length + 2} className="px-10 pb-6 pt-0">
                        <input 
                          type="text" 
                          value={cp.remarks}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          placeholder="REQUIRED: Describe the issue..."
                          className="w-full p-4 bg-white border-4 border-red-200 rounded-xl font-bold text-sm text-red-900 outline-none focus:border-red-500 shadow-inner"
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-8 border-slate-100 p-6 flex gap-4 items-center z-50">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-[#0f172a] hover:bg-black text-white py-6 rounded-2xl font-black text-2xl uppercase tracking-tighter flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all"
        >
          {isSubmitting ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-save"></i>}
          Save Record
        </button>
      </div>
    </div>
  );
};

export default RFPatrollingSheet;
