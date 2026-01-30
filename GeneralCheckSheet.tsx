
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import PublicHeader from '../components/PublicHeader';

const GENERAL_CHECKPOINTS = [
  { category: 'Housekeeping', description: 'Area floor and benches are clean and debris-free' },
  { category: 'Housekeeping', description: 'Rejection bins are labeled and covered' },
  { category: 'Safety practices', description: 'Fire exit routes are clear and accessible' },
  { category: 'Safety practices', description: 'Electrical panels and wiring are secure' },
  { category: 'ESD compliance', description: 'ESD testers are functional and calibrated' },
  { category: 'Documentation', description: 'Latest SOP/WI copies available at workstations' },
  { category: 'Process discipline', description: 'Operators following defined work sequence' }
];

const GeneralCheckSheet: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'A',
    checkedBy: '',
    items: GENERAL_CHECKPOINTS.map((cp, idx) => ({
      id: `GEN_CP_${idx}`,
      ...cp,
      status: '',
      remarks: ''
    }))
  });

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStatusChange = (idx: number, status: string) => {
    const newItems = [...formData.items];
    newItems[idx].status = status as any;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleRemarksChange = (idx: number, val: string) => {
    const newItems = [...formData.items];
    newItems[idx].remarks = val;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dbService.addGeneralSheet(formData as any);
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
           <i className="fas fa-clipboard-check text-8xl text-indigo-500 mb-8"></i>
           <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">General Log Saved</h2>
           <p className="text-slate-500 font-bold uppercase tracking-widest mb-12">Housekeeping & Safety audit committed for today.</p>
           <button onClick={() => navigate('/fill-record')} className="bg-indigo-600 text-white px-12 py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8">
      <PublicHeader />
      <div className="bg-white rounded-[4rem] shadow-2xl border-4 border-slate-100 overflow-hidden">
        <div className="bg-indigo-900 p-12 text-white flex justify-between items-center border-b-12 border-indigo-950">
           <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">General Audit</h2>
              <p className="text-indigo-300 font-black text-xs uppercase tracking-[0.4em] mt-3">Facility Compliance Registry</p>
           </div>
           <i className="fas fa-clipboard-list text-6xl text-indigo-700"></i>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-12">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100">
             <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 block">Audit Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleHeaderChange} className="w-full p-5 bg-white border-4 border-slate-200 rounded-2xl font-black text-slate-900 outline-none" />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 block">Shift Selection</label>
                <select name="shift" value={formData.shift} onChange={handleHeaderChange} className="w-full p-5 bg-white border-4 border-slate-200 rounded-2xl font-black text-slate-900 outline-none">
                   <option value="A">SHIFT A</option>
                   <option value="B">SHIFT B</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 block">Checked By</label>
                <input type="text" name="checkedBy" required value={formData.checkedBy} onChange={handleHeaderChange} className="w-full p-5 bg-white border-4 border-slate-200 rounded-2xl font-black text-slate-900 outline-none" />
             </div>
          </div>

          <div className="space-y-6">
             {formData.items.map((item, idx) => (
                <div key={item.id} className="bg-white p-8 rounded-[2rem] border-4 border-slate-100 shadow-lg flex flex-col md:flex-row items-center gap-8">
                   <div className="md:w-1/4 text-center md:text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg border-2 border-indigo-100">{item.category}</span>
                   </div>
                   <div className="flex-1">
                      <p className="font-black text-slate-900 uppercase text-sm leading-tight">{item.description}</p>
                   </div>
                   <div className="flex gap-4">
                      {['OK', 'NOT OK'].map(s => (
                         <button
                            key={s}
                            type="button"
                            onClick={() => handleStatusChange(idx, s)}
                            className={`px-8 py-3 rounded-2xl font-black text-xs transition-all border-4 ${formData.items[idx].status === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400'}`}
                         >
                            {s}
                         </button>
                      ))}
                   </div>
                   <div className="w-full md:w-1/4">
                      <input type="text" value={item.remarks} onChange={(e) => handleRemarksChange(idx, e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold outline-none" placeholder="Remarks..." />
                   </div>
                </div>
             ))}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-700 text-white font-black py-10 rounded-[3rem] text-3xl shadow-2xl hover:bg-indigo-800 active:scale-[0.98] transition-all border-b-12 border-indigo-900 uppercase tracking-tighter">
             {isSubmitting ? <><i className="fas fa-spinner fa-spin mr-3"></i> Syncing Record...</> : <><i className="fas fa-save mr-3"></i> Submit Audit Registry</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GeneralCheckSheet;
