
import React from 'react';
import { UserRole } from '../types';

interface TraceabilityFormProps {
  data: any;
  onChange: (e: any) => void;
  disabled?: boolean;
}

const TraceabilityForm: React.FC<TraceabilityFormProps> = ({ data, onChange, disabled }) => {
  const hasValue = (val: any) => val && val.toString().trim().length > 0;

  const inputClasses = (val: any) => `w-full p-5 bg-white border-4 rounded-2xl text-xl font-black text-slate-900 caret-blue-600 transition-[border-color,background-color] duration-150 outline-none focus:ring-8 focus:ring-blue-100 ${
    hasValue(val) 
      ? 'border-blue-600 bg-blue-50' 
      : 'border-slate-300 bg-slate-50'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  const labelClasses = "text-base font-black text-slate-900 uppercase tracking-widest ml-1 mb-2 block";

  return (
    <div className="bg-white p-8 md:p-10 rounded-[3rem] border-4 border-slate-100 shadow-2xl space-y-10 mb-10">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
          <i className="fas fa-id-card text-3xl"></i>
        </div>
        <div>
          <h3 className="font-black text-slate-900 uppercase text-2xl tracking-tighter">Submitter Verification</h3>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Personnel Traceability & Audit Trail</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {/* Full Name Field */}
        <div className="space-y-1">
          <label className={labelClasses}>
            Legal Full Name <span className="text-red-600 text-xl">*</span>
          </label>
          <div className="relative">
            <input 
              type="text" 
              name="submitterName" 
              required 
              disabled={disabled}
              value={data.submitterName || ''} 
              onChange={onChange} 
              autoComplete="off"
              className={inputClasses(data.submitterName)} 
              placeholder="AS PER PAYROLL"
            />
            {hasValue(data.submitterName) && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-600 text-2xl">
                <i className="fas fa-check-circle"></i>
              </div>
            )}
          </div>
        </div>

        {/* Employee ID Field */}
        <div className="space-y-1">
          <label className={labelClasses}>
            KIM Employee ID <span className="text-red-600 text-xl">*</span>
          </label>
          <div className="relative">
            <input 
              type="text" 
              name="submitterEmployeeId" 
              required 
              disabled={disabled}
              value={data.submitterEmployeeId || ''} 
              onChange={onChange} 
              className={inputClasses(data.submitterEmployeeId)} 
              placeholder="KIM-XXXX"
            />
            {hasValue(data.submitterEmployeeId) && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-600 text-2xl">
                <i className="fas fa-check-circle"></i>
              </div>
            )}
          </div>
        </div>

        {/* Submitter Role Field */}
        <div className="space-y-1">
          <label className={labelClasses}>
            Designated Role <span className="text-red-600 text-xl">*</span>
          </label>
          <div className="relative">
            <select 
              name="submitterRole" 
              required 
              disabled={disabled}
              value={data.submitterRole || ''} 
              onChange={onChange} 
              className={inputClasses(data.submitterRole)}
            >
              <option value="">SELECT ROLE</option>
              <option value={UserRole.OPERATOR}>{UserRole.OPERATOR.toUpperCase()}</option>
              <option value={UserRole.LINE_LEADER}>{UserRole.LINE_LEADER.toUpperCase()}</option>
              <option value={UserRole.INSPECTOR}>{UserRole.INSPECTOR.toUpperCase()}</option>
            </select>
            <div className={`absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-xl ${hasValue(data.submitterRole) ? 'text-blue-600' : 'text-slate-400'}`}>
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraceabilityForm;
