
import React, { useState, useMemo } from 'react';
import { dbService } from '../services/dbService';
import ExcelJS from 'exceljs';
import { RFCodingRecord, MainPCBRecord, OperatorAssignmentRecord, ProcessObservationRecord } from '../types';

const AREA_LABELS: Record<string, string> = {
  'RF_CODING': 'RF Coding Area',
  'PCB_1PH': 'Main PCB 1 Phase',
  'PCB_3PH': 'Main PCB 3 Phase',
  'LTCT': 'LTCT Coding Area'
};

const Reports: React.FC = () => {
  const allRecords = useMemo(() => dbService.getRecords(), []);
  const allObservations = useMemo(() => dbService.getObservations(), []);
  
  // Document Data - Accumulated history
  const allRFCodingSheets = useMemo(() => dbService.getRFCodingSheets(), []);
  const allProcessSheets = useMemo(() => dbService.getProcessSheets(), []);
  const allPatrollingSheets = useMemo(() => dbService.getPatrollingSheets(), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(rec => {
      const pcbNum = rec.pcbNumber || '';
      const matchesSearch = 
        rec.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.firmware && rec.firmware.toLowerCase().includes(searchTerm.toLowerCase())) ||
        pcbNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.operatorName && rec.operatorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.operatorId && rec.operatorId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesModule = filterModule === 'all' || rec.moduleType === filterModule;
      const matchesDuplicateFilter = !showDuplicatesOnly || rec.isDuplicateConfirmed;
      
      return matchesSearch && matchesModule && matchesDuplicateFilter;
    });
  }, [allRecords, searchTerm, filterModule, showDuplicatesOnly]);

  const exportToStructuredExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Kimbal Quality MIS';
      
      const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };
      const blueFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

      // 1. MASTER NG ENTRY CONSOLIDATED SHEET (All dates appended here - Rule 6)
      const ngSheet = workbook.addWorksheet('NG_Master_Registry');
      ngSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Shift', key: 'shift', width: 8 },
        { header: 'Area', key: 'moduleType', width: 15 },
        { header: 'Station', key: 'station', width: 15 },
        { header: 'PCB ID', key: 'pcbNumber', width: 20 },
        { header: 'Vendor', key: 'vendor', width: 15 },
        { header: 'Operator', key: 'operatorName', width: 20 },
        { header: 'Qty', key: 'quantity', width: 8 },
        { header: 'User ID', key: 'submitterEmployeeId', width: 15 }
      ];
      ngSheet.getRow(1).font = headerFont;
      ngSheet.getRow(1).fill = blueFill;
      allRecords.forEach(r => ngSheet.addRow({ ...r, station: r.stationName || r.station }));

      // 2. OBSERVATIONS MASTER SHEET
      const obsSheet = workbook.addWorksheet('Observations_Master_Registry');
      obsSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Shift', key: 'shift', width: 8 },
        { header: 'Area', key: 'area', width: 20 },
        { header: 'Category', key: 'observationCategory', width: 20 },
        { header: 'Problem', key: 'issueDescription', width: 40 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'User ID', key: 'observerEmployeeId', width: 15 }
      ];
      obsSheet.getRow(1).font = headerFont;
      obsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      allObservations.forEach(obs => obsSheet.addRow({ ...obs, area: AREA_LABELS[obs.moduleType] || obs.moduleType }));

      // 3. SEPARATE MASTER SHEETS BY DOCUMENT TYPE (Rule 6 & 7)

      // REPORT A: RF Coding Area Report
      const rfCodingSheet = workbook.addWorksheet('RF Coding Area Report');
      rfCodingSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Shift', key: 'shift', width: 8 },
        { header: 'Line No', key: 'lineNo', width: 10 },
        { header: 'Leader', key: 'lineLeader', width: 20 },
        { header: 'User ID', key: 'userId', width: 15 },
        { header: 'Checkpoint', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Remarks', key: 'remarks', width: 25 }
      ];
      rfCodingSheet.getRow(1).fill = blueFill;
      rfCodingSheet.getRow(1).font = headerFont;
      allRFCodingSheets.forEach(sheet => {
        sheet.checkpoints.forEach(cp => rfCodingSheet.addRow({ ...sheet, ...cp }));
      });

      // REPORT B: Process Check Sheet – Coding Area Report
      const procSheet = workbook.addWorksheet('Process Check Sheet Report');
      procSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Shift', key: 'shift', width: 8 },
        { header: 'Line No', key: 'lineNo', width: 10 },
        { header: 'Leader', key: 'lineLeader', width: 20 },
        { header: 'User ID', key: 'userId', width: 15 },
        { header: 'Checkpoint', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Remarks', key: 'remarks', width: 25 }
      ];
      procSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
      procSheet.getRow(1).font = headerFont;
      allProcessSheets.forEach(sheet => {
        sheet.checkpoints.forEach(cp => procSheet.addRow({ ...sheet, ...cp }));
      });

      // REPORT C: Patrolling Inspection Report
      const patrollingSheet = workbook.addWorksheet('Patrolling Inspection Report');
      patrollingSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Shift', key: 'shift', width: 8 },
        { header: 'Time Slot', key: 'timeSlot', width: 25 },
        { header: 'Line No', key: 'lineNo', width: 10 },
        { header: 'User ID', key: 'userId', width: 15 },
        { header: 'Checkpoint', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Remarks', key: 'remarks', width: 25 }
      ];
      patrollingSheet.getRow(1).fill = blueFill;
      patrollingSheet.getRow(1).font = headerFont;
      allPatrollingSheets.forEach(sheet => {
        sheet.checkpoints.forEach(cp => patrollingSheet.addRow({ ...sheet, ...cp }));
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kimbal_Industrial_Master_MIS_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
    } catch (error) {
      alert('Master Export Error - Could not consolidate historical registry.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-10 p-6 md:p-10">
      <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border-4 border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Master Quality Registry</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Factory persistent data vault</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <button 
              onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)} 
              className={`px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-4 ${showDuplicatesOnly ? 'bg-orange-600 border-orange-600 text-white shadow-2xl scale-105' : 'bg-orange-50 border-orange-100 text-orange-600 hover:border-orange-300'}`}
            >
              <i className="fas fa-copy mr-2"></i> {showDuplicatesOnly ? 'DUPLICATES ACTIVE' : 'FILTER DUPLICATES'}
            </button>
            <button 
              onClick={exportToStructuredExcel} 
              disabled={isExporting}
              className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-2xl flex items-center gap-3 disabled:opacity-50 border-b-8 border-emerald-800"
            >
              {isExporting ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-file-excel"></i>}
              MASTER DATA REGISTRY
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[3rem] border-4 border-slate-100 shadow-inner">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white uppercase text-xs font-black tracking-widest">
              <tr>
                <th className="px-8 py-8">Traceability</th>
                <th className="px-8 py-8">Area</th>
                <th className="px-8 py-8">Identification</th>
                <th className="px-8 py-8 text-center">Qty</th>
                <th className="px-8 py-8">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-slate-50">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center font-black text-slate-300 uppercase">No master data records found</td></tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className={`hover:bg-blue-50/50 transition-colors ${rec.isDuplicateConfirmed ? 'bg-orange-50/50' : 'bg-white'}`}>
                    <td className="px-8 py-8 border-r border-slate-50">
                      <div className="text-slate-900 text-base font-black uppercase">{rec.date}</div>
                      <div className="text-[11px] text-blue-600 font-black uppercase mt-1">SHIFT {rec.shift}</div>
                    </td>
                    <td className="px-8 py-8 border-r border-slate-50">
                      <span className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-blue-50 border-2 border-blue-100 text-blue-700">
                        {rec.moduleType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-8 border-r border-slate-50 font-black">
                      <div className="text-base uppercase text-slate-800">{rec.pcbNumber || 'ANONYMOUS'}</div>
                      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">ST: {rec.stationName || rec.station}</div>
                    </td>
                    <td className="px-8 py-8 text-center border-r border-slate-50 font-black text-4xl text-blue-800">
                      {rec.quantity}
                    </td>
                    <td className="px-8 py-8 font-black text-xs text-slate-500 uppercase tracking-tight">
                      {'issueDescription' in rec ? rec.issueDescription : 'issueCategory' in rec ? rec.issueCategory : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
