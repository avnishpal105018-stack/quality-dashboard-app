
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import PublicHeader from '../components/PublicHeader';

const CHECKPOINTS = [
  "PCB clear status",
  "LED display scratches or black dot",
  "Cover open status working",
  "Meter firmware correctness",
  "NIC firmware version match",
  "PCB ON OFF condition sample check",
  "Digit cut on display",
  "Push button working",
  "Display blinking issue",
  "RTC time gap check",
  "LED pulse working",
  "3 Phase and LTCT ON OFF condition",
  "RF antenna work in 3P and 1P"
];

const SLOTS_A = [
  "07:00 AM – 08:00 AM", "08:00 AM – 09:00 AM", "09:00 AM – 10:00 AM", 
  "10:00 AM – 11:00 AM", "11:00 AM – 12:00 PM", "12:00 PM – 01:00 PM", 
  "01:00 PM – 02:00 PM", "02:00 PM – 03:00 PM", "03:00 PM – 03:30 PM"
];

const SLOTS_B = [
  "03:30 PM – 04:30 PM", "04:30 PM – 05:30 PM", "05:30 PM – 06:30 PM", 
  "06:30 PM – 07:30 PM", "07:30 PM – 08:30 PM", "08:30 PM – 09:30 PM", 
  "09:30 PM – 10:30 PM", "10:30 PM – 11:30 PM", "11:30 PM – 12:00 AM"
];

const PatrollingCheckSheet: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    lineNo: '1',
    lineLeader: '',
    supervisor: '',
    qualityChecker: '',
    shift: 'A',
    timeSlot: SLOTS_A[0],
    checkpoints: CHECKPOINTS.map((desc, idx) => ({
      id: `PATR_CP_${idx}`,
      description: desc,
      status: '',
      remarks: ''
    }))
  });

  const availableSlots = useMemo(() => formData.shift === 'A' ? SLOTS_A : SLOTS_B, [formData.shift]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'shift') {
        updated.timeSlot = value === 'A' ? SLOTS_A[0] : SLOTS_B[0];
      }
      return updated;
    });
  };

  const handleStatusChange = (idx: number, status: string) => {
    const newCP = [...formData.checkpoints];
    newCP[idx].status = status as any;
    setFormData(prev => ({ ...prev, checkpoints: newCP }));
  };

  const handleRemarksChange = (idx: number, val: string) => {
    const newCP = [...formData.checkpoints];
    newCP[idx].remarks = val;
    setFormData(prev => ({ ...prev, checkpoints: newCP }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate NOK Remarks
    const needsRemarks = formData.checkpoints.some(cp => cp.status === 'NOK' && !cp.remarks);
    if (needsRemarks) {
       alert("Mandatory: Provide remarks for all NOK statuses.");
       return;
    }

    setIsSubmitting(true);
    try {
      await dbService.addPatrollingSheet(formData as any);
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      alert("Submission error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl border-4 border-slate-100">
           <i className="fas fa-check-double text-8xl text-blue-500 mb-8"></i>
           <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Patrol Log Synced</h2>
           <p className="text-slate-500 font-bold uppercase tracking-widest mb-12">Temporal quality audit saved for {formData.timeSlot}</p>
           <button onClick={() => navigate('/fill-record')} className="bg-blue-600 text-white px-12 py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8">
      <PublicHeader />
      <div className="bg-white rounded-[4rem] shadow-2xl border-4 border-slate-100 overflow-hidden">
        <div className="bg-blue-900 p-12 text-white flex justify-between items-center border-b-12 border-blue-950">
           <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Patrolling Audit</h2>
              <p className="text-blue-300 font-black text-xs uppercase tracking-[0.4em] mt-3">Periodic Quality Verification Node</p>
           </div>
           <i className="fas fa-user-nurse text-6xl text-blue-700"></i>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-12">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100">
             <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 block">Audit Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleHeaderChange} className="w-full p-4 bg-white border-4 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600" />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 block">Shift Selection</label>
                <select name="shift" value={formData.shift} onChange={handleHeaderChange} className="w-full p-4 bg-white border-4 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600">
                   <option value="A">SHIFT A</option>
                   <option value="B">SHIFT B</option>
                </select>
             </div>
             <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 block">Active Time Slot</label>
                <select name="timeSlot" value={formData.timeSlot} onChange={handleHeaderChange} className="w-full p-4 bg-white border-4 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600">
                   {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 block">Line Leader</label>
                <input type="text" name="lineLeader" required value={formData.lineLeader} onChange={handleHeaderChange} className="w-full p-4 bg-white border-4 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600" />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 block">Supervisor</label>
                <input type="text" name="supervisor" required value={formData.supervisor} onChange={handleHeaderChange} className="w-full p-4 bg-white border-4 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600" />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 block">Quality Checker</label>
                <input type="text" name="qualityChecker" required value={formData.qualityChecker} onChange={handleHeaderChange} className="w-full p-4 bg-white border-4 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600" />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 block">Line Number</label>
                <input type="text" name="lineNo" value={formData.lineNo} onChange={handleHeaderChange} className="w-full p-4 bg-white border-4 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600" />
             </div>
          </div>

          {/* Audit Grid */}
          <div className="overflow-x-auto rounded-[3rem] border-4 border-slate-100 shadow-xl bg-white">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest">
                   <tr>
                      <th className="px-8 py-8 w-16 text-center">#</th>
                      <th className="px-8 py-8">Checkpoint</th>
                      <th className="px-8 py-8 text-center">Status</th>
                      <th className="px-8 py-8">Remarks (Mandatory if NOK)</th>
                   </tr>
                </thead>
                <tbody className="divide-y-4 divide-slate-50">
                   {formData.checkpoints.map((cp, idx) => (
                      <tr key={cp.id} className="hover:bg-blue-50/30">
                         <td className="px-8 py-6 text-center font-black text-slate-400">{idx + 1}</td>
                         <td className="px-8 py-6 font-black text-slate-900 uppercase text-xs leading-tight">{cp.description}</td>
                         <td className="px-8 py-6 text-center">
                            <div className="flex gap-2 justify-center">
                               {['OK', 'NOK', 'Not Become OK'].map(s => (
                                  <button
                                     key={s}
                                     type="button"
                                     onClick={() => handleStatusChange(idx, s)}
                                     className={`px-3 py-1.5 rounded-lg text-[8px] font-black transition-all border-2 ${cp.status === s ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300 hover:border-slate-400'}`}
                                  >
                                     {s}
                                  </button>
                               ))}
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <input type="text" value={cp.remarks} onChange={(e) => handleRemarksChange(idx, e.target.value)} required={cp.status === 'NOK'} className={`w-full p-3 border-2 rounded-xl text-xs font-bold outline-none transition-colors ${cp.status === 'NOK' && !cp.remarks ? 'border-rose-300 bg-rose-50' : 'border-slate-100 bg-slate-50'}`} placeholder="Provide context..." />
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-black py-10 rounded-[3rem] text-3xl shadow-2xl hover:bg-blue-700 active:scale-[0.98] transition-all border-b-12 border-blue-800 uppercase tracking-tighter">
             {isSubmitting ? <><i className="fas fa-spinner fa-spin mr-3"></i> Uploading Audit...</> : <><i className="fas fa-shield-check mr-3"></i> Submit Patrolling Audit</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatrollingCheckSheet;
