
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: Choice
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [recoveredUser, setRecoveredUser] = useState<any>(null);

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const user = dbService.findUserByMobile(mobile);
    if (user) {
      alert('Success: OTP "1234" sent to ' + mobile);
      setRecoveredUser(user);
      setStep(2);
      setError('');
    } else {
      setError('Mobile number not found in system.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '1234') {
      setStep(3);
      setError('');
    } else {
      setError('Invalid OTP code.');
    }
  };

  const handleRecoverUsername = () => {
    alert(`Success: Your username has been sent to ${recoveredUser.email}`);
    navigate('/login');
  };

  const handleResetPassword = () => {
    alert(`Success: A secure password reset link has been sent to ${recoveredUser.email}`);
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 p-4 overflow-y-auto">
      {/* Back Button - Top Left */}
      <button 
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 bg-white px-5 py-3 rounded-2xl shadow-lg border border-gray-100 text-blue-900 hover:text-blue-600 font-black transition-all flex items-center gap-3 group"
      >
        <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-sm uppercase tracking-widest">Back to Home</span>
      </button>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md my-auto border border-white/50">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mb-6 mx-auto shadow-xl shadow-blue-100">
            <i className="fas fa-key"></i>
          </div>
          <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Access Recovery</h2>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mt-2 leading-relaxed">Identity verification required to regain system access.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black mb-6 border border-red-100 flex items-center gap-3">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Registered Mobile</label>
              <input type="tel" required value={mobile} onChange={e => setMobile(e.target.value)} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-lg text-gray-700 focus:bg-white transition-all outline-none focus:ring-4 focus:ring-blue-50" placeholder="99XXXXXXXX" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-200 text-lg transition-all transform active:scale-[0.98]">
              SEND VERIFICATION OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Verification Code</label>
              <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center text-4xl font-black tracking-[0.5em] text-blue-600 outline-none focus:bg-white transition-all" maxLength={4} placeholder="••••" />
              <p className="text-center text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest">Enter the 4-digit code sent to your device</p>
            </div>
            <button type="submit" className="w-full bg-green-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-green-100 text-lg transition-all transform active:scale-[0.98]">
              VERIFY CODE
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-center gap-2 mb-6">
              <i className="fas fa-check-circle text-green-600"></i>
              <span className="text-xs font-black text-green-800 uppercase tracking-widest">Verification Successful</span>
            </div>
            <p className="text-center font-black text-gray-500 text-sm mb-6 uppercase tracking-tight">Select a recovery action:</p>
            <button onClick={handleRecoverUsername} className="w-full p-5 bg-white text-blue-700 border border-blue-100 rounded-2xl font-black flex items-center justify-between hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm">
              <span className="uppercase tracking-widest text-xs">Recover Username</span>
              <i className="fas fa-at"></i>
            </button>
            <button onClick={handleResetPassword} className="w-full p-5 bg-white text-purple-700 border border-purple-100 rounded-2xl font-black flex items-center justify-between hover:bg-purple-50 hover:border-purple-200 transition-all shadow-sm">
              <span className="uppercase tracking-widest text-xs">Reset Password</span>
              <i className="fas fa-lock-open"></i>
            </button>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-gray-50 text-center flex flex-col gap-4">
          <Link to="/login" className="text-gray-400 hover:text-blue-600 text-sm font-black uppercase tracking-widest transition-colors">
            Return to Login
          </Link>
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Encrypted Recovery Session</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
