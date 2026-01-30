
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RFCodingRecord, UserRole } from '../types';
import { dbService } from '../services/dbService';
import TraceabilityForm from '../components/TraceabilityForm';
import PublicHeader from '../components/PublicHeader';
import PCBNumberInput from '../components/PCBNumberInput';

const VENDOR_MAPPING: Record<string, string> = {
  '1': 'SGS',
  '2': 'VIVAN',
  '3': 'ILJIN',
  '4': 'SGS-NOIDA',
  '5': 'SGS-MANESER',
  '6': 'Zetwork',
  '7': 'Kimbal'
};

const AREA_LABELS: Record<string, string> = {
  'RF_CODING': 'RF Coding Area',
  'PCB_1PH': 'Main PCB 1 Phase',
  'PCB_3PH': 'Main PCB 3 Phase',
  'LTCT': 'LTCT Coding Area',
  'GENERAL': 'General Coding'
};

const FIELD_LABELS: Record<string, string> = {
  date: 'Reporting Date',
  shift: 'Shift',
  block: 'Block',
  station: 'Station ID',
  stationName: 'Station Name',
  vendor: 'Vendor',
  rgType: 'RF Type',
  pcbType: 'Sub-Category',
  quantity: 'Total Quantity',
  submitterName: 'Submitter Name',
  submitterEmployeeId: 'Submitter ID',
  submitterRole: 'Submitter Role',
  operatorName: 'Operator Name',
  operatorId: 'Operator ID',
  pcbNumber: 'PCB Number',
  partCode: 'Part Code',
  issueDescription: 'Issue Description'
};

const RFCodingForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<Partial<RFCodingRecord> | null>(null);
  const [isVendorAutoFilled, setIsVendorAutoFilled] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  
  const [manpowerAlert, setManpowerAlert] = useState<{ type: 'change' | 'history', message: string } | null>(null);

  const getInitialState = (): Partial<RFCodingRecord> => ({
    date: new Date().toISOString().split('T')[0],
    shift: 'A',
    block: 'A',
    station: '1',
    stationName: 'Station 1',
    vendor: '',
    rgType: 'RF',
    pcbType: 'G23',
    quantity: undefined,
    moduleType: 'RF_CODING',
    submitterName: '',
    submitterEmployeeId: '',
    submitterRole: '' as any,
    operatorName: '',
    operatorId: '',
    pcbNumber: '',
    isDuplicateConfirmed: false,
    partCode: '',
    issueDescription: ''
  });

  const [formData, setFormData] = useState<Partial<RFCodingRecord>>(getInitialState());

  const subOptions = useMemo(() => {
    if (formData.rgType === 'RF') {
      return ['G23', 'G13'];
    } else {
      return ['Neway Gateway', 'Cavili', 'Intelli 4G'];
    }
  }, [formData.rgType]);

  const stations = useMemo(() => {
    return formData.block === 'A' 
      ? ['1', '2', '3', '4', '5', '6', 'Other'] 
      : ['7', '8', '9', '10', '11', '12', 'Other'];
  }, [formData.block]);

  // Operator Tracking Logic
  useEffect(() => {
    if (formData.operatorId && formData.operatorId.length >= 3) {
      const history = dbService.getOperatorAssignmentHistory(formData.operatorId, formData.date!);
      const prevStationOp = dbService.getPreviousShiftOperator('RF_CODING', formData.shift!, formData.station!, formData.date!);

      if (prevStationOp && prevStationOp.operatorId !== formData.operatorId) {
        setManpowerAlert({
          type: 'change',
          message: `MANPOWER CHANGE ALERT: Previously, ${prevStationOp.operatorName} (${prevStationOp.operatorId}) was assigned to this station.`
        });
      } else if (history && history.moduleType !== 'RF_CODING') {
        setManpowerAlert({
          type: 'history',
          message: `MOVEMENT DETECTED: This operator was previously seated in ${AREA_LABELS[history.moduleType] || history.moduleType}.`
        });
      } else {
        setManpowerAlert(null);
      }
    } else {
      setManpowerAlert(null);
    }
  }, [formData.operatorId, formData.station, formData.shift, formData.date]);

  useEffect(() => {
    const pcb = formData.pcbNumber || '';
    if (pcb.length > 0) {
      const firstDigit = pcb.charAt(0);
      if (VENDOR_MAPPING[firstDigit]) {
        setFormData(prev => ({ ...prev, vendor: VENDOR_MAPPING[firstDigit] }));
        setIsVendorAutoFilled(true);
      } else {
        setIsVendorAutoFilled(false);
      }
    } else {
      setIsVendorAutoFilled(false);
    }
  }, [formData.pcbNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handlePCBChange = (pcbNumber: string, isDuplicateConfirmed: boolean) => {
    setFormData(prev => ({ ...prev, pcbNumber, isDuplicateConfirmed }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.submitterRole || !formData.submitterEmployeeId) {
      alert("Traceability fields are mandatory.");
      return;
    }

    if (formData.quantity === undefined || Number(formData.quantity) <= 0) {
      alert("Please enter a valid Quantity.");
      return;
    }

    if (formData.station === 'Other' && !formData.stationName) {
      alert("Please specify the Station Name.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await dbService.addRecord({
        ...formData,
        area: 'RF Coding',
        createdBy: 'public_terminal',
      });
      setSubmittedData(formData);
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      alert('Cloud Sync Error. Please check connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewEntry = () => {
    setFormData(getInitialState());
    setIsSubmitted(false);
    setSubmittedData(null);
    setIsVendorAutoFilled(false);
    setManpowerAlert(null);
    window.scrollTo(0, 0);
  };

  const hasValue = (val: any) => val !== undefined && val !== null && val.toString().trim().length > 0;
  
  const inputClasses = (val: any) => `w-full p-5 bg-white border-4 rounded-2xl text-xl font-black text-slate-900 caret-blue-600 outline-none transition-[border-color,background-color] duration-150 focus:ring-8 focus:ring-blue-100 ${
    hasValue(val) 
      ? 'border-blue-600 bg-blue-50' 
      : 'border-slate-300 bg-slate-50'
  }`;

  const labelClasses = "text-base font-black text-slate-900 uppercase tracking-widest ml-1 mb-2 block";

  if (isSubmitted && submittedData) {
    return (
      <div className="max-w-3xl mx-auto pb-12 px-4 md:px-8">
        <PublicHeader />
        <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-green-600 px-8 py-10 text-white text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
              <i className="fas fa-check"></i>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tight">Submission Successful</h2>
            <p className="text-green-100 font-black text-lg mt-2 uppercase tracking-widest">Quality Record Committed</p>
          </div>

          <div className="p-10 md:p-14 space-y-10">
            <div className="flex items-center gap-5 border-b-4 border-slate-50 pb-6">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                <i className="fas fa-file-invoice"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Final Summary Report</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(submittedData).map(([key, value]) => {
                if (!value || !FIELD_LABELS[key]) return null;
                return (
                  <div key={key} className="space-y-1 bg-slate-50 p-5 rounded-2xl border-4 border-slate-100 transition-all">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">{FIELD_LABELS[key]}</span>
                    <p className="text-lg font-black text-slate-900 break-words uppercase">{value.toString()}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-10 flex flex-col sm:flex-row gap-6">
              <button 
                onClick={handleNewEntry} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-2xl shadow-blue-200 transition-all active:scale-95 text-xl border-b-8 border-blue-800 uppercase"
              >
                NEW SUBMISSION
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
    <div className="max-w-4xl mx-auto pb-12 px-4 md:px-8">
      <PublicHeader />
      
      <div className={`bg-white rounded-[3rem] shadow-2xl border-4 border-slate-100 overflow-hidden transition-all ${isSubmitting ? 'opacity-50 pointer-events-none scale-95' : ''}`}>
        <div className="bg-blue-600 px-8 py-10 text-white flex justify-between items-center border-b-8 border-blue-700">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">RF Area Quality</h2>
            <p className="text-blue-100 font-black text-xs mt-1 uppercase tracking-[0.3em]">Industrial Data Submission Node</p>
          </div>
          <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner">
            {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-microchip"></i>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
          {/* Submitter Info Section */}
          <TraceabilityForm data={formData} onChange={handleChange} />
          
          {/* Shift and Station Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100 shadow-inner">
            <div className="space-y-1">
              <label className={labelClasses}>Reporting Date <span className="text-red-600 text-xl">*</span></label>
              <input 
                type="date" 
                name="date" 
                value={formData.date || ''} 
                onChange={handleChange} 
                required 
                className={inputClasses(formData.date)} 
              />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Current Shift <span className="text-red-600 text-xl">*</span></label>
              <div className="relative">
                <select 
                  name="shift" 
                  value={formData.shift || ''} 
                  onChange={handleChange} 
                  className={inputClasses(formData.shift)}
                >
                  <option value="A">SHIFT A</option>
                  <option value="B">SHIFT B</option>
                  <option value="C">SHIFT C</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600 text-xl">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Block Area <span className="text-red-600 text-xl">*</span></label>
              <div className="flex gap-4">
                {['A', 'B'].map(b => (
                  <button 
                    key={b} 
                    type="button" 
                    onClick={() => setFormData(p => ({...p, block: b as 'A'|'B'}))} 
                    className={`flex-1 py-5 rounded-2xl font-black border-4 transition-all text-xl uppercase tracking-tighter ${
                      formData.block === b ? 'bg-blue-600 border-blue-600 text-white shadow-2xl scale-105' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClasses}>Assigned Station <span className="text-red-600 text-xl">*</span></label>
            <div 
              onClick={() => setIsStationModalOpen(true)}
              className={`w-full p-8 bg-white border-4 rounded-[2.5rem] cursor-pointer transition-all flex justify-between items-center group shadow-xl ${formData.stationName ? 'border-blue-600 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12 ${formData.stationName ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                  <i className="fas fa-map-marker-alt text-2xl"></i>
                </div>
                <div>
                  <span className={`block text-3xl font-black transition-colors ${formData.stationName ? 'text-blue-900' : 'text-slate-400'}`}>
                    {formData.stationName?.toUpperCase() || (formData.station === 'Other' ? 'CUSTOM STATION' : 'CHOOSE STATION')}
                  </span>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mt-1 block">Active RF Bench Location</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {formData.stationName && <i className="fas fa-check-circle text-blue-600 text-4xl animate-in fade-in zoom-in"></i>}
                <i className={`fas fa-chevron-right text-3xl ${formData.stationName ? 'text-blue-600' : 'text-slate-300'} group-hover:translate-x-3 transition-transform`}></i>
              </div>
            </div>
          </div>

          {/* Configuration Selection Section */}
          <div className="space-y-10 bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100 shadow-inner">
            <div className="space-y-4">
              <label className="text-lg font-black text-blue-600 uppercase tracking-widest flex items-center gap-3">
                <i className="fas fa-satellite-dish"></i>
                RF Type Configuration <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-6">
                {['RF', '4G'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, rgType: type as any, pcbType: (type === 'RF' ? 'G23' : 'Neway Gateway') as any }))}
                    className={`flex-1 py-8 rounded-[2rem] font-black text-3xl border-4 transition-all flex flex-col items-center gap-3 ${formData.rgType === type ? 'bg-blue-600 border-blue-600 text-white shadow-2xl scale-105' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'}`}
                  >
                    <i className={`fas ${type === 'RF' ? 'fa-tower-broadcast' : 'fa-signal'}`}></i>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-top-6 duration-500" key={formData.rgType}>
              <label className="text-lg font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                <i className="fas fa-tags"></i>
                {formData.rgType} Sub-Category Selection <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {subOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, pcbType: opt as any }))}
                    className={`py-6 rounded-2xl font-black text-base border-4 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter ${formData.pcbType === opt ? 'bg-blue-600 border-blue-600 text-white shadow-2xl' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-400'}`}
                  >
                    {opt}
                    {formData.pcbType === opt && <i className="fas fa-check-circle"></i>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PCB Identification and Quantity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-10">
              <div className="p-2 bg-white rounded-[2.5rem] border-4 border-slate-100 shadow-xl">
                <PCBNumberInput 
                  value={formData.pcbNumber || ''} 
                  onChange={handlePCBChange} 
                  moduleType="RF_CODING" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className={labelClasses}>Production Vendor <span className="text-red-600 text-xl">*</span></label>
                  {isVendorAutoFilled && (
                    <span className="text-xs font-black text-green-700 uppercase tracking-[0.2em] bg-green-100 px-4 py-1.5 rounded-full border-2 border-green-500 shadow-sm animate-pulse">
                      <i className="fas fa-robot mr-2"></i> SYSTEM DETECTED
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  name="vendor" 
                  value={formData.vendor || ''} 
                  onChange={handleChange} 
                  readOnly={isVendorAutoFilled}
                  required 
                  className={inputClasses(formData.vendor)} 
                  placeholder="ENTER VENDOR NAME" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-2xl font-black text-slate-900 uppercase tracking-tighter text-center block bg-slate-900 text-white py-3 rounded-2xl shadow-xl">Total NG Units <span className="text-red-400">*</span></label>
              <div className="relative group">
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="quantity" 
                  value={formData.quantity ?? ''} 
                  onChange={handleChange} 
                  required 
                  className="w-full p-6 border-8 border-blue-600 rounded-[2.5rem] text-center text-5xl font-black outline-none bg-white text-blue-900 shadow-2xl focus:ring-16 focus:ring-blue-100 transition-all placeholder:text-slate-100" 
                  placeholder="0"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-100 group-focus-within:text-blue-500 transition-colors">
                  <i className="fas fa-pen-nib text-3xl"></i>
                </div>
              </div>
              <p className="text-xs font-black text-slate-500 text-center uppercase tracking-[0.3em] mt-4 italic bg-slate-100 py-3 rounded-2xl border-4 border-slate-200">Mandatory Manual Verification Required</p>
            </div>
          </div>

          {/* Operator Details Section */}
          <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100 shadow-inner">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                <i className="fas fa-user-gear text-3xl"></i>
              </div>
              <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Manpower Traceability</h4>
            </div>

            {manpowerAlert && (
              <div className={`p-8 rounded-[2.5rem] border-8 flex gap-6 items-start animate-in slide-in-from-top-6 duration-700 shadow-2xl ${
                manpowerAlert.type === 'change' ? 'bg-orange-50 border-orange-600' : 'bg-blue-50 border-blue-600'
              }`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${
                  manpowerAlert.type === 'change' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  <i className={`fas ${manpowerAlert.type === 'change' ? 'fa-triangle-exclamation text-3xl' : 'fa-route text-3xl'}`}></i>
                </div>
                <div>
                   <p className={`text-xl font-black uppercase tracking-tight leading-none ${
                    manpowerAlert.type === 'change' ? 'text-orange-900' : 'text-blue-900'
                  }`}>
                    {manpowerAlert.message}
                  </p>
                  <span className="text-xs font-black uppercase tracking-[0.3em] mt-3 block opacity-70">Immediate Supervisor Review Mandatory</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-1">
                <label className={labelClasses}>Operator Full Name <span className="text-red-600 text-xl">*</span></label>
                <input type="text" name="operatorName" value={formData.operatorName || ''} onChange={handleChange} className={inputClasses(formData.operatorName)} placeholder="AS PER GOVT ID" />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Operator KIM ID <span className="text-red-600 text-xl">*</span></label>
                <input type="text" name="operatorId" value={formData.operatorId || ''} onChange={handleChange} className={inputClasses(formData.operatorId)} placeholder="KIM-OP-XXXX" />
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-1">
              <label className={labelClasses}>Factory Part Code <span className="text-red-600 text-xl">*</span></label>
              <input type="text" name="partCode" value={formData.partCode || ''} onChange={handleChange} required className={inputClasses(formData.partCode)} placeholder="ENTER BOM PART CODE" />
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Issue Technical Description <span className="text-red-600 text-xl">*</span></label>
              <textarea 
                name="issueDescription" 
                value={formData.issueDescription || ''} 
                onChange={handleChange} 
                required 
                rows={5} 
                className={`w-full p-8 border-4 rounded-[3rem] text-xl font-black text-slate-900 caret-blue-600 outline-none transition-all focus:ring-8 focus:ring-blue-100 ${
                  hasValue(formData.issueDescription) ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-slate-50'
                }`} 
                placeholder="DESCRIBE THE SPECIFIC QUALITY ABNORMALITY IN TECHNICAL TERMS..."
              ></textarea>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-10 rounded-[3rem] shadow-2xl shadow-blue-200 text-4xl transition-all transform active:scale-[0.95] flex items-center justify-center gap-8 uppercase tracking-tighter border-b-12 border-blue-900">
            {isSubmitting ? <><i className="fas fa-sync-alt fa-spin"></i> SYNCING DATA...</> : <><i className="fas fa-cloud-upload-alt"></i> COMMIT TO CLOUD</>}
          </button>
        </form>
      </div>

      <div className="mt-14 flex justify-center pb-20">
        <button 
          onClick={() => navigate('/')}
          className="bg-white px-10 py-5 rounded-3xl border-4 border-slate-200 text-slate-900 hover:text-blue-600 hover:border-blue-600 font-black text-lg uppercase tracking-widest flex items-center gap-4 transition-all active:scale-95 shadow-xl"
        >
          <i className="fas fa-home text-2xl"></i> EXIT TO SYSTEM HOME
        </button>
      </div>

      {isStationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-t-[4rem] md:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12 duration-500 border-8 border-white/20">
            <div className="bg-blue-600 p-10 text-white flex justify-between items-center border-b-8 border-blue-700">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Station Selection</h3>
                <p className="text-blue-100 text-xs font-black uppercase tracking-[0.4em] mt-1">Area — Block {formData.block}</p>
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
                      ? 'bg-blue-600 border-blue-600 text-white shadow-2xl scale-105' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-blue-500'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">ID</span>
                    {s === 'Other' ? 'OTHER' : s}
                  </button>
                ))}
              </div>

              {formData.station === 'Other' && (
                <div className="animate-in zoom-in duration-500 p-8 bg-slate-50 rounded-[3rem] border-4 border-dashed border-blue-300">
                  <label className="text-base font-black text-blue-600 uppercase tracking-widest block mb-4">Manual Station Identification</label>
                  <input 
                    type="text" 
                    name="stationName" 
                    autoFocus
                    value={formData.stationName || ''} 
                    onChange={handleChange}
                    className="w-full p-8 border-4 border-blue-200 rounded-[2rem] bg-white text-3xl font-black text-slate-900 caret-blue-600 outline-none focus:border-blue-600 focus:ring-12 focus:ring-blue-100 transition-all"
                    placeholder="ENTER BENCH ID..."
                  />
                  <button 
                    onClick={() => setIsStationModalOpen(false)}
                    className="w-full mt-8 bg-blue-600 text-white font-black py-6 rounded-[2rem] shadow-2xl active:scale-95 transition-all text-2xl uppercase border-b-8 border-blue-800"
                  >
                    CONFIRM SELECTION
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

export default RFCodingForm;
