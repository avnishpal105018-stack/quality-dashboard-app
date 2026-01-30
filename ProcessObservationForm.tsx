
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcessObservationRecord, UserRole } from '../types';
import { dbService } from '../services/dbService';
import PublicHeader from '../components/PublicHeader';

const AREA_LABELS: Record<string, string> = {
  'RF_CODING': 'RF Coding Area',
  'PCB_1PH': 'Main PCB 1 Phase',
  'PCB_3PH': 'Main PCB 3 Phase',
  'LTCT': 'LTCT Coding Area'
};

const FIELD_LABELS: Record<string, string> = {
  date: 'Audit Date',
  shift: 'Shift',
  moduleType: 'Operations Area',
  station: 'Station ID',
  vendor: 'Vendor Name',
  lineLeader: 'Line Leader',
  observationCategory: 'Discovery Category',
  issueDescription: 'Defect/Issue',
  issueFoundAt: 'Found At',
  responsibleType: 'Responsibility',
  actionOwner: 'Owner',
  status: 'Status',
  quantityAffected: 'Quantity Affected'
};

const ProcessObservationForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any>(null);
  
  const getInitialState = (): Partial<ProcessObservationRecord> => ({
    date: new Date().toISOString().split('T')[0],
    shift: 'A',
    moduleType: 'RF_CODING',
    station: '1',
    vendor: '',
    lineLeader: '',
    observationCategory: 'General Observation',
    issueDescription: '',
    issueFoundAt: '',
    responsibleType: 'Process',
    correctiveAction: '',
    actionOwner: '',
    targetDate: new Date().toISOString().split('T')[0],
    quantityAffected: 0,
    status: 'Pending',
    closureDate: '',
    remarks: '',
    observerName: '',
    observerEmployeeId: '',
    operatorName: '',
    severity: 'Medium',
    isRepeated: false
  });

  const [formData, setFormData] = useState<Partial<ProcessObservationRecord>>(getInitialState());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                type === 'number' ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.observerName || !formData.observerEmployeeId || !formData.issueDescription) {
      setErrorMessage("Mandatory fields (Auditor info and Issue description) must be completed.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const record = await dbService.addObservation(formData);
      setSubmittedData(record);
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error('Observation log error:', err);
      setErrorMessage(err.message || 'Audit sync failed. Please try again or contact IT support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewEntry = () => {
    setFormData(getInitialState());
    setIsSubmitted(false);
    setSubmittedData(null);
    setErrorMessage(null);
    window.scrollTo(0, 0);
  };

  const hasValue = (val: any) => val !== undefined && val !== null && val.toString().trim().length > 0;

  const inputClasses = (val: any) => `w-full p-5 border-4 rounded-2xl text-xl font-black text-slate-900 caret-indigo-600 outline-none transition-[border-color,background-color] duration-150 focus:ring-8 focus:ring-indigo-100 ${
    hasValue(val) ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:bg-white'
  }`;

  const labelClasses = "text-base font-black text-slate-900 uppercase tracking-widest ml-1 mb-2 block";

  if (isSubmitted && submittedData) {
    return (
      <div className="max-w-4xl mx-auto pb-12 px-4 md:px-8">
        <PublicHeader />
        <div className="bg-white rounded-[3rem] shadow-2xl border-4 border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-indigo-600 px-8 py-12 text-white text-center border-b-8 border-indigo-700">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
              <i className="fas fa-clipboard-check"></i>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tight">Audit Committed</h2>
            <p className="text-indigo-100 font-black text-lg mt-2 uppercase tracking-widest">Process observation record is now live</p>
          </div>

          <div className="p-10 md:p-14 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(submittedData).map(([key, value]) => {
                if (value === undefined || value === null || !FIELD_LABELS[key]) return null;
                let displayVal = value;
                if (key === 'moduleType') displayVal = AREA_LABELS[value as string] || value;
                return (
                  <div key={key} className="space-y-1 bg-slate-50 p-5 rounded-2xl border-4 border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">{FIELD_LABELS[key]}</span>
                    <p className="text-lg font-black text-slate-900 break-words uppercase">{displayVal.toString()}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-10 flex flex-col sm:flex-row gap-6">
              <button 
                onClick={handleNewEntry} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-3xl shadow-2xl transition-all active:scale-95 text-xl border-b-8 border-indigo-800 uppercase"
              >
                NEW OBSERVATION
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-6 rounded-3xl transition-all active:scale-95 text-xl border-b-8 border-slate-300 uppercase"
              >
                GO TO HOME
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0">
      <PublicHeader />
      
      <div className={`bg-white rounded-[3.5rem] shadow-2xl border-4 border-slate-100 overflow-hidden mt-6 transition-all ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="bg-indigo-600 px-10 py-12 text-white flex justify-between items-center border-b-8 border-indigo-700">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Audit Discovery</h2>
            <p className="text-indigo-100 font-black text-xs mt-2 uppercase tracking-[0.4em]">Process Compliance & Master Tracking</p>
          </div>
          <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-inner">
            {isSubmitting ? <i className="fas fa-sync-alt fa-spin"></i> : <i className="fas fa-clipboard-list"></i>}
          </div>
        </div>

        {errorMessage && (
          <div className="m-10 p-6 bg-red-50 border-4 border-red-200 rounded-[2rem] flex items-start gap-5 animate-in slide-in-from-top-4">
            <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
              <i className="fas fa-triangle-exclamation text-xl"></i>
            </div>
            <div>
              <h4 className="font-black text-red-900 uppercase text-lg tracking-tight">System Notice</h4>
              <p className="font-black text-red-700 text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-10 md:p-14 space-y-12">
          
          <div className="bg-indigo-900 p-10 rounded-[3rem] border-8 border-indigo-800 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-1">
              <label className="text-base font-black text-indigo-200 uppercase tracking-widest ml-1 mb-2 block">Observer Name <span className="text-red-400 text-xl">*</span></label>
              <input type="text" name="observerName" required value={formData.observerName} onChange={handleChange} className="w-full p-6 bg-indigo-800 border-4 border-indigo-700 rounded-2xl text-white font-black text-xl placeholder:text-indigo-400 outline-none focus:border-white transition-all" placeholder="YOUR FULL NAME" disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label className="text-base font-black text-indigo-200 uppercase tracking-widest ml-1 mb-2 block">KIM ID <span className="text-red-400 text-xl">*</span></label>
              <input type="text" name="observerEmployeeId" required value={formData.observerEmployeeId} onChange={handleChange} className="w-full p-6 bg-indigo-800 border-4 border-indigo-700 rounded-2xl text-white font-black text-xl placeholder:text-indigo-400 outline-none focus:border-white transition-all" placeholder="KIM-XXXX" disabled={isSubmitting} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100 shadow-inner">
            <div className="space-y-1">
              <label className={labelClasses}>Obs. Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClasses(formData.date)} disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Shift</label>
              <div className="relative">
                <select name="shift" value={formData.shift} onChange={handleChange} className={inputClasses(formData.shift)} disabled={isSubmitting}>
                  <option value="A">SHIFT A</option>
                  <option value="B">SHIFT B</option>
                  <option value="C">SHIFT C</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Area</label>
              <div className="relative">
                <select name="moduleType" value={formData.moduleType} onChange={handleChange} className={inputClasses(formData.moduleType)} disabled={isSubmitting}>
                  <option value="RF_CODING">RF AREA</option>
                  <option value="PCB_1PH">MAIN PCB 1PH</option>
                  <option value="PCB_3PH">MAIN PCB 3PH</option>
                  <option value="LTCT">LTCT AREA</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Station</label>
              <input type="text" name="station" value={formData.station} onChange={handleChange} className={inputClasses(formData.station)} placeholder="ID" disabled={isSubmitting} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-1">
              <label className={labelClasses}>Observation Category <span className="text-red-600 text-xl">*</span></label>
              <div className="relative">
                <select name="observationCategory" value={formData.observationCategory} onChange={handleChange} className={inputClasses(formData.observationCategory)} disabled={isSubmitting}>
                  <option value="Material Related">MATERIAL RELATED</option>
                  <option value="Line Related">LINE RELATED</option>
                  <option value="Operator Related">OPERATOR RELATED</option>
                  <option value="General Observation">GENERAL OBSERVATION</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600 text-xl">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Issue Found At <span className="text-red-600 text-xl">*</span></label>
              <input type="text" name="issueFoundAt" value={formData.issueFoundAt} onChange={handleChange} required className={inputClasses(formData.issueFoundAt)} placeholder="E.G. INCOMING MATERIAL, STATION 1" disabled={isSubmitting} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-1">
              <label className={labelClasses}>Vendor Identification <span className="text-red-600 text-xl">*</span></label>
              <input type="text" name="vendor" value={formData.vendor} onChange={handleChange} required className={inputClasses(formData.vendor)} placeholder="ENTER VENDOR NAME" disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Line Leader <span className="text-red-600 text-xl">*</span></label>
              <input type="text" name="lineLeader" value={formData.lineLeader} onChange={handleChange} required className={inputClasses(formData.lineLeader)} placeholder="ENTER LINE LEADER NAME" disabled={isSubmitting} />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClasses}>Short Issue Description <span className="text-red-600 text-xl">*</span></label>
            <input type="text" name="issueDescription" value={formData.issueDescription} onChange={handleChange} required className={inputClasses(formData.issueDescription)} placeholder="WRONG CODING SEQUENCE, ETC." disabled={isSubmitting} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-1">
              <label className={labelClasses}>Responsible Type</label>
              <select name="responsibleType" value={formData.responsibleType} onChange={handleChange} className={inputClasses(formData.responsibleType)} disabled={isSubmitting}>
                <option value="Material">MATERIAL</option>
                <option value="Line">LINE</option>
                <option value="Operator">OPERATOR</option>
                <option value="System">SYSTEM</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Action Owner</label>
              <input type="text" name="actionOwner" value={formData.actionOwner} onChange={handleChange} className={inputClasses(formData.actionOwner)} placeholder="PERSON/DEPT" disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Quantity Affected <span className="text-red-600 text-xl">*</span></label>
              <input type="number" name="quantityAffected" value={formData.quantityAffected} onChange={handleChange} required className={inputClasses(formData.quantityAffected)} placeholder="0" min="0" disabled={isSubmitting} />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClasses}>Corrective Action Taken/Proposed</label>
            <textarea 
              name="correctiveAction" 
              value={formData.correctiveAction} 
              onChange={handleChange} 
              rows={3} 
              className={inputClasses(formData.correctiveAction)} 
              placeholder="DETAILS OF ACTIONS TO RESOLVE OR PREVENT..."
              disabled={isSubmitting}
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10 bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl">
            <div className="space-y-1">
              <label className="text-base font-black text-indigo-200 uppercase tracking-widest ml-1 mb-2 block">Current Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full p-6 bg-slate-800 border-4 border-slate-700 rounded-2xl text-white font-black text-xl outline-none focus:border-indigo-400 transition-all" disabled={isSubmitting}>
                <option value="Pending">PENDING</option>
                <option value="In Progress">IN PROGRESS</option>
                <option value="Closed">CLOSED</option>
              </select>
            </div>
            {formData.status === 'Closed' && (
              <div className="space-y-1 animate-in slide-in-from-right-4 duration-300">
                <label className="text-base font-black text-green-300 uppercase tracking-widest ml-1 mb-2 block">Closure Date</label>
                <input type="date" name="closureDate" value={formData.closureDate} onChange={handleChange} className="w-full p-6 bg-green-900/30 border-4 border-green-800 rounded-2xl text-white font-black text-xl outline-none focus:border-white transition-all" disabled={isSubmitting} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-1">
              <label className={labelClasses}>Severity <span className="text-red-600 text-xl">*</span></label>
              <div className="flex gap-4">
                {['Low', 'Medium', 'High'].map(s => (
                  <button 
                    key={s} 
                    type="button" 
                    disabled={isSubmitting}
                    onClick={() => setFormData(p => ({...p, severity: s as any}))}
                    className={`flex-1 py-5 rounded-2xl font-black text-base border-4 transition-all uppercase tracking-tighter ${
                      formData.severity === s 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-105' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className={`flex items-center gap-6 p-8 rounded-[2rem] border-4 transition-all ${formData.isRepeated ? 'bg-red-50 border-red-600 shadow-xl' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
              <input type="checkbox" name="isRepeated" checked={formData.isRepeated} onChange={handleChange} className="w-10 h-10 accent-red-600 cursor-pointer" id="repeated" disabled={isSubmitting} />
              <label htmlFor="repeated" className={`text-base font-black uppercase tracking-tighter cursor-pointer ${formData.isRepeated ? 'text-red-950' : 'text-slate-600'}`}>Repeated Abnormality?</label>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClasses}>Remarks</label>
            <textarea 
              name="remarks" 
              value={formData.remarks} 
              onChange={handleChange} 
              rows={2} 
              className={inputClasses(formData.remarks)} 
              placeholder="OPTIONAL CLOSURE NOTES OR FEEDBACK..."
              disabled={isSubmitting}
            ></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-10 rounded-[3rem] text-4xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.95] transition-all border-b-12 border-indigo-800 uppercase tracking-tighter">
            {isSubmitting ? (
              <><i className="fas fa-sync-alt fa-spin"></i> SYNCING AUDIT...</>
            ) : (
              <><i className="fas fa-clipboard-list"></i> SUBMIT OBSERVATION</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProcessObservationForm;
