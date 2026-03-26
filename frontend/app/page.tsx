'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle, XCircle, AlertCircle, History, Sparkles, Image as ImageIcon, ChevronRight, Download } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  
  // Tab State & DB History
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/history");
      const data = await res.json();
      setHistoryData(data.history || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const handleTabSwitch = (tab: 'upload' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      fetchHistory();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);
    setBatchResults([]);

    const formData = new FormData();
    formData.append("file", file);

    const isZip = file.name.toLowerCase().endsWith('.zip');
    const endpoint = isZip 
      ? "http://localhost:8000/api/evaluate/batch" 
      : "http://localhost:8000/api/evaluate";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data = await res.json();
      
      if (isZip) {
        setBatchResults(data.batch_results || []);
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Error evaluating asset:", error);
      alert("Failed to evaluate the asset. Is your Python server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#b7da9b] selection:text-[#242c65]">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#75bee9] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-[#b7da9b] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-[#242c65]/5 rounded-2xl mb-2">
            <Sparkles className="w-8 h-8 text-[#242c65]" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#242c65] to-[#0061af]">
            ZONNIC Compliance Engine
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium">
            Enterprise marketing verification powered by Vision LLMs and strictly enforced brand guidelines.
          </p>
        </div>

        {/* Premium Segmented Control (Tabs) */}
        <div className="flex justify-center">
          <div className="bg-slate-200/60 backdrop-blur-md p-1.5 rounded-full inline-flex space-x-1 shadow-inner">
            <button 
              onClick={() => handleTabSwitch('upload')}
              className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === 'upload' 
                  ? 'bg-white text-[#242c65] shadow-sm scale-100' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200 scale-95'
              }`}
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              New Evaluation
            </button>
            <button 
              onClick={() => handleTabSwitch('history')}
              className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === 'history' 
                  ? 'bg-white text-[#242c65] shadow-sm scale-100' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200 scale-95'
              }`}
            >
              <History className="w-4 h-4 mr-2" />
              Audit Log
            </button>
          </div>
        </div>

        {/* ========================================= */}
        {/* VIEW 1: UPLOAD DASHBOARD                  */}
        {/* ========================================= */}
        {activeTab === 'upload' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Custom Dropzone */}
            <div className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-xl">
              <form onSubmit={handleUpload} className="space-y-8">
                
                <div 
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
                    file ? 'border-[#007e47] bg-[#007e47]/5' : 'border-slate-300 hover:border-[#242c65] hover:bg-slate-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept="image/*,.zip"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-white rounded-full shadow-sm">
                        <FileType className="w-10 h-10 text-[#007e47]" />
                      </div>
                      <p className="text-xl font-bold text-[#242c65]">{file.name}</p>
                      <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to evaluate</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-white rounded-full shadow-sm text-slate-400">
                        <UploadCloud className="w-10 h-10" />
                      </div>
                      <p className="text-xl font-bold text-slate-700">Drag & drop your asset here</p>
                      <p className="text-sm text-slate-500">Supports PNG, JPG, WEBP, or a .ZIP folder for batch processing</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={!file || loading}
                    className={`group relative flex items-center justify-center w-full max-w-md py-4 px-8 rounded-2xl text-base font-bold text-white overflow-hidden transition-all shadow-lg ${
                      !file || loading 
                        ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                        : 'bg-[#242c65] hover:bg-[#1a204d] hover:-translate-y-0.5 hover:shadow-xl'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Running Verification...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Initiate Compliance Check
                        <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* SINGLE IMAGE RESULT DASHBOARD */}
            {result && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                    <h3 className="text-xl font-bold text-[#242c65]">Evaluation Report</h3>
                  </div>
                  
                  <div className={`flex items-center px-5 py-2 rounded-full font-extrabold tracking-wide text-sm shadow-sm ${
                    result.status === 'PASS' ? 'bg-[#007e47]/10 text-[#007e47] border border-[#007e47]/20' : 
                    result.status === 'WARNING' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                    'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                    {result.status === 'PASS' && <CheckCircle className="w-4 h-4 mr-2" />}
                    {result.status === 'WARNING' && <AlertCircle className="w-4 h-4 mr-2" />}
                    {result.status === 'FAIL' && <XCircle className="w-4 h-4 mr-2" />}
                    {result.status}
                  </div>
                </div>
                
                <div className="p-8 grid grid-cols-1 lg:grid-cols-5 gap-10">
                  {/* Image Display */}
                  <div className="lg:col-span-2 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Processed Asset</p>
                    <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center p-2">
                      {result.annotated_image ? (
                        <img 
                          src={`data:image/jpeg;base64,${result.annotated_image}`} 
                          alt="Analyzed Asset" 
                          className="w-full h-auto rounded-xl shadow-sm"
                        />
                      ) : (
                        <div className="p-12 text-slate-400 text-sm font-medium">Preview Unavailable</div>
                      )}
                    </div>
                  </div>

                  {/* Feedback Data */}
                  <div className="lg:col-span-3 space-y-8">
                    {/* Issues */}
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Detected Issues</p>
                      <ul className="space-y-2">
                        {result.issues?.length > 0 && result.issues[0] !== 'None' ? (
                          result.issues.map((issue: string, idx: number) => (
                            <li key={idx} className="flex items-start text-sm text-slate-700 font-medium">
                              <span className="text-rose-500 mr-2 mt-0.5">•</span> {issue}
                            </li>
                          ))
                        ) : (
                          <li className="flex items-center text-sm text-[#007e47] font-bold">
                            <CheckCircle className="w-4 h-4 mr-2" /> No brand violations detected.
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Rules */}
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Guidelines Cited</p>
                      <ul className="space-y-2">
                        {result.rules_violated?.length > 0 && result.rules_violated[0] !== 'None' ? (
                          result.rules_violated.map((rule: string, idx: number) => (
                            <li key={idx} className="flex items-start text-sm text-slate-600">
                              <span className="text-slate-400 mr-2 mt-0.5">→</span> {rule}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-slate-500 italic">Fully compliant with ZONNIC master PDF.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BATCH PROCESSING TABLE */}
            {batchResults.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#242c65]">Batch Results <span className="text-slate-400 font-medium ml-2">({batchResults.length} files)</span></h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-white border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Asset Name</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchResults.map((res, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-[#242c65]">
                            {res.filename}
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              res.status === 'PASS' ? 'bg-[#007e47]/10 text-[#007e47]' : 
                              res.status === 'WARNING' ? 'bg-amber-100 text-amber-700' : 
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                            {res.issues?.length > 0 && res.issues[0] !== 'None' ? (
                              <span className="text-slate-700">{res.issues[0]}</span>
                            ) : (
                              <span className="text-slate-400">Clean</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* VIEW 2: SQLITE HISTORY DATABASE           */}
        {/* ========================================= */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-8 py-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#242c65] mb-2">Immutable Audit Log</h2>
                <p className="text-slate-500 text-sm font-medium">Telemetry data securely persisted via local SQLite protocol.</p>
              </div>
              
              <button
                onClick={() => window.open("http://localhost:8000/api/history/export", "_blank")}
                className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#242c65] shadow-sm hover:bg-slate-50 hover:shadow transition-all"
              >
                <Download className="w-4 h-4 mr-2 text-[#007e47]" />
                Export CSV Report
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">File Assessed</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Verdict</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">System Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap text-xs font-mono text-slate-500">{row.timestamp}</td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-[#242c65]">{row.filename}</td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          row.status === 'PASS' ? 'bg-[#007e47]/10 text-[#007e47]' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-600 font-medium truncate max-w-xs">
                        {row.issues && row.issues.length > 0 && row.issues[0] !== 'None' ? row.issues.join(', ') : 'No violations recorded.'}
                      </td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        No historical data available. Run an evaluation to populate the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}