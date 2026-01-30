
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainPCBRecord, ModuleType } from '../types';
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
  date: 'Production Date',
  shift: 'Shift',
  stationName: 'Bench Identification',
  issueType: 'Root Cause',
  issueCategory: 'Defect Category',
  vendor: 'Vendor',
  customer: 'Customer',
  firmware: 'FW Version',
  lineLeader: 'Line Leader',
  quantity: 'Units NG',
  pcbNumber: 'PCB ID',
  operatorName: 'Operator Name',
  submitterName: 'Submitter Name'
};

interface MainPCBCodingFormProps {
  moduleType: ModuleType;
  title: string;
  user: any; 
}

const MainPCBCodingForm: React.FC<MainPCBCodingFormProps> = ({ moduleType, title }) => {
  const navigate = useNavigate();
  const [isVendorAutoFilled, setIsVendorAutoFilled] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any>(null);
  
  const [manpowerAlert, setManpowerAlert] = useState<{ type: 'change' | 'history', message: string } | null>(null);

  const getInitialState = (): Partial<MainPCBRecord> => ({
    date: new Date().toISOString().split('T')[0],
    shift: 'A',
    station: '1',
    stationName: 'Station 1',
    issueType: 'Process Issue',
    issueCategory: 'Digit Cut',
    quantity: undefined,
    moduleType: moduleType,
    submitterName: '',
    submitterEmployeeId: '',
    submitterRole: '' as any,
    operatorName: '',
    operatorId: '',
    vendor: '',
    customer: '',
    firmware: '',
    lineLeader: '',
    shiftInchargeProduction: '',
    reasonDescription: '',
    pcbNumber: '',
    isDuplicateConfirmed: false
  });

  const [formData, setFormData] = useState<Partial<MainPCBRecord>>(getInitialState());

  const stationConfig = useMemo(() => {
    switch (moduleType) {
      case 'PCB_1PH':
        return { header: 'Main PCB 1 Phase Area', count: 12, color: 'green' };
      case 'PCB_3PH':
        return { header: 'Main PCB 3 Phase Area', count: 6, color: 'emerald' };
      case 'LTCT':
        return { header: 'LTCT 3 Phase Area', count: 5, color: 'orange' };
      default:
        return { header: 'General Coding Area', count: 12, color: 'gray' };
    }
  }, [moduleType]);

  const stations = useMemo(() => {
    const list = Array.from({ length: stationConfig.count }, (_, i) => (i + 1).toString());
    list.push('Other');
    return list;
  }, [stationConfig]);

  useEffect(() => {
    if (formData.operatorId && formData.operatorId.length >= 3) {
      const history = dbService.getOperatorAssignmentHistory(formData.operatorId, formData.date!);
      const prevStationOp = dbService.getPreviousShiftOperator(moduleType, formData.shift!, formData.station!, formData.date!);

      if (prevStationOp && prevStationOp.operatorId !== formData.operatorId) {
        setManpowerAlert({
          type: 'change',
          message: `MANPOWER CHANGE ALERT: Yesterday, ${prevStationOp.operatorName} (${prevStationOp.operatorId}) was seated in this area.`
        });
      } else if (history && history.moduleType !== moduleType) {
        setManpowerAlert({
          type: 'history',
          message: `MOVEMENT DETECTED: Previously this operator was assigned to ${AREA_LABELS[history.moduleType] || history.moduleType}.`
        });
      } else {
        setManpowerAlert(null);
      }
    } else {
      setManpowerAlert(null);
    }
  }, [formData.operatorId, formData.station, formData.shift, formData.date, moduleType]);

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
    setErrorMessage(null);

    if (!formData.submitterRole) {
      setErrorMessage("Designated role is mandatory for quality records.");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setErrorMessage("Please enter a valid Quantity (must be greater than 0).");
      return;
    }
    if (formData.station === 'Other' && !formData.stationName) {
      setErrorMessage("Please specify the Station Name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const record = await dbService.addRecord({
        ...formData,
        createdBy: 'public_terminal',
      });
      setSubmittedData(record);
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage(err.message || 'Cloud Sync failed. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewEntry = () => {
    setFormData(getInitialState());
    setIsSubmitted(false);
    setSubmittedData(null);
    setErrorMessage(null);
    setIsVendorAutoFilled(false);
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
          <div className={`bg-${stationConfig.color}-600 px-8 py-12 text-white text-center border-b-8 border-${stationConfig.color}-700`}>
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
              <i className="fas fa-check"></i>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tight">Data Committed</h2>
            <p className="text-white/90 font-black text-lg mt-2 uppercase tracking-widest">Quality record successfully synced to vault</p>
          </div>

          <div className="p-10 md:p-14 space-y-10">
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
                className={`flex-1 bg-${stationConfig.color}-600 hover:bg-${stationConfig.color}-700 text-white font-black py-6 rounded-3xl shadow-2xl transition-all active:scale-95 text-xl border-b-8 border-${stationConfig.color}-800 uppercase`}
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
    <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0">
      <PublicHeader />
      
      <div className={`bg-white rounded-[3.5rem] shadow-2xl border-4 border-slate-100 overflow-hidden mt-6 transition-all ${isSubmitting ? 'opacity-50 pointer-events-none scale-95' : ''}`}>
        <div className={`bg-${stationConfig.color}-600 px-10 py-12 text-white flex justify-between items-center border-b-8 border-${stationConfig.color}-700`}>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">{title}</h2>
            <p className="text-white font-black text-xs uppercase tracking-[0.4em] mt-2 opacity-80">Industrial Production Data Node</p>
          </div>
          <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center text-6xl shadow-inner">
            {isSubmitting ? <i className="fas fa-sync-alt fa-spin"></i> : <i className="fas fa-microchip"></i>}
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
          
          <TraceabilityForm data={formData} onChange={handleChange} disabled={isSubmitting} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100 shadow-inner">
            <div className="space-y-1">
              <label className={labelClasses}>Production Date <span className="text-red-600 text-xl">*</span></label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClasses(formData.date)} disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Current Shift <span className="text-red-600 text-xl">*</span></label>
              <div className="relative">
                <select name="shift" value={formData.shift} onChange={handleChange} className={inputClasses(formData.shift)} disabled={isSubmitting}>
                  <option value="A">SHIFT A</option>
                  <option value="B">SHIFT B</option>
                  <option value="C">SHIFT C</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600 text-xl">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClasses}>Assigned Bench <span className="text-red-600 text-xl">*</span></label>
            <div 
              onClick={() => !isSubmitting && setIsStationModalOpen(true)}
              className={`w-full p-8 bg-white border-4 rounded-[2.5rem] transition-all flex justify-between items-center group shadow-xl ${isSubmitting ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} ${formData.stationName ? 'border-blue-600 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12 ${formData.stationName ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                  <i className="fas fa-location-dot text-2xl"></i>
                </div>
                <div>
                  <span className={`block text-3xl font-black transition-colors ${formData.stationName ? 'text-blue-900' : 'text-slate-400'}`}>
                    {formData.stationName?.toUpperCase() || (formData.station === 'Other' ? 'CUSTOM BENCH' : 'PICK STATION')}
                  </span>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mt-1 block">{stationConfig.header.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {formData.stationName && <i className="fas fa-check-circle text-blue-600 text-4xl animate-in fade-in zoom-in"></i>}
                <i className={`fas fa-chevron-right text-3xl ${formData.stationName ? 'text-blue-600' : 'text-slate-300'} group-hover:translate-x-3 transition-transform`}></i>
              </div>
            </div>
          </div>

          {/* Operator Details Section */}
          <div className="bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100 shadow-inner space-y-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                <i className="fas fa-id-card-clip text-3xl"></i>
              </div>
              <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Manpower Verification</h4>
            </div>

            {manpowerAlert && (
              <div className={`p-8 rounded-[2.5rem] border-8 flex gap-6 items-start animate-in zoom-in duration-700 shadow-2xl ${
                manpowerAlert.type === 'change' ? 'bg-orange-50 border-orange-600' : 'bg-blue-50 border-blue-600'
              }`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${
                  manpowerAlert.type === 'change' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  <i className={`fas ${manpowerAlert.type === 'change' ? 'fa-user-slash text-3xl' : 'fa-route text-3xl'}`}></i>
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
                <input type="text" name="operatorName" value={formData.operatorName || ''} onChange={handleChange} required className={inputClasses(formData.operatorName)} placeholder="AS PER GOVT ID" disabled={isSubmitting} />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Operator KIM ID <span className="text-red-600 text-xl">*</span></label>
                <input type="text" name="operatorId" value={formData.operatorId || ''} onChange={handleChange} required className={inputClasses(formData.operatorId)} placeholder="KIM-OP-XXXX" disabled={isSubmitting} />
              </div>
            </div>
          </div>

          <div className="bg-white p-2 rounded-[3.5rem] border-4 border-slate-100 shadow-xl">
             <PCBNumberInput 
               value={formData.pcbNumber || ''} 
               onChange={handlePCBChange} 
               moduleType={moduleType} 
               disabled={isSubmitting}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-900 p-10 rounded-[3rem] border-8 border-slate-800 shadow-2xl gap-10">
            <div className="space-y-1">
              <label className="text-base font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Root Cause Type <span className="text-red-400 text-xl">*</span></label>
              <div className="relative">
                <select name="issueType" value={formData.issueType} onChange={handleChange} className="w-full p-6 border-4 border-slate-700 rounded-2xl bg-slate-800 text-white font-black text-xl outline-none focus:border-blue-500 transition-all appearance-none" disabled={isSubmitting}>
                  <option value="Process Issue">PROCESS ISSUE</option>
                  <option value="Vendor Issue">VENDOR ISSUE</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500 text-2xl">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-base font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Defect Category <span className="text-red-400 text-xl">*</span></label>
              <div className="relative">
                <select name="issueCategory" value={formData.issueCategory} onChange={handleChange} className="w-full p-6 border-4 border-slate-700 rounded-2xl bg-slate-800 text-white font-black text-xl outline-none focus:border-blue-500 transition-all appearance-none" disabled={isSubmitting}>
                  <option value="Digit Cut">DIGIT CUT</option>
                  <option value="PCB Off">PCB OFF</option>
                  <option value="Programming Fail">PROGRAMMING FAIL</option>
                  <option value="Operation Skip">OPERATION SKIP</option>
                  <option value="No Clear">NO CLEAR</option>
                  <option value="Components Damage">COMPONENTS DAMAGE</option>
                  <option value="Other Issue">OTHER ISSUE</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500 text-2xl">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-2">
                <label className={labelClasses}>Production Vendor <span className="text-red-600 text-xl">*</span></label>
                {isVendorAutoFilled && (
                  <span className="text-[10px] font-black text-green-700 uppercase tracking-widest bg-green-100 px-3 py-1 rounded-full border-2 border-green-500 shadow-sm animate-pulse">AUTO DETECTED</span>
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
                placeholder="VENDOR NAME"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>End Customer <span className="text-red-600 text-xl">*</span></label>
              <input type="text" name="customer" value={formData.customer || ''} onChange={handleChange} required className={inputClasses(formData.customer)} placeholder="CLIENT NAME" disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>FW Version <span className="text-red-600 text-xl">*</span></label>
              <input type="text" name="firmware" value={formData.firmware || ''} onChange={handleChange} required className={inputClasses(formData.firmware)} placeholder="V.XX.YY" disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Line Leader <span className="text-red-600 text-xl">*</span></label>
              <input type="text" name="lineLeader" value={formData.lineLeader || ''} onChange={handleChange} required className={inputClasses(formData.lineLeader)} placeholder="LEADER NAME" disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Prod. Incharge <span className="text-red-600 text-xl">*</span></label>
              <input type="text" name="shiftInchargeProduction" value={formData.shiftInchargeProduction || ''} onChange={handleChange} required className={inputClasses(formData.shiftInchargeProduction)} placeholder="INCHARGE NAME" disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label className="text-2xl font-black text-slate-900 uppercase tracking-tighter text-center block bg-slate-900 text-white py-3 rounded-2xl shadow-xl">Units NG <span className="text-red-400">*</span></label>
              <div className="relative group">
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="quantity" 
                  value={formData.quantity ?? ''} 
                  onChange={handleChange} 
                  required 
                  className={`w-full p-6 border-8 border-${stationConfig.color}-600 rounded-3xl text-center text-5xl font-black text-slate-900 bg-white outline-none focus:ring-12 focus:ring-${stationConfig.color}-100 transition-all placeholder:text-slate-100`} 
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClasses}>Detailed Failure Observations <span className="text-red-600 text-xl">*</span></label>
            <textarea 
              name="reasonDescription" 
              value={formData.reasonDescription || ''} 
              onChange={handleChange} 
              required 
              rows={5} 
              className={`w-full p-8 border-4 rounded-[3rem] text-xl font-black text-slate-900 caret-blue-600 outline-none transition-all focus:ring-8 focus:ring-blue-100 ${
                hasValue(formData.reasonDescription) ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-slate-50'
              }`} 
              placeholder="NOTES FOR MANAGEMENT QUALITY REVIEW..."
              disabled={isSubmitting}
            ></textarea>
          </div>

          <div className="pt-10">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full bg-${stationConfig.color}-600 hover:bg-${stationConfig.color}-700 text-white font-black py-10 rounded-[3rem] shadow-2xl shadow-${stationConfig.color}-200 text-4xl transition-all transform active:scale-95 flex items-center justify-center gap-8 uppercase tracking-tighter border-b-12 border-${stationConfig.color}-800`}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-sync-alt fa-spin"></i>
                  COMMITTING DATA...
                </>
              ) : (
                <>
                  <i className="fas fa-check-double"></i>
                  SUBMIT RECORD
                </>
              )}
            </button>
          </div>
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
            <div className={`bg-${stationConfig.color}-600 p-10 text-white flex justify-between items-center border-b-8 border-${stationConfig.color}-700`}>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Station Assignment</h3>
                <p className="text-white text-xs font-black uppercase tracking-[0.4em] mt-1 opacity-80">{stationConfig.header.toUpperCase()}</p>
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
                      ? `bg-${stationConfig.color}-600 border-${stationConfig.color}-600 text-white shadow-2xl scale-105` 
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-blue-500'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">ID</span>
                    {s === 'Other' ? 'OTHER' : s}
                  </button>
                ))}
              </div>

              {formData.station === 'Other' && (
                <div className="animate-in zoom-in duration-500 p-8 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-300">
                  <label className={`text-base font-black text-${stationConfig.color}-600 uppercase tracking-widest block mb-4`}>Specify Station Identifier</label>
                  <input 
                    type="text" 
                    name="stationName" 
                    autoFocus
                    value={formData.stationName || ''} 
                    onChange={handleChange}
                    className={`w-full p-8 border-4 border-${stationConfig.color}-200 rounded-[2rem] bg-white text-3xl font-black text-slate-900 caret-${stationConfig.color}-600 outline-none focus:border-${stationConfig.color}-600 focus:ring-12 focus:ring-${stationConfig.color}-100 transition-all`}
                    placeholder="ENTER BENCH ID..."
                  />
                  <button 
                    onClick={() => setIsStationModalOpen(false)}
                    className={`w-full mt-8 bg-${stationConfig.color}-600 text-white font-black py-6 rounded-[2rem] shadow-2xl active:scale-95 transition-all text-2xl uppercase border-b-8 border-${stationConfig.color}-800`}
                  >
                    CONFIRM STATION
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

export default MainPCBCodingForm;
