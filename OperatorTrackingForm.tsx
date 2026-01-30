
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { ModuleType, OperatorAssignmentRecord } from '../types';
import PublicHeader from '../components/PublicHeader';

const AREA_LABELS: Record<string, string> = {
  'RF_CODING': 'RF Coding Area',
  'PCB_1PH': 'Main PCB 1 Phase',
  'PCB_3PH': 'Main PCB 3 Phase',
  'LTCT': 'LTCT Coding Area'
};

const FIELD_LABELS: Record<string, string> = {
  date: 'Deployment Date',
  shift: 'Shift',
  moduleType: 'Production Area',
  stationName: 'Bench Identification',
  operatorName: 'Operator Name',
  operatorId: 'System ID'
};

const OperatorTrackingForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [manpowerAlert, setManpowerAlert] = useState<{ type: 'mismatch', message: string, history?: string } | null>(null);

  const getInitialState = (): Partial<OperatorAssignmentRecord> => ({
    date: new Date().toISOString().split('T')[0],
    shift: 'A',
    moduleType: 'RF_CODING',
    station: '1',
    stationName: 'Station 1',
    operatorName: '',
    operatorId: ''
  });

  const [formData, setFormData] = useState<Partial<OperatorAssignmentRecord>>(getInitialState());

  const stations = useMemo(() => {
    let count = 12;
    if (formData.moduleType === 'PCB_3PH') count = 6;
    if (formData.moduleType === 'LTCT') count = 5;
    const list = Array.from({ length: count }, (_, i) => (i + 1).toString());
    list.push('Other');
    return list;
  }, [formData.moduleType]);

  // Alert Logic
  useEffect(() => {
    if (formData.operatorId && formData.operatorId.length >= 3 && formData.station) {
      const prevAtStation = dbService.getPreviousAssignment(formData.moduleType as ModuleType, formData.shift!, formData.station!, formData.date!);
      const opHistory = dbService.getPreviousAssignmentByOperator(formData.operatorId, formData.date!);

      if (prevAtStation && prevAtStation.operatorId !== formData.operatorId) {
        setManpowerAlert({
          type: 'mismatch',
          message: `Manpower Changed! Yesterday this station was handled by ${prevAtStation.operatorName} (${prevAtStation.operatorId}).`,
          history: opHistory ? `Yesterday this operator was seated in ${AREA_LABELS[opHistory.moduleType] || opHistory.moduleType}` : undefined
        });
      } else {
        setManpowerAlert(null);
      }
    } else {
      setManpowerAlert(null);
    }
  }, [formData.operatorId, formData.moduleType, formData.station, formData.shift, formData.date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStationSelect = (s: string) => {
    if (s === 'Other') {
      setFormData(prev => ({ ...prev, station: 'Other', stationName: '' }));
    } else {
      setFormData(prev => ({ ...prev, station: s, stationName: `Station ${s}` }));
      setIsStationModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.operatorName || !formData.operatorId || !formData.moduleType || !formData.station) {
      setErrorMessage("All deployment fields are mandatory.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const record = await dbService.addOperatorAssignment(formData as any);
      setSubmittedData(record);
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMessage(err.message || 'Deployment sync failed. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewEntry = () => {
    setFormData(getInitialState());
    setIsSubmitted(false);
    setSubmittedData(null);
    setErrorMessage(null);
    setManpowerAlert(null);
    window.scrollTo(0, 0);
  };

  const hasValue = (val: any) => val !== undefined && val !== null && val.toString().trim().length > 0;

  const inputClasses = (val: any) => `w-full p-5 border-4 rounded-2xl text-xl font-black text-slate-900 caret-blue-600 outline-none transition-[border-color,background-color] duration-150 focus:ring-8 focus:ring-blue-100 ${
    hasValue(val) ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-slate-50 focus:border-blue-400 focus:bg-white'
  }`;

  const labelClasses = "text-base font-black text-slate-900 uppercase tracking-widest ml-1 mb-2 block";

  if (isSubmitted && submittedData) {
    return (
      <div className="max-w-4xl mx-auto pb-12 px-4 md:px-8">
        <PublicHeader />
        <div className="bg-white rounded-[3rem] shadow-2xl border-4 border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-indigo-700 px-8 py-12 text-white text-center border-b-8 border-indigo-800">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
              <i className="fas fa-user-check"></i>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tight">Deployment Recorded</h2>
            <p className="text-indigo-100 font-black text-lg mt-2 uppercase tracking-widest">Operator placement logged successfully</p>
          </div>

          <div className="p-10 md:p-14 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(submittedData).map(([key, value]) => {
                if (!value || !FIELD_LABELS[key]) return null;
                const displayVal = key === 'moduleType' ? (AREA_LABELS[value as string] || value) : value;
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
                className="flex-1 bg-indigo-700 hover:bg-indigo-800 text-white font-black py-6 rounded-3xl shadow-2xl transition-all active:scale-95 text-xl border-b-8 border-indigo-900 uppercase"
              >
                DEPLOY NEW OPERATOR
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
    <div className="max-w-4xl mx-auto pb-12 px-4 md:px-0">
      <PublicHeader />
      
      <div className={`bg-white rounded-[3.5rem] shadow-2xl border-4 border-slate-100 overflow-hidden mt-6 transition-all ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="bg-indigo-700 px-10 py-12 text-white flex justify-between items-center border-b-8 border-indigo-800">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Manpower Deployment</h2>
            <p className="text-indigo-100 font-black text-xs mt-2 uppercase tracking-[0.4em]">Daily Bench Position Tracker</p>
          </div>
          <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-inner">
            {isSubmitting ? <i className="fas fa-sync-alt fa-spin"></i> : <i className="fas fa-users-viewfinder"></i>}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100 shadow-inner">
            <div className="space-y-1">
              <label className={labelClasses}>Deployment Date <span className="text-red-600 text-xl">*</span></label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClasses(formData.date)} disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Active Shift <span className="text-red-600 text-xl">*</span></label>
              <div className="relative">
                <select name="shift" value={formData.shift} onChange={handleChange} className={inputClasses(formData.shift)} disabled={isSubmitting}>
                  <option value="A">SHIFT A</option>
                  <option value="B">SHIFT B</option>
                  <option value="C">SHIFT C</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600 text-xl">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10 bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100 shadow-inner">
            <div className="space-y-4">
              <label className="text-lg font-black text-indigo-600 uppercase tracking-widest flex items-center gap-3">
                <i className="fas fa-industry"></i>
                Production Area Selection <span className="text-red-600 text-xl">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.entries(AREA_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setFormData(p => ({ ...p, moduleType: key as ModuleType, station: '1', stationName: 'Station 1' }))}
                    className={`p-8 rounded-[2rem] border-8 text-left transition-all ${
                      formData.moduleType === key 
                      ? 'bg-white border-indigo-600 shadow-2xl scale-[1.03] z-10' 
                      : 'bg-slate-200 border-transparent text-slate-400 grayscale'
                    } ${isSubmitting ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-5">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-transform ${formData.moduleType === key ? 'bg-indigo-700 text-white' : 'bg-slate-300 text-slate-500'}`}>
                          <i className={`fas ${key === 'RF_CODING' ? 'fa-microchip' : 'fa-bolt'}`}></i>
                       </div>
                       <span className="font-black uppercase text-base tracking-tighter leading-tight">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-lg font-black text-indigo-600 uppercase tracking-widest flex items-center gap-3">
                <i className="fas fa-location-dot"></i>
                Target Bench Assignment <span className="text-red-600 text-xl">*</span>
              </label>
              <div 
                onClick={() => !isSubmitting && setIsStationModalOpen(true)}
                className={`w-full p-8 bg-white border-4 rounded-[2.5rem] transition-all flex justify-between items-center group shadow-xl ${isSubmitting ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} ${formData.stationName ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12 ${formData.stationName ? 'bg-indigo-700 text-white' : 'bg-blue-100 text-indigo-600'}`}>
                    <i className="fas fa-location-dot text-2xl"></i>
                  </div>
                  <div>
                    <span className={`block text-3xl font-black transition-colors ${formData.stationName ? 'text-indigo-900' : 'text-slate-400'}`}>
                      {formData.stationName?.toUpperCase() || 'SELECT STATION'}
                    </span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mt-1 block">Active Operations Bench</span>
                  </div>
                </div>
                <i className={`fas fa-chevron-right text-3xl ${formData.stationName ? 'text-indigo-600' : 'text-slate-300'} group-hover:translate-x-3 transition-transform`}></i>
              </div>
            </div>
          </div>

          {manpowerAlert && (
            <div className="p-10 rounded-[3.5rem] border-8 border-orange-500 bg-orange-50 flex flex-col sm:flex-row gap-8 items-center animate-in zoom-in duration-700 shadow-2xl">
              <div className="w-24 h-24 bg-orange-600 text-white rounded-[2rem] flex items-center justify-center text-4xl shrink-0 shadow-2xl">
                <i className="fas fa-user-gear"></i>
              </div>
              <div>
                <h4 className="font-black text-orange-950 uppercase tracking-tighter text-3xl leading-none mb-2">Rotation Warning</h4>
                <p className="text-orange-900 font-black text-lg leading-tight">{manpowerAlert.message}</p>
                {manpowerAlert.history && (
                  <p className="text-xs font-black text-orange-700 uppercase tracking-[0.2em] mt-5 bg-white/60 inline-block px-6 py-2 rounded-full border-2 border-orange-200">
                    <i className="fas fa-clock-rotate-left mr-3 text-lg"></i> {manpowerAlert.history}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-1">
                <label className={labelClasses}>Operator Full Name <span className="text-red-600 text-xl">*</span></label>
                <input 
                  type="text" 
                  name="operatorName" 
                  value={formData.operatorName} 
                  onChange={handleChange} 
                  required 
                  className={inputClasses(formData.operatorName)} 
                  placeholder="AS PER OFFICIAL ID"
                  disabled={isSubmitting}
                />
             </div>
             <div className="space-y-1">
                <label className={labelClasses}>Operator System ID <span className="text-red-600 text-xl">*</span></label>
                <input 
                  type="text" 
                  name="operatorId" 
                  value={formData.operatorId} 
                  onChange={handleChange} 
                  required 
                  className={inputClasses(formData.operatorId)} 
                  placeholder="KIM-OP-XXXX"
                  disabled={isSubmitting}
                />
             </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black py-10 rounded-[3rem] shadow-2xl shadow-indigo-200 text-4xl transition-all transform active:scale-95 flex items-center justify-center gap-8 uppercase tracking-tighter border-b-12 border-indigo-900">
             {isSubmitting ? (
                <>
                  <i className="fas fa-sync-alt fa-spin"></i>
                  SYNCING MANPOWER...
                </>
             ) : (
                <>
                  <i className="fas fa-user-check"></i>
                  COMMIT DEPLOYMENT
                </>
             )}
          </button>
        </form>
      </div>

      {isStationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-t-[4rem] md:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12 duration-500 border-8 border-white/20">
            <div className="bg-indigo-700 p-10 text-white flex justify-between items-center border-b-8 border-indigo-800">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Bench Assignment</h3>
                <p className="text-indigo-100 text-xs font-black uppercase tracking-[0.4em] mt-1">{AREA_LABELS[formData.moduleType!] || formData.moduleType}</p>
              </div>
              <button onClick={() => setIsStationModalOpen(false)} className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-2xl">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-10 space-y-10 max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 gap-6">
                {stations.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStationSelect(s)}
                    className={`p-8 rounded-3xl font-black text-2xl transition-all border-4 text-center flex flex-col items-center justify-center gap-2 ${
                      formData.station === s 
                      ? 'bg-indigo-700 border-indigo-700 text-white shadow-2xl scale-105' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-indigo-500'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">STATION</span>
                    {s === 'Other' ? 'OTHER' : s}
                  </button>
                ))}
              </div>

              {formData.station === 'Other' && (
                <div className="animate-in zoom-in duration-500 p-8 bg-slate-50 rounded-[3rem] border-4 border-dashed border-indigo-300">
                  <label className="text-base font-black text-indigo-600 uppercase tracking-widest block mb-4">Identify Station</label>
                  <input 
                    type="text" 
                    name="stationName" 
                    autoFocus
                    value={formData.stationName || ''} 
                    onChange={handleChange}
                    className="w-full p-8 border-4 border-indigo-200 rounded-[2rem] bg-white text-3xl font-black text-slate-900 caret-blue-600 outline-none focus:border-indigo-600 focus:ring-12 focus:ring-blue-100 transition-all"
                    placeholder="ENTER BENCH ID..."
                  />
                  <button 
                    onClick={() => setIsStationModalOpen(false)}
                    className="w-full mt-8 bg-indigo-700 text-white font-black py-6 rounded-[2rem] shadow-2xl active:scale-95 transition-all text-2xl uppercase border-b-8 border-indigo-800"
                  >
                    CONFIRM BENCH
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorTrackingForm;
