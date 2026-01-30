
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import PublicHeader from '../components/PublicHeader';
import { ProcessCheckSheetRecord } from '../types';

const CHECKPOINTS = [
  { stage: "All stations", desc: "Workstation should be clean. Ex: Soldering station, desk dust free" },
  { stage: "All stations", desc: "Appropriate Model as per MO, Relevant Process Work Instruction Displayed" },
  { stage: "All stations", desc: "Operator Wearing PPE as per WI, such as Gloves, Wriststrap, ESD Apron and Footwears" },
  { stage: "All stations", desc: "Verify that ESD mats are clean, connected to ground, and functional. Tools should be ESD safe." },
  { stage: "Coding Stage", desc: "Verify the latest Firmware version runing in line." },
  { stage: "All stations", desc: "Maintain Handling procedure of Circuit card assembly. Stacking of Circuit card assembly in proper way for avoid physical damage." },
  { stage: "All stations", desc: "Check the Process sequence, steps followed same as Work Instructions." },
  { stage: "All stations", desc: "All Input & Output Materials identified with proper information and Emp code/ Id is mandatory on PCB where Clear 1 is done (Use Permanent Marker)." },
  { stage: "All stations", desc: "Make Sure Failure Card Not attempt more than two time and if failure come more than two time in same parameter than call to supervisor." },
  { stage: "Soldering Station", desc: "Make Sure about soldering temperature, bit, Jig Fixture as per your WI define." },
  { stage: "Skill", desc: "Operator should required skill at all stages." },
  { stage: "Packing", desc: "Use ESD-safe packaging materials (bubble wrap, shielding bags) for packing finished meters. Note: Don't Use CFB Box (Brown colour box)" },
  { stage: "All stations", desc: "Rejection units are identified and kept in rejection bins with NC TAG." }
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ProcessCheckSheet: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const clickTimer = useRef<{ [key: string]: any | null }>({});
  
  const [activeDayIdx, setActiveDayIdx] = useState(new Date().getDay() === 0 ? 0 : new Date().getDay() - 1);
  const [activeShift, setActiveShift] = useState<'D' | 'N'>(new Date().getHours() >= 7 && new Date().getHours() < 19 ? 'D' : 'N');
  
  const [formData, setFormData] = useState<Omit<ProcessCheckSheetRecord, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    area: 'RF Coding Area',
    lineNo: '',
    shift: 'A',
    lineLeader: '',
    supervisor: '',
    qualityChecker: '',
    userId: '',
    checkpoints: CHECKPOINTS.map((item, idx) => ({
      id: `PROC_CODING_${idx}`,
      description: item.desc,
      status: '' as any,
      remarks: ''
    }))
  });

  useEffect(() => {
    const lastContext = localStorage.getItem('kimbal_process_check_context');
    if (lastContext) {
      const parsed = JSON.parse(lastContext);
      setFormData(prev => ({ 
        ...prev, 
        lineNo: parsed.lineNo || prev.lineNo, 
        area: parsed.area || prev.area,
        shift: activeShift === 'D' ? 'A' : 'B'
      }));
    }
  }, [activeShift]);

  const handleStatusClick = (idx: number) => {
    const key = `cp_${idx}`;
    if (clickTimer.current[key]) {
      window.clearTimeout(clickTimer.current[key]);
      clickTimer.current[key] = null;
      updateStatus(idx, 'NOT OK');
    } else {
      clickTimer.current[key] = window.setTimeout(() => {
        updateStatus(idx, 'OK');
        clickTimer.current[key] = null;
      }, 300);
    }
  };

  const updateStatus = (idx: number, status: 'OK' | 'NOT OK') => {
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
    if (unanswered) { alert("Complete all checkpoints before saving."); return; }

    const missingRemarks = formData.checkpoints.some(cp => cp.status === 'NOT OK' && !cp.remarks.trim());
    if (missingRemarks) { alert("Remarks are mandatory for all 'NOT OK' status items."); return; }

    setIsSubmitting(true);
    try {
      localStorage.setItem('kimbal_process_check_context', JSON.stringify({ lineNo: formData.lineNo, area: formData.area }));
      await dbService.addProcessSheet({ 
        ...formData, 
        shift: activeShift === 'D' ? 'A' : 'B',
        userId: formData.userId || 'OPERATOR' 
      });
      setIsSubmitted(true);
    } catch (err) {
      alert("Submission Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-slate-100 max-w-md w-full">
           <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">
              <i className="fas fa-tasks"></i>
           </div>
           <h2 className="text-3xl font-black text-slate-900 uppercase mb-4 tracking-tighter">Audit Completed</h2>
           <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-10">Process check record appended to registry.</p>
           <button onClick={() => navigate('/module/rf-docs/reference')} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">CLOSE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32">
      <div className="bg-[#111827] text-white px-6 py-6 sticky top-0 z-50 flex items-center gap-6 shadow-xl">
        <button onClick={() => navigate(-1)} className="text-2xl hover:text-blue-400 transition-colors">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
            <i className="fas fa-tasks"></i>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Process Checksheet_ Coding</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-lg border-2 border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Line Number (Auto-Fetched)</label>
            <input 
              type="text" 
              value={formData.lineNo} 
              onChange={(e) => setFormData(p => ({...p, lineNo: e.target.value}))}
              className="w-full p-6 bg-slate-50 border-4 border-slate-200 rounded-2xl font-black text-2xl text-slate-900 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Operations Area</label>
            <input 
              type="text" 
              value={formData.area} 
              onChange={(e) => setFormData(p => ({...p, area: e.target.value}))}
              className="w-full p-6 bg-slate-50 border-4 border-slate-200 rounded-2xl font-black text-2xl text-slate-900 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#f8fafc] text-slate-400 border-b-4 border-slate-50">
              <tr>
                <th rowSpan={2} className="px-4 py-4 w-12 text-center text-xs font-black uppercase tracking-widest">S.NO.</th>
                <th rowSpan={2} className="px-4 py-4 w-32 text-xs font-black uppercase tracking-widest">STAGE</th>
                <th rowSpan={2} className="px-6 py-4 w-[450px] text-xs font-black uppercase tracking-widest">CHECKPOINT</th>
                {DAYS.map((day, dIdx) => (
                  <th key={day} colSpan={2} className={`px-2 py-4 text-center text-[9px] font-black uppercase tracking-widest border-x border-slate-100 ${activeDayIdx === dIdx ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                    {day}
                  </th>
                ))}
              </tr>
              <tr>
                {DAYS.map((_, dIdx) => (
                  <React.Fragment key={dIdx}>
                    <th onClick={() => { setActiveDayIdx(dIdx); setActiveShift('D'); }} className={`px-2 py-4 text-center text-[9px] font-black border-x border-slate-50 cursor-pointer ${activeDayIdx === dIdx && activeShift === 'D' ? 'bg-indigo-600 text-white' : ''}`}>DAY</th>
                    <th onClick={() => { setActiveDayIdx(dIdx); setActiveShift('N'); }} className={`px-2 py-4 text-center text-[9px] font-black border-x border-slate-50 cursor-pointer ${activeDayIdx === dIdx && activeShift === 'N' ? 'bg-indigo-600 text-white' : ''}`}>NIGHT</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {formData.checkpoints.map((cp, idx) => (
                <React.Fragment key={cp.id}>
                  <tr className="hover:bg-emerald-50/20 transition-colors">
                    <td className="px-4 py-6 text-center font-black text-slate-400 text-sm">{idx + 1}</td>
                    <td className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase">{CHECKPOINTS[idx].stage}</td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-slate-700 text-[13px] leading-tight tracking-tight">{cp.description}</p>
                    </td>
                    {DAYS.map((_, dIdx) => (
                      <React.Fragment key={dIdx}>
                        <td className={`px-1 py-6 border-x border-slate-50 ${activeDayIdx === dIdx && activeShift === 'D' ? 'bg-emerald-50/50' : ''}`}>
                          <div className="flex items-center justify-center">
                            {activeDayIdx === dIdx && activeShift === 'D' ? (
                              <div 
                                onClick={() => handleStatusClick(idx)}
                                className={`w-10 h-10 rounded-full cursor-pointer transition-all flex items-center justify-center select-none shadow-sm ${
                                  cp.status === 'OK' ? 'bg-green-500 text-white' : 
                                  cp.status === 'NOT OK' ? 'bg-red-500 text-white' : 'bg-slate-100'
                                }`}
                              >
                                {cp.status === 'OK' && <span className="text-[9px] font-black">OK</span>}
                                {cp.status === 'NOT OK' && <span className="text-[9px] font-black">X</span>}
                                {!cp.status && <div className="w-3 h-1 bg-slate-200 rounded-full"></div>}
                              </div>
                            ) : (
                               <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-slate-100 opacity-20"></div>
                            )}
                          </div>
                        </td>
                        <td className={`px-1 py-6 border-x border-slate-50 ${activeDayIdx === dIdx && activeShift === 'N' ? 'bg-emerald-50/50' : ''}`}>
                          <div className="flex items-center justify-center">
                            {activeDayIdx === dIdx && activeShift === 'N' ? (
                              <div 
                                onClick={() => handleStatusClick(idx)}
                                className={`w-10 h-10 rounded-full cursor-pointer transition-all flex items-center justify-center select-none shadow-sm ${
                                  cp.status === 'OK' ? 'bg-green-500 text-white' : 
                                  cp.status === 'NOT OK' ? 'bg-red-500 text-white' : 'bg-slate-100'
                                }`}
                              >
                                {cp.status === 'OK' && <span className="text-[9px] font-black">OK</span>}
                                {cp.status === 'NOT OK' && <span className="text-[9px] font-black">X</span>}
                                {!cp.status && <div className="w-3 h-1 bg-slate-200 rounded-full"></div>}
                              </div>
                            ) : (
                               <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-slate-100 opacity-20"></div>
                            )}
                          </div>
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                  {cp.status === 'NOT OK' && (
                    <tr className="bg-red-50/30">
                      <td colSpan={DAYS.length * 2 + 3} className="px-10 pb-6 pt-0">
                        <input 
                          type="text" 
                          value={cp.remarks}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          placeholder="REQUIRED: Describe the corrective actions taken or observation details..."
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
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl font-black text-2xl uppercase tracking-tighter flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all"
        >
          {isSubmitting ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-save"></i>}
          COMMIT AUDIT
        </button>
      </div>
    </div>
  );
};

export default ProcessCheckSheet;
