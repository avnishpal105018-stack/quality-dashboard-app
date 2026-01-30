
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, ComposedChart, AreaChart, Area
} from 'recharts';
import { dbService } from '../services/dbService';
import { UserRole, ModuleType, ProcessObservationRecord } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';

const COLORS = ['#4f46e5', '#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b'];
const SHIFT_COLORS: Record<string, string> = { 'A': '#4f46e5', 'B': '#10b981', 'C': '#f59e0b' };

const AREA_LABELS: Record<string, string> = {
  'RF_CODING': 'RF Coding Area',
  'PCB_1PH': 'Main PCB 1 Phase',
  'PCB_3PH': 'Main PCB 3 Phase',
  'LTCT': 'LTCT Coding Area'
};

type DashboardContext = 'RF_CODING' | 'PCB_1PH' | 'PCB_3PH' | 'LTCT';
type PageTab = 'PRODUCTION' | 'OBSERVATION';
type TimeRange = 'DAILY' | 'WEEKLY' | 'MONTHLY';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('PRODUCTION');
  const [context, setContext] = useState<DashboardContext>('RF_CODING');
  const [timeRange, setTimeRange] = useState<TimeRange>('DAILY');
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [allObservations, setAllObservations] = useState<ProcessObservationRecord[]>([]);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Time Range Helpers
  const weekStartStr = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }, []);

  const monthStartStr = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  }, []);

  // Set default view for Observation to Monthly as per requirement
  useEffect(() => {
    if (activeTab === 'OBSERVATION') {
      setTimeRange('MONTHLY');
    } else {
      setTimeRange('DAILY');
    }
  }, [activeTab]);

  useEffect(() => {
    const storedUser = localStorage.getItem('kimbal_user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));

    const fetchData = () => {
      setAllRecords(dbService.getRecords());
      setAllObservations(dbService.getObservations());
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, []);

  const isManagement = useMemo(() => {
    return currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.SHIFT_INCHARGE;
  }, [currentUser]);

  // DATA PROCESSING - PRODUCTION
  const productionAnalytics = useMemo(() => {
    const areaRecords = allRecords.filter(r => r.moduleType === context);
    
    let filteredRecords = [];
    if (timeRange === 'DAILY') filteredRecords = areaRecords.filter(r => r.date === todayStr);
    else if (timeRange === 'WEEKLY') filteredRecords = areaRecords.filter(r => r.date >= weekStartStr);
    else filteredRecords = areaRecords.filter(r => r.date >= monthStartStr);

    const trendCounts: Record<string, number> = {};
    const trendBase = timeRange === 'DAILY' ? areaRecords.filter(r => r.date === todayStr) : (timeRange === 'WEEKLY' ? areaRecords.filter(r => r.date >= weekStartStr) : areaRecords.filter(r => r.date >= monthStartStr));
    trendBase.forEach(r => { trendCounts[r.date] = (trendCounts[r.date] || 0) + (Number(r.quantity) || 0); });
    const trendData = Object.entries(trendCounts).map(([date, qty]) => ({ date, qty })).sort((a,b) => a.date.localeCompare(b.date));

    const lineCounts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const line = r.stationName || `ST-${r.station}`;
      lineCounts[line] = (lineCounts[line] || 0) + (Number(r.quantity) || 0);
    });
    const lineData = Object.entries(lineCounts).map(([name, qty]) => ({ name, qty })).sort((a,b) => b.qty - a.qty);

    const issueCounts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const issue = r.issueCategory || r.issueDescription || 'Uncategorized';
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });
    const sortedIssues = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]);
    const totalIssues = sortedIssues.reduce((acc, curr) => acc + curr[1], 0);
    let cumulative = 0;
    const paretoData = sortedIssues.map(([name, count]) => {
      cumulative += count;
      return { name, count, cumulative: totalIssues > 0 ? Math.round((cumulative / totalIssues) * 100) : 0 };
    });

    const vendorCounts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      vendorCounts[r.vendor] = (vendorCounts[r.vendor] || 0) + (Number(r.quantity) || 0);
    });
    const vendorData = Object.entries(vendorCounts).map(([name, qty]) => ({ name, qty })).sort((a,b) => b.qty - a.qty);

    const shiftCounts: Record<string, number> = { 'A': 0, 'B': 0, 'C': 0 };
    filteredRecords.forEach(r => { shiftCounts[r.shift] = (shiftCounts[r.shift] || 0) + (Number(r.quantity) || 0); });
    const shiftData = Object.entries(shiftCounts).map(([name, value]) => ({ name: `Shift ${name}`, value }));

    const stationCounts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      stationCounts[r.station] = (stationCounts[r.station] || 0) + (Number(r.quantity) || 0);
    });
    const stationData = Object.entries(stationCounts).map(([name, value]) => ({ name: `ST-${name}`, value }));

    return { trendData, lineData, paretoData, vendorData, shiftData, stationData, totalDisplay: filteredRecords.reduce((acc, curr) => acc + Number(curr.quantity), 0) };
  }, [allRecords, context, todayStr, weekStartStr, monthStartStr, timeRange]);

  // DATA PROCESSING - OBSERVATION (MONTHLY FOCUS)
  const observationAnalytics = useMemo(() => {
    const base = allObservations.filter(o => o.moduleType === context);
    
    // As per requirement, default Observation dashboard to Monthly (month to date)
    const filteredObs = timeRange === 'DAILY' ? base.filter(o => o.date === todayStr) :
                        timeRange === 'WEEKLY' ? base.filter(o => o.date >= weekStartStr) :
                        base.filter(o => o.date >= monthStartStr);

    // 1. Operator Repetition Analysis
    const opRep: Record<string, number> = {};
    filteredObs.forEach(o => {
      const opKey = o.operatorName && o.operatorName.trim() ? `${o.operatorName}` : 'Unnamed Operator';
      opRep[opKey] = (opRep[opKey] || 0) + 1;
    });
    const opRepData = Object.entries(opRep)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 2. Material Wise Observation Chart
    const matObs: Record<string, number> = {};
    filteredObs.forEach(o => {
      const vendor = o.vendor || 'Unknown Vendor';
      matObs[vendor] = (matObs[vendor] || 0) + 1;
    });
    const matObsData = Object.entries(matObs).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // 3. Line Leader Wise Analysis
    const leaderObs: Record<string, number> = {};
    filteredObs.forEach(o => {
      const leader = o.lineLeader || 'Unassigned';
      leaderObs[leader] = (leaderObs[leader] || 0) + 1;
    });
    const leaderObsData = Object.entries(leaderObs).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // 4. Date Wise Observation Trend
    const trendObs: Record<string, number> = {};
    filteredObs.forEach(o => {
      trendObs[o.date] = (trendObs[o.date] || 0) + 1;
    });
    const trendObsData = Object.entries(trendObs).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

    return { opRepData, matObsData, leaderObsData, trendObsData, total: filteredObs.length, records: filteredObs };
  }, [allObservations, context, todayStr, weekStartStr, monthStartStr, timeRange]);

  const exportMasterExcel = async () => {
    if (!isManagement) return;
    setIsExporting("Synthesizing Master Excel Registry...");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Kimbal Quality MIS';

    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };

    Object.entries(AREA_LABELS).forEach(([areaKey, areaName]) => {
      const sheet = workbook.addWorksheet(areaName);
      sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'Bench', key: 'stationName', width: 20 },
        { header: 'Vendor', key: 'vendor', width: 20 },
        { header: 'Line Leader', key: 'lineLeader', width: 20 },
        { header: 'Quantity', key: 'quantity', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Issue Description', key: 'issueDescription', width: 45 }
      ];
      sheet.getRow(1).fill = headerFill;
      sheet.getRow(1).font = headerFont;

      const areaRecords = allRecords.filter(r => r.moduleType === areaKey);
      areaRecords.forEach(r => {
        sheet.addRow({ ...r, stationName: r.stationName || `ST-${r.station}`, status: 'Recorded' });
      });
    });

    const obsSheet = workbook.addWorksheet('Observation Registry');
    obsSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Shift', key: 'shift', width: 10 },
      { header: 'Area', key: 'areaName', width: 25 },
      { header: 'Operator', key: 'operatorName', width: 20 },
      { header: 'Line Leader', key: 'lineLeader', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 20 },
      { header: 'Category', key: 'observationCategory', width: 25 },
      { header: 'Description', key: 'issueDescription', width: 45 },
      { header: 'Responsible', key: 'responsibleType', width: 20 },
      { header: 'Status', key: 'status', width: 12 }
    ];
    obsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    obsSheet.getRow(1).font = headerFont;

    allObservations.forEach(o => {
      obsSheet.addRow({ ...o, areaName: AREA_LABELS[o.moduleType] || o.moduleType });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kimbal_Quality_Master_Data_${Date.now()}.xlsx`;
    a.click();
    setIsExporting(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans pb-16">
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-lg flex items-center justify-center">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center border-8 border-white/20">
            <div className="w-24 h-24 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8"></div>
            <p className="font-black text-indigo-900 uppercase tracking-widest text-xl">{isExporting}</p>
          </div>
        </div>
      )}

      {/* Corporate Header */}
      <header className="bg-white px-8 py-6 border-b-4 border-slate-200 sticky top-0 z-50 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl">K</div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Kimbal Quality MIS</h1>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-1.5 opacity-80">Industrial Command Center</p>
          </div>
        </div>

        {/* Dashboard Range Selector */}
        <div className="flex bg-slate-100 p-2 rounded-[2rem] gap-2 border-2 border-slate-200">
          <button 
            onClick={() => setTimeRange('DAILY')} 
            className={`px-6 py-3.5 rounded-[1.5rem] font-black text-[10px] transition-all uppercase tracking-widest border-2 ${timeRange === 'DAILY' ? 'bg-white border-white text-emerald-600 shadow-lg scale-105' : 'bg-transparent border-transparent text-slate-500 hover:text-emerald-700'}`}
          >
            Daily Live
          </button>
          <button 
            onClick={() => setTimeRange('WEEKLY')} 
            className={`px-6 py-3.5 rounded-[1.5rem] font-black text-[10px] transition-all uppercase tracking-widest border-2 ${timeRange === 'WEEKLY' ? 'bg-white border-white text-blue-600 shadow-lg scale-105' : 'bg-transparent border-transparent text-slate-500 hover:text-blue-700'}`}
          >
            Weekly Dashboard
          </button>
          <button 
            onClick={() => setTimeRange('MONTHLY')} 
            className={`px-6 py-3.5 rounded-[1.5rem] font-black text-[10px] transition-all uppercase tracking-widest border-2 ${timeRange === 'MONTHLY' ? 'bg-white border-white text-indigo-600 shadow-lg scale-105' : 'bg-transparent border-transparent text-slate-500 hover:text-indigo-700'}`}
          >
            Monthly View
          </button>
        </div>

        <div className="flex bg-slate-100 p-2 rounded-[2rem] gap-2 border-2 border-slate-200">
          <button 
            onClick={() => setActiveTab('PRODUCTION')} 
            className={`px-8 py-3.5 rounded-[1.5rem] font-black text-xs transition-all uppercase tracking-widest border-2 ${activeTab === 'PRODUCTION' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' : 'bg-transparent border-transparent text-slate-500 hover:text-indigo-800'}`}
          >
            PRODUCTION
          </button>
          <button 
            onClick={() => setActiveTab('OBSERVATION')} 
            className={`px-8 py-3.5 rounded-[1.5rem] font-black text-xs transition-all uppercase tracking-widest border-2 ${activeTab === 'OBSERVATION' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' : 'bg-transparent border-transparent text-slate-500 hover:text-indigo-800'}`}
          >
            OBSERVATIONS
          </button>
        </div>

        <button onClick={exportMasterExcel} className="bg-emerald-50 text-emerald-600 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 border-4 border-emerald-100 shadow-md">
          <i className="fas fa-file-excel"></i> EXCEL MASTER
        </button>
      </header>

      {/* Area Selector */}
      <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 sticky top-[108px] lg:top-[112px] z-40 overflow-x-auto whitespace-nowrap scrollbar-hide shadow-inner">
        <div className="max-w-[1800px] mx-auto flex items-center gap-6">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Area Context:</span>
          {Object.entries(AREA_LABELS).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setContext(id as DashboardContext)}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-4 ${context === id ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-110' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={dashboardRef} className="max-w-[1800px] mx-auto p-6 md:p-10 space-y-12 animate-in fade-in duration-500">
        
        {activeTab === 'PRODUCTION' ? (
          <div className="space-y-12">
            <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-2xl flex items-center justify-between text-white border-b-12 border-indigo-800">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{AREA_LABELS[context]}</h2>
                <p className="text-indigo-100 font-black text-xs uppercase tracking-[0.4em] mt-3">Production yield Stream — {timeRange}</p>
              </div>
              <div className="text-right">
                <span className="text-6xl font-black tracking-tighter">{productionAnalytics.totalDisplay}</span>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Units Logged</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-12">
               {/* Trend Chart */}
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-4 border-white h-[450px] flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 uppercase mb-8">Yield trend</h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={productionAnalytics.trendData}>
                        <XAxis dataKey="date" hide />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                        <Tooltip /><Area type="monotone" dataKey="qty" stroke="#4f46e5" strokeWidth={5} fill="#4f46e5" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               {/* Bench Chart */}
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-4 border-white h-[450px] flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 uppercase mb-8">Bench distribution</h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productionAnalytics.lineData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 10, fontWeight: 900}} />
                        <Tooltip /><Bar dataKey="qty" fill="#10b981" radius={[0, 10, 10, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               {/* Pareto Chart */}
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-4 border-white h-[450px] flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 uppercase mb-8">Defect Pareto</h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={productionAnalytics.paretoData}>
                        <XAxis dataKey="name" hide /><YAxis yAxisId="left" hide /><YAxis yAxisId="right" orientation="right" hide /><Tooltip />
                        <Bar yAxisId="left" dataKey="count" fill="#f43f5e" radius={[10, 10, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#f59e0b" strokeWidth={5} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               {/* Vendor Chart */}
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-4 border-white h-[450px] flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 uppercase mb-8">Vendor Loading</h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productionAnalytics.vendorData}><XAxis dataKey="name" hide /><Tooltip /><Bar dataKey="qty" fill="#0ea5e9" radius={[10, 10, 0, 0]} /></BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               {/* Shift Chart */}
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-4 border-white h-[450px] flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 uppercase mb-8">Shift impact</h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={productionAnalytics.shiftData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                          {productionAnalytics.shiftData.map((entry, index) => <Cell key={`cell-${index}`} fill={SHIFT_COLORS[entry.name.slice(-1)] || COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               {/* Station Profile */}
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-4 border-white h-[450px] flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 uppercase mb-8">Station Profile</h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={productionAnalytics.stationData} outerRadius={110} dataKey="value" stroke="#fff" strokeWidth={4}>{productionAnalytics.stationData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          /* OBSERVATION DASHBOARD - MONTHLY VIEW ENHANCEMENTS */
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl flex items-center justify-between text-white border-b-12 border-slate-950">
              <div>
                 <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Observation Analysis</h2>
                 <p className="text-slate-400 font-black text-xs uppercase tracking-[0.4em] mt-3">{AREA_LABELS[context]} — Full {timeRange} View</p>
              </div>
              <div className="text-right">
                <span className="text-6xl font-black tracking-tighter">{observationAnalytics.total}</span>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Observations Logged</p>
              </div>
            </div>

            {/* Monthly Observation Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               {/* 1. Operator Repetition Analysis */}
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-4 border-white h-[500px] flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 uppercase flex items-center gap-4 mb-8">
                     <i className="fas fa-user-clock text-indigo-600"></i>
                     Operator Repetition Analysis
                  </h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={observationAnalytics.opRepData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={140} tick={{fontSize: 9, fontWeight: 900}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[0, 10, 10, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               {/* 2. Material Wise Observation Chart */}
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-4 border-white h-[500px] flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 uppercase flex items-center gap-4 mb-8">
                     <i className="fas fa-boxes-packing text-emerald-600"></i>
                     Material/Vendor Impact
                  </h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={observationAnalytics.matObsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" radius={[10, 10, 0, 0]} barSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               {/* 3. Line Leader Wise Analysis */}
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-4 border-white h-[500px] flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 uppercase flex items-center gap-4 mb-8">
                     <i className="fas fa-user-tie text-blue-600"></i>
                     Line Leader Frequency
                  </h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={observationAnalytics.leaderObsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[10, 10, 0, 0]} barSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               {/* 4. Date Wise Observation Trend */}
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-4 border-white h-[500px] flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 uppercase flex items-center gap-4 mb-8">
                     <i className="fas fa-chart-area text-rose-600"></i>
                     Observation Velocity Trend
                  </h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={observationAnalytics.trendObsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" hide />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={6} dot={{r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 3}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>

            {/* Observation Registry Table */}
            <div className="bg-white rounded-[3.5rem] shadow-2xl border-4 border-slate-100 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-[0.2em] sticky top-0 z-10">
                     <tr>
                       <th className="px-8 py-8">Date / Shift</th>
                       <th className="px-8 py-8">Area / Bench</th>
                       <th className="px-8 py-8">Operator / Leader</th>
                       <th className="px-8 py-8">Category / Problem</th>
                       <th className="px-8 py-8 text-center">Qty</th>
                       <th className="px-8 py-8 text-center">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y-4 divide-slate-100">
                     {observationAnalytics.records.length === 0 ? (
                       <tr><td colSpan={6} className="px-8 py-32 text-center font-black text-slate-300 uppercase tracking-widest">No Discoveries Recorded</td></tr>
                     ) : (
                       observationAnalytics.records.map((obs) => (
                         <tr key={obs.id} className="hover:bg-indigo-50/50 transition-colors">
                           <td className="px-8 py-8 border-r border-slate-50">
                             <div className="font-black text-slate-900">{obs.date}</div>
                             <div className="text-[10px] text-indigo-600 font-black uppercase">SHIFT {obs.shift}</div>
                           </td>
                           <td className="px-8 py-8 border-r border-slate-50">
                             <div className="font-black text-slate-800">{AREA_LABELS[obs.moduleType] || obs.moduleType}</div>
                             <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">BENCH: {obs.station}</div>
                           </td>
                           <td className="px-8 py-8 border-r border-slate-50">
                             <div className="font-black text-slate-900 uppercase text-xs">{obs.operatorName || '---'}</div>
                             <div className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">Leader: {obs.lineLeader || 'Unassigned'}</div>
                           </td>
                           <td className="px-8 py-8 border-r border-slate-50">
                             <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase mb-2 tracking-widest">{obs.observationCategory}</span>
                             <p className="font-black text-slate-900 text-lg uppercase leading-tight">{obs.issueDescription}</p>
                           </td>
                           <td className="px-8 py-8 text-center border-r border-slate-50">
                             <div className="text-4xl font-black text-slate-900 tracking-tighter">{obs.quantityAffected || 0}</div>
                           </td>
                           <td className="px-8 py-8 text-center">
                             <span className={`px-5 py-2.5 rounded-xl text-[10px] font-black border-4 flex items-center justify-center gap-3 ${obs.status === 'Closed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                               <span className={`w-2 h-2 rounded-full ${obs.status === 'Closed' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                               {obs.status.toUpperCase()}
                             </span>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;
