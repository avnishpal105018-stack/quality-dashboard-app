
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import PublicHeader from '../components/PublicHeader';
import { PatrollingCheckSheetRecord } from '../types';

const CHECKPOINTS = [
  "Check the Status in PCB is clear 1 done or not.",
  "Check the LED Display for Scratches and Black Dot defects free",
  "Check the cover open status work properly",
  "Check Meter Firmware as per coustomer & Check for NIC Firmware Version (it should be as per the Requirement)",
  "Check the PCB On/OFF condition in 5 sample (4 Ok ,1 NOK Hold the bin) Recheck",
  "Check Digit Cut on Display",
  "Check push botton working condition",
  "Check Display Blinking Issue",
  "Check the RTC it should be set to automatic (There should be no time gap)",
  "Check LED pulse Working Condition",
  "Check 3P & LTCT ON/OFF condition",
  "Check RF Art Work in 3P & 1P",
  "Remarks"
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

const RFCodingCheckpointForm: React.FC = () => {
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

  const handleStatusToggle = (idx: number) => {
    // Sl No 13 (index 12) is Remarks row, no status toggle there
    if (idx === 12) return;

    const key = `cp_${idx}`;
    if (clickTimer.current[key]) {
      window.clearTimeout(clickTimer.current[key]);
      clickTimer.current[key] = null;
      // Double Click -> NOK (X)
      updateStatus(idx, 'NOK');
    } else {
      clickTimer.current[key] = window.setTimeout(() => {
        // Single Click -> OK (O)
        updateStatus(idx, 'OK');
        clickTimer.current[key] = null;
      }, 300);
    }
  };

  const updateStatus = (idx: number, status: 'OK' | 'NOK') => {
    const newCP = [...formData.checkpoints];
    newCP[idx].status = status;
    // Don't auto-clear remarks if NOK, as user might want to keep it
    setFormData(prev => ({ ...prev, checkpoints: newCP }));
  };

  const handleRemarksChange = (idx: number, val: string) => {
    const newCP = [...formData.checkpoints];
    newCP[idx].remarks = val;
    setFormData(prev => ({ ...prev, checkpoints: newCP }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lineNo) { alert("Please enter Line Number."); return; }
    
    // Check parameters 1-12 (index 0-11)
    const unanswered = formData.checkpoints.slice(0, 12).some(cp => !cp.status);
    if (unanswered) { alert("Please mark status (O/X) for all 12 checkpoints in the active slot."); return; }

    const missingRemarks = formData.checkpoints.slice(0, 12).some(cp => cp.status === 'NOK' && !cp.remarks.trim());
    if (missingRemarks) { alert("Detailed remarks are mandatory for all NOK (X) entries."); return; }

    setIsSubmitting(true);
    try {
      await dbService.addPatrollingSheet({
        ...formData,
        timeSlot: availableSlots[activeSlotIdx],
        userId: formData.userId || 'OPERATOR',
      });
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      alert("Cloud synchronization failed. Check connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-slate-100 max-w-md w-full">
           <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">
              <i className="fas fa-clipboard-check"></i>
           </div>
           <h2 className="text-3xl font-black text-slate-900 uppercase mb-4 tracking-tighter">Patrol Entry Saved</h2>
           <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-10">Compliance record committed for {availableSlots[activeSlotIdx]}.</p>
           <button onClick={() => navigate('/module/rf-docs/reference')} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">CLOSE SHEET</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32">
      <div className="bg-[#1e293b] text-white px-6 py-6 sticky top-0 z-50 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-2xl hover:text-blue-400 transition-colors">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              <i className="fas fa-microchip"></i>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Patrolling Inspection Coding Area</h1>
          </div>
        </div>
        <div className="hidden md:flex gap-6 text-[10px] font-black uppercase tracking-widest bg-slate-800 px-6 py-3 rounded-full border border-slate-700">
           <span className="text-green-400">OK - O</span>
           <span className="text-red-400">NOK - X</span>
        </div>
      </div>

      <div className="max-w-[98%] mx-auto p-4 space-y-6">
        {/* Document Header Metadata */}
        <div className="bg-white p-6 rounded-[2rem] shadow-lg border-2 border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Line No.</label>
            <input 
              type="text" 
              value={formData.lineNo}
              onChange={(e) => setFormData(p => ({...p, lineNo: e.target.value}))}
              className="w-full p-4 bg-slate-50 border-4 border-slate-100 rounded-xl font-black text-xl text-slate-900 outline-none focus:border-blue-500 transition-all"
              placeholder="e.g. Line 01"
            />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Current Shift</label>
             <select 
               value={formData.shift} 
               onChange={(e) => {
                 const s = e.target.value as 'A'|'B';
                 setFormData(p => ({...p, shift: s}));
                 setActiveSlotIdx(0);
               }}
               className="w-full p-4 bg-slate-50 border-4 border-slate-100 rounded-xl font-black text-xl text-blue-600 outline-none focus:border-blue-500"
             >
               <option value="A">SHIFT A</option>
               <option value="B">SHIFT B</option>
             </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Line Leader</label>
            <input 
              type="text" 
              value={formData.lineLeader}
              onChange={(e) => setFormData(p => ({...p, lineLeader: e.target.value}))}
              className="w-full p-4 bg-slate-50 border-4 border-slate-100 rounded-xl font-black text-lg text-slate-700 outline-none"
              placeholder="Name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Supervisor</label>
            <input 
              type="text" 
              value={formData.supervisor}
              onChange={(e) => setFormData(p => ({...p, supervisor: e.target.value}))}
              className="w-full p-4 bg-slate-50 border-4 border-slate-100 rounded-xl font-black text-lg text-slate-700 outline-none"
              placeholder="Name"
            />
          </div>
        </div>

        {/* Industrial Table View */}
        <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead className="bg-[#f8fafc] text-slate-900 border-b-4 border-slate-50">
              <tr>
                <th className="px-4 py-6 w-16 text-center text-xs font-black uppercase tracking-widest border-r border-slate-100">Sl. No.</th>
                <th className="px-6 py-6 w-[400px] text-xs font-black uppercase tracking-widest border-r border-slate-100">Check Points</th>
                {availableSlots.map((slot, sIdx) => (
                  <th 
                    key={slot} 
                    onClick={() => setActiveSlotIdx(sIdx)}
                    className={`px-2 py-6 text-center text-[9px] font-black uppercase tracking-tight cursor-pointer transition-colors border-x border-slate-100 ${activeSlotIdx === sIdx ? 'bg-blue-600 text-white shadow-inner' : 'hover:bg-slate-200'}`}
                  >
                    {slot}
                  </th>
                ))}
                <th className="px-6 py-6 text-xs font-black uppercase tracking-widest border-l border-slate-100">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {formData.checkpoints.map((cp, idx) => (
                <tr key={cp.id} className={`${idx === 12 ? 'bg-slate-50' : 'hover:bg-blue-50/20'} transition-colors`}>
                  <td className="px-4 py-8 text-center font-black text-slate-400 text-sm border-r border-slate-50">{idx + 1}</td>
                  <td className="px-6 py-8 border-r border-slate-50">
                    <p className={`font-bold text-[13px] leading-tight uppercase tracking-tight ${idx === 12 ? 'text-blue-700 font-black' : 'text-slate-800'}`}>
                      {cp.description}
                    </p>
                  </td>
                  
                  {/* Status Interaction Grid */}
                  {availableSlots.map((_, sIdx) => (
                    <td key={sIdx} className={`px-2 py-8 border-x border-slate-50 ${activeSlotIdx === sIdx ? 'bg-blue-50/40' : ''}`}>
                      {idx < 12 ? (
                        activeSlotIdx === sIdx ? (
                          <div className="flex items-center justify-center">
                            <div 
                              onClick={() => handleStatusToggle(idx)}
                              className={`w-12 h-12 rounded-full border-4 cursor-pointer transition-all flex items-center justify-center text-2xl shadow-sm select-none ${
                                cp.status === 'OK' 
                                ? 'bg-green-500 border-green-600 text-white scale-110 shadow-lg' 
                                : cp.status === 'NOK'
                                ? 'bg-red-500 border-red-600 text-white scale-110 shadow-lg'
                                : 'bg-slate-100 border-slate-200 text-slate-300'
                              }`}
                            >
                              {cp.status === 'OK' && <span className="font-black">O</span>}
                              {cp.status === 'NOK' && <span className="font-black">X</span>}
                              {!cp.status && <div className="w-1 h-1 bg-slate-300 rounded-full"></div>}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center opacity-10">
                             <div className="w-8 h-8 rounded-full border-2 border-slate-200"></div>
                          </div>
                        )
                      ) : null}
                    </td>
                  ))}

                  {/* Per-Checkpoint Remarks Column */}
                  <td className="px-6 py-4 border-l border-slate-50">
                    <input 
                      type="text" 
                      value={cp.remarks}
                      onChange={(e) => handleRemarksChange(idx, e.target.value)}
                      placeholder={cp.status === 'NOK' ? "REQUIRED REMARKS..." : "NOTES..."}
                      className={`w-full p-3 border-2 rounded-xl text-xs font-bold outline-none transition-all ${cp.status === 'NOK' && !cp.remarks ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-slate-100 focus:border-blue-400 bg-transparent'}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Submission Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-8 border-slate-100 p-6 flex gap-4 items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-[#0f172a] hover:bg-black text-white py-6 rounded-2xl font-black text-2xl uppercase tracking-tighter flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          {isSubmitting ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-save"></i>}
          Commit Inspection Record
        </button>
        <button onClick={() => navigate('/reports')} className="w-20 h-20 bg-emerald-50 text-emerald-600 border-4 border-emerald-100 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
          <i className="fas fa-file-invoice"></i>
        </button>
      </div>
    </div>
  );
};

export default RFCodingCheckpointForm;
