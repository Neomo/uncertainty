/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DictInstrument, DictProject, DictUnit } from '../types';
import { 
  Plus, 
  Trash2, 
  Library, 
  Wrench, 
  FileCode2, 
  Weight, 
  Search, 
  Edit3, 
  Save, 
  X, 
  Check, 
  ChevronRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DictionaryConfigProps {
  instruments: DictInstrument[];
  projects: DictProject[];
  units: DictUnit[];
  onAddInstrument: (inst: Omit<DictInstrument, 'id'>) => void;
  onDeleteInstrument: (id: string) => void;
  onUpdateInstrument: (id: string, name: string) => void;
  onAddDictProject: (proj: Omit<DictProject, 'id'>) => void;
  onDeleteDictProject: (id: string) => void;
  onUpdateDictProject: (id: string, name: string) => void;
  onAddDictUnit: (unit: Omit<DictUnit, 'id'>) => void;
  onDeleteDictUnit: (id: string) => void;
  onUpdateDictUnit: (id: string, description: string) => void;
}

type TabType = 'instruments' | 'projects' | 'units';

export default function DictionaryConfig({
  instruments,
  projects,
  units,
  onAddInstrument,
  onDeleteInstrument,
  onUpdateInstrument,
  onAddDictProject,
  onDeleteDictProject,
  onUpdateDictProject,
  onAddDictUnit,
  onDeleteDictUnit,
  onUpdateDictUnit,
}: DictionaryConfigProps) {
  // Main Active Tab state
  const [activeTab, setActiveTab] = useState<TabType>('instruments');

  // Success message feedback
  const [successMsg, setSuccessMsg] = useState('');
  const triggerSuccessMsg = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ==========================================
  // INSTRUMENTS STATE & LOGIC
  // ==========================================
  const [instCode, setInstCode] = useState('');
  const [instName, setInstName] = useState('');
  const [instErr, setInstErr] = useState('');
  const [instSearch, setInstSearch] = useState('');
  
  // Single-item inline edit states
  const [editingInstId, setEditingInstId] = useState<string | null>(null);
  const [editingInstValue, setEditingInstValue] = useState('');
  
  // Batch edit states
  const [isBatchEditingInsts, setIsBatchEditingInsts] = useState(false);
  const [batchInsts, setBatchInsts] = useState<DictInstrument[]>([]);

  // Toggle batch edit mode
  const handleToggleBatchInsts = () => {
    if (isBatchEditingInsts) {
      // Cancel
      setIsBatchEditingInsts(false);
    } else {
      // Start - copy current instruments state
      setBatchInsts(JSON.parse(JSON.stringify(instruments)));
      setIsBatchEditingInsts(true);
      setEditingInstId(null);
    }
  };

  // Update a single row's value inside the batch edit array
  const handleBatchInstChange = (id: string, val: string) => {
    setBatchInsts(prev => prev.map(item => item.id === id ? { ...item, name: val } : item));
  };

  // Save all batch modified instruments
  const handleSaveBatchInsts = () => {
    let count = 0;
    batchInsts.forEach((bi) => {
      const original = instruments.find((i) => i.id === bi.id);
      if (original && original.name.trim() !== bi.name.trim()) {
        onUpdateInstrument(bi.id, bi.name.trim());
        count++;
      }
    });
    setIsBatchEditingInsts(false);
    triggerSuccessMsg(count > 0 ? `成功批量更新了 ${count} 台检验仪器的详情信息！` : '详情没有变更');
  };

  // Save single inline instrument edit
  const handleSaveSingleInst = (id: string) => {
    if (editingInstValue.trim()) {
      onUpdateInstrument(id, editingInstValue.trim());
      triggerSuccessMsg('仪器详情已更新！');
    }
    setEditingInstId(null);
  };

  const handleAddInstSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInstErr('');
    const code = instCode.trim();
    const name = instName.trim();

    if (!code || !name) {
      setInstErr('仪器代码与仪器详情均不能为空');
      return;
    }

    if (instruments.some((i) => i.code.toLowerCase() === code.toLowerCase())) {
      setInstErr(`仪器代码 "${code}" 已存在于库中`);
      return;
    }

    onAddInstrument({ code, name });
    setInstCode('');
    setInstName('');
    triggerSuccessMsg(`成功登记新仪器: ${code}`);
  };

  // Filtered Instruments List
  const filteredInstruments = useMemo(() => {
    const list = isBatchEditingInsts ? batchInsts : instruments;
    return list.filter(i => 
      i.code.toLowerCase().includes(instSearch.toLowerCase()) || 
      i.name.toLowerCase().includes(instSearch.toLowerCase())
    );
  }, [instruments, batchInsts, isBatchEditingInsts, instSearch]);


  // ==========================================
  // PROJECTS STATE & LOGIC
  // ==========================================
  const [projCode, setProjCode] = useState('');
  const [projName, setProjName] = useState('');
  const [projErr, setProjErr] = useState('');
  const [projSearch, setProjSearch] = useState('');

  // Single-item inline edit states
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [editingProjValue, setEditingProjValue] = useState('');

  // Batch edit states
  const [isBatchEditingProjs, setIsBatchEditingProjs] = useState(false);
  const [batchProjs, setBatchProjs] = useState<DictProject[]>([]);

  const handleToggleBatchProjs = () => {
    if (isBatchEditingProjs) {
      setIsBatchEditingProjs(false);
    } else {
      setBatchProjs(JSON.parse(JSON.stringify(projects)));
      setIsBatchEditingProjs(true);
      setEditingProjId(null);
    }
  };

  const handleBatchProjChange = (id: string, val: string) => {
    setBatchProjs(prev => prev.map(item => item.id === id ? { ...item, name: val } : item));
  };

  const handleSaveBatchProjs = () => {
    let count = 0;
    batchProjs.forEach((bp) => {
      const original = projects.find((p) => p.id === bp.id);
      if (original && original.name.trim() !== bp.name.trim()) {
        onUpdateDictProject(bp.id, bp.name.trim());
        count++;
      }
    });
    setIsBatchEditingProjs(false);
    triggerSuccessMsg(count > 0 ? `成功批量更新了 ${count} 个项目的中文名称！` : '项目名称没有变更');
  };

  const handleSaveSingleProj = (id: string) => {
    if (editingProjValue.trim()) {
      onUpdateDictProject(id, editingProjValue.trim());
      triggerSuccessMsg('项目名称已更新！');
    }
    setEditingProjId(null);
  };

  const handleAddProjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProjErr('');
    const code = projCode.trim();
    const name = projName.trim();

    if (!code || !name) {
      setProjErr('指标代码与指标中文名均不能为空');
      return;
    }

    if (projects.some((p) => p.code.toLowerCase() === code.toLowerCase())) {
      setProjErr(`指标代码 "${code}" 已存在`);
      return;
    }

    onAddDictProject({ code, name });
    setProjCode('');
    setProjName('');
    triggerSuccessMsg(`成功添加项目词条: ${code}`);
  };

  // Filtered Projects List
  const filteredProjects = useMemo(() => {
    const list = isBatchEditingProjs ? batchProjs : projects;
    return list.filter(p => 
      p.code.toLowerCase().includes(projSearch.toLowerCase()) || 
      p.name.toLowerCase().includes(projSearch.toLowerCase())
    );
  }, [projects, batchProjs, isBatchEditingProjs, projSearch]);


  // ==========================================
  // UNITS STATE & LOGIC
  // ==========================================
  const [unitCode, setUnitCode] = useState('');
  const [unitDesc, setUnitDesc] = useState('');
  const [unitErr, setUnitErr] = useState('');
  const [unitSearch, setUnitSearch] = useState('');

  // Single-item inline edit states
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitValue, setEditingUnitValue] = useState('');

  // Batch edit states
  const [isBatchEditingUnits, setIsBatchEditingUnits] = useState(false);
  const [batchUnits, setBatchUnits] = useState<DictUnit[]>([]);

  const handleToggleBatchUnits = () => {
    if (isBatchEditingUnits) {
      setIsBatchEditingUnits(false);
    } else {
      setBatchUnits(JSON.parse(JSON.stringify(units)));
      setIsBatchEditingUnits(true);
      setEditingUnitId(null);
    }
  };

  const handleBatchUnitChange = (id: string, val: string) => {
    setBatchUnits(prev => prev.map(item => item.id === id ? { ...item, description: val } : item));
  };

  const handleSaveBatchUnits = () => {
    let count = 0;
    batchUnits.forEach((bu) => {
      const original = units.find((u) => u.id === bu.id);
      if (original && (original.description || '') !== bu.description) {
        onUpdateDictUnit(bu.id, bu.description || '');
        count++;
      }
    });
    setIsBatchEditingUnits(false);
    triggerSuccessMsg(count > 0 ? `成功批量更新了 ${count} 个检测单位的详细说明！` : '单位说明没有变更');
  };

  const handleSaveSingleUnit = (id: string) => {
    onUpdateDictUnit(id, editingUnitValue.trim());
    triggerSuccessMsg('单位说明已更新！');
    setEditingUnitId(null);
  };

  const handleAddUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUnitErr('');
    const code = unitCode.trim();
    const description = unitDesc.trim() || undefined;

    if (!code) {
      setUnitErr('单位代码不能为空');
      return;
    }

    if (units.some((u) => u.code.toLowerCase() === code.toLowerCase())) {
      setUnitErr(`检测单位 "${code}" 已存在`);
      return;
    }

    onAddDictUnit({ code, description });
    setUnitCode('');
    setUnitDesc('');
    triggerSuccessMsg(`成功添加检测单位: ${code}`);
  };

  // Filtered Units List
  const filteredUnits = useMemo(() => {
    const list = isBatchEditingUnits ? batchUnits : units;
    return list.filter(u => 
      u.code.toLowerCase().includes(unitSearch.toLowerCase()) || 
      (u.description || '').toLowerCase().includes(unitSearch.toLowerCase())
    );
  }, [units, batchUnits, isBatchEditingUnits, unitSearch]);


  // Textarea auto height helper
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div id="dictionary-config-container" className="space-y-6">
      
      {/* 1. Header Information Panel */}
      <div className="bg-white p-6 rounded-sm shadow-xs border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Library className="h-5 w-5 text-[#5D6D5F]" />
            〇 基础数据字典管理
          </h2>
          <p className="text-xs text-slate-500 font-serif italic mt-1 leading-relaxed">
            在此精细管理医学实验室基础字典库，设置规范的检测仪器详情、分析项目名称及浓度单位。一处修改，全局联动同步。
          </p>
        </div>

        {/* Global Feedback Banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] px-3.5 py-2 rounded-sm flex items-center gap-2 shadow-3xs"
            >
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Primary Tabs Control */}
      <div className="flex border-b border-black/10 bg-white px-1 pt-2 rounded-t-sm shadow-3xs">
        <button
          onClick={() => { setActiveTab('instruments'); setInstErr(''); }}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'instruments'
              ? 'border-[#5D6D5F] text-[#5D6D5F] bg-[#FAF9F6]/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
          }`}
        >
          <Wrench className="h-4 w-4 shrink-0" />
          检测仪器数据库 ({instruments.length})
        </button>
        <button
          onClick={() => { setActiveTab('projects'); setProjErr(''); }}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'projects'
              ? 'border-[#5D6D5F] text-[#5D6D5F] bg-[#FAF9F6]/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
          }`}
        >
          <FileCode2 className="h-4 w-4 shrink-0" />
          检测项目字典表 ({projects.length})
        </button>
        <button
          onClick={() => { setActiveTab('units'); setUnitErr(''); }}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'units'
              ? 'border-[#5D6D5F] text-[#5D6D5F] bg-[#FAF9F6]/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
          }`}
        >
          <Weight className="h-4 w-4 shrink-0" />
          检测单位常数库 ({units.length})
        </button>
      </div>

      {/* 3. Tab Contents Layout */}
      <div className="bg-white p-6 rounded-b-sm border-x border-b border-black/5 shadow-2xs">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: INSTRUMENTS */}
          {activeTab === 'instruments' && (
            <motion.div
              key="instruments-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: 1/3 Adding Area */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5">
                  <div className="bg-[#5D6D5F]/10 p-1 rounded-sm">
                    <Plus className="h-4 w-4 text-[#5D6D5F]" />
                  </div>
                  <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-800">
                    登记新仪器资料
                  </h3>
                </div>

                {instErr && (
                  <div className="p-3 border border-rose-100 bg-rose-50 text-rose-800 text-[11px] rounded-sm font-sans italic animate-fade-in">
                    ⚠️ {instErr}
                  </div>
                )}

                <form onSubmit={handleAddInstSubmit} className="space-y-4 bg-[#FAF9F6] p-5 border border-black/5 rounded-sm shadow-3xs">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">
                      仪器代码 (唯一标识) *
                    </label>
                    <input
                      type="text"
                      placeholder="例如: Cobas c702, Architect i2000"
                      value={instCode}
                      onChange={(e) => setInstCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-black/15 text-xs text-slate-800 font-mono focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">
                      仪器详情说明 (支持多行/自适应高度) *
                    </label>
                    <textarea
                      placeholder="例如: 罗氏 Cobas c702 全自动生化分析仪&#10;主要配置：比色测定部分、原装试剂通道等"
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      onInput={handleTextareaInput}
                      rows={4}
                      className="w-full px-3 py-2 bg-white border border-black/15 text-xs text-slate-800 focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F] resize-y min-h-[90px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-xs uppercase tracking-wider rounded-sm transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <Plus className="h-4 w-4" />
                    登记检测仪器
                  </button>
                </form>

                <div className="bg-slate-50 p-4 border border-black/5 rounded-sm">
                  <span className="font-semibold text-slate-700 text-[11px] block mb-1">💡 小提示:</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-serif">
                    已添加仪器的「仪器详情」在右侧列表中双击可以直接内联修改，修改完毕后全站自动同步。
                  </p>
                </div>
              </div>

              {/* Right Column: 2/3 List Area */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Search & Batch Tools Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF9F6] p-3 border border-black/5 rounded-sm">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索仪器代码或详情..."
                      value={instSearch}
                      onChange={(e) => setInstSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-black/10 rounded-sm text-xs focus:outline-hidden focus:border-[#5D6D5F] focus:ring-1 focus:ring-[#5D6D5F]"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {isBatchEditingInsts ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveBatchInsts}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5D6D5F] text-white hover:bg-[#4b5a4d] text-[11px] font-bold rounded-sm shadow-xs cursor-pointer"
                        >
                          <Save className="h-3 w-3" />
                          保存批量修改
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleBatchInsts}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-sm cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleToggleBatchInsts}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-black/10 hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded-sm cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3 text-[#5D6D5F]" />
                        启用批量修改
                      </button>
                    )}
                  </div>
                </div>

                {/* Instruments Table */}
                <div className="border border-black/5 rounded-sm overflow-hidden shadow-3xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-black/5 text-[10px] font-bold uppercase tracking-wider text-slate-600 select-none">
                        <th className="py-3 px-4 w-1/4">仪器代码</th>
                        <th className="py-3 px-4 w-7/12">仪器详情 (双击文本或按修改键编辑)</th>
                        <th className="py-3 px-4 w-2/12 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] text-xs font-sans">
                      {filteredInstruments.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-12 text-center text-slate-400 italic font-serif">
                            没有检索到对应的检验仪器
                          </td>
                        </tr>
                      ) : (
                        filteredInstruments.map((i) => {
                          const isSingleEditing = editingInstId === i.id;
                          
                          // Find original name to highlight dirty batch edits
                          const orig = instruments.find(origI => origI.id === i.id);
                          const isModified = isBatchEditingInsts && orig && orig.name !== i.name;

                          return (
                            <tr 
                              key={i.id} 
                              className={`hover:bg-[#FAF9F6]/40 transition-colors ${
                                isModified ? 'bg-amber-50/50' : ''
                              } ${isSingleEditing ? 'bg-slate-50/50' : ''}`}
                            >
                              {/* 1. Instrument Code */}
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                {i.code}
                              </td>

                              {/* 2. Instrument Name / Details */}
                              <td className="py-3 px-4">
                                {isBatchEditingInsts ? (
                                  <textarea
                                    value={i.name}
                                    onChange={(e) => handleBatchInstChange(i.id, e.target.value)}
                                    rows={1}
                                    onInput={handleTextareaInput}
                                    className="w-full px-2 py-1.5 border border-black/15 rounded-xs bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F] font-sans resize-y min-h-[36px]"
                                  />
                                ) : isSingleEditing ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <textarea
                                      value={editingInstValue}
                                      onChange={(e) => setEditingInstValue(e.target.value)}
                                      onInput={handleTextareaInput}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSaveSingleInst(i.id);
                                        }
                                        if (e.key === 'Escape') setEditingInstId(null);
                                      }}
                                      autoFocus
                                      rows={2}
                                      className="flex-1 px-2.5 py-1.5 border border-black/20 rounded text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F] font-sans resize-y"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSingleInst(i.id)}
                                      className="p-1.5 bg-[#5D6D5F] text-white rounded hover:bg-[#4b5a4d] shadow-3xs"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingInstId(null)}
                                      className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div 
                                    onDoubleClick={() => {
                                      setEditingInstId(i.id);
                                      setEditingInstValue(i.name);
                                    }}
                                    className="text-slate-700 cursor-pointer hover:bg-slate-50 rounded px-2 py-1.5 border border-transparent hover:border-black/5 break-words max-w-lg transition-all"
                                    title="双击直接快速编辑"
                                  >
                                    {i.name}
                                    {isModified && (
                                      <span className="ml-2 text-[9px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded-sm">
                                        已修改
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* 3. Actions */}
                              <td className="py-3 px-4 text-right">
                                {!isBatchEditingInsts && (
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!isSingleEditing && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingInstId(i.id);
                                          setEditingInstValue(i.name);
                                        }}
                                        className="p-1 px-2 hover:bg-slate-100 text-slate-600 rounded-sm border border-black/10 text-[10px] transition-all cursor-pointer"
                                      >
                                        修改
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`确认注销并删除仪器 "${i.code}" 吗？此操作不可逆。`)) {
                                          onDeleteInstrument(i.id);
                                          triggerSuccessMsg(`已成功注销仪器: ${i.code}`);
                                        }
                                      }}
                                      className="p-1 px-2 hover:bg-rose-50 text-rose-800 rounded-sm border border-rose-200 text-[10px] transition-all cursor-pointer"
                                      title="注销仪器"
                                    >
                                      删除
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {isBatchEditingInsts && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm flex items-center justify-between text-[11px] text-amber-850 animate-pulse">
                    <span>✍️ 您正在批量编辑仪器，修改完成后记得点击右上角「保存批量修改」保存内容！</span>
                    <button 
                      type="button"
                      onClick={handleSaveBatchInsts}
                      className="px-2.5 py-1 bg-amber-700 text-white rounded hover:bg-amber-800 text-[10px] font-bold shrink-0 shadow-3xs"
                    >
                      点击保存
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}


          {/* TAB 2: PROJECTS */}
          {activeTab === 'projects' && (
            <motion.div
              key="projects-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: 1/3 Adding Area */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5">
                  <div className="bg-[#5D6D5F]/10 p-1 rounded-sm">
                    <Plus className="h-4 w-4 text-[#5D6D5F]" />
                  </div>
                  <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-800">
                    添加新指标词条
                  </h3>
                </div>

                {projErr && (
                  <div className="p-3 border border-rose-100 bg-rose-50 text-rose-800 text-[11px] rounded-sm font-sans italic animate-fade-in">
                    ⚠️ {projErr}
                  </div>
                )}

                <form onSubmit={handleAddProjSubmit} className="space-y-4 bg-[#FAF9F6] p-5 border border-black/5 rounded-sm shadow-3xs">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">
                      项目简码 (CODE) *
                    </label>
                    <input
                      type="text"
                      placeholder="例如: FT3, TSH, HbA1c"
                      value={projCode}
                      onChange={(e) => setProjCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-black/15 text-xs text-slate-800 font-mono focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">
                      检测项目中文名称 *
                    </label>
                    <textarea
                      placeholder="例如: 游离三碘甲状腺原氨酸"
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      onInput={handleTextareaInput}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-black/15 text-xs text-slate-800 focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F] resize-y min-h-[70px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-xs uppercase tracking-wider rounded-sm transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <Plus className="h-4 w-4" />
                    登记指标项目
                  </button>
                </form>

                <div className="bg-slate-50 p-4 border border-black/5 rounded-sm">
                  <span className="font-semibold text-slate-700 text-[11px] block mb-1">💡 全局级联动更新:</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-serif">
                    修改检测项目中文名称后，系统不仅会同步更新词典，还会<strong>联动修改</strong>所有项目配置页面的现有检测项目中文名称！
                  </p>
                </div>
              </div>

              {/* Right Column: 2/3 List Area */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Search & Batch Tools Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF9F6] p-3 border border-black/5 rounded-sm">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索指标代码或中文名称..."
                      value={projSearch}
                      onChange={(e) => setProjSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-black/10 rounded-sm text-xs focus:outline-hidden focus:border-[#5D6D5F] focus:ring-1 focus:ring-[#5D6D5F]"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {isBatchEditingProjs ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveBatchProjs}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5D6D5F] text-white hover:bg-[#4b5a4d] text-[11px] font-bold rounded-sm shadow-xs cursor-pointer"
                        >
                          <Save className="h-3 w-3" />
                          保存批量修改
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleBatchProjs}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-sm cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleToggleBatchProjs}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-black/10 hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded-sm cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3 text-[#5D6D5F]" />
                        启用批量修改
                      </button>
                    )}
                  </div>
                </div>

                {/* Projects Table */}
                <div className="border border-black/5 rounded-sm overflow-hidden shadow-3xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-black/5 text-[10px] font-bold uppercase tracking-wider text-slate-600 select-none">
                        <th className="py-3 px-4 w-1/4">指标简码 (CODE)</th>
                        <th className="py-3 px-4 w-7/12">检测项目中文名称 (双击文本直接编辑)</th>
                        <th className="py-3 px-4 w-2/12 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] text-xs font-sans">
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-12 text-center text-slate-400 italic font-serif">
                            没有检索到对应的检测指标
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map((p) => {
                          const isSingleEditing = editingProjId === p.id;
                          const orig = projects.find(origP => origP.id === p.id);
                          const isModified = isBatchEditingProjs && orig && orig.name !== p.name;

                          return (
                            <tr 
                              key={p.id} 
                              className={`hover:bg-[#FAF9F6]/40 transition-colors ${
                                isModified ? 'bg-amber-50/50' : ''
                              } ${isSingleEditing ? 'bg-slate-50/50' : ''}`}
                            >
                              {/* 1. Project Code */}
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                {p.code}
                              </td>

                              {/* 2. Project Name */}
                              <td className="py-3 px-4">
                                {isBatchEditingProjs ? (
                                  <textarea
                                    value={p.name}
                                    onChange={(e) => handleBatchProjChange(p.id, e.target.value)}
                                    rows={1}
                                    onInput={handleTextareaInput}
                                    className="w-full px-2 py-1.5 border border-black/15 rounded-xs bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F] font-sans resize-y min-h-[36px]"
                                  />
                                ) : isSingleEditing ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <textarea
                                      value={editingProjValue}
                                      onChange={(e) => setEditingProjValue(e.target.value)}
                                      onInput={handleTextareaInput}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSaveSingleProj(p.id);
                                        }
                                        if (e.key === 'Escape') setEditingProjId(null);
                                      }}
                                      autoFocus
                                      rows={1}
                                      className="flex-1 px-2.5 py-1.5 border border-black/20 rounded text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F] font-sans resize-y"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSingleProj(p.id)}
                                      className="p-1.5 bg-[#5D6D5F] text-white rounded hover:bg-[#4b5a4d] shadow-3xs"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingProjId(null)}
                                      className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div 
                                    onDoubleClick={() => {
                                      setEditingProjId(p.id);
                                      setEditingProjValue(p.name);
                                    }}
                                    className="text-slate-700 cursor-pointer hover:bg-slate-50 rounded px-2 py-1.5 border border-transparent hover:border-black/5 break-words max-w-lg transition-all"
                                    title="双击直接快速编辑"
                                  >
                                    {p.name}
                                    {isModified && (
                                      <span className="ml-2 text-[9px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded-sm">
                                        已修改
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* 3. Actions */}
                              <td className="py-3 px-4 text-right">
                                {!isBatchEditingProjs && (
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!isSingleEditing && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingProjId(p.id);
                                          setEditingProjValue(p.name);
                                        }}
                                        className="p-1 px-2 hover:bg-slate-100 text-slate-600 rounded-sm border border-black/10 text-[10px] transition-all cursor-pointer"
                                      >
                                        修改
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`确认删除检测项目 "${p.code}" 吗？这会清除词典词条。`)) {
                                          onDeleteDictProject(p.id);
                                          triggerSuccessMsg(`已成功删除指标词条: ${p.code}`);
                                        }
                                      }}
                                      className="p-1 px-2 hover:bg-rose-50 text-rose-800 rounded-sm border border-rose-200 text-[10px] transition-all cursor-pointer"
                                    >
                                      删除
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {isBatchEditingProjs && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm flex items-center justify-between text-[11px] text-amber-850 animate-pulse">
                    <span>✍️ 您正在批量编辑指标名称，修改完成后别忘了点击右上角「保存批量修改」保存内容！</span>
                    <button 
                      type="button"
                      onClick={handleSaveBatchProjs}
                      className="px-2.5 py-1 bg-amber-700 text-white rounded hover:bg-amber-800 text-[10px] font-bold shrink-0 shadow-3xs"
                    >
                      点击保存
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}


          {/* TAB 3: UNITS */}
          {activeTab === 'units' && (
            <motion.div
              key="units-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: 1/3 Adding Area */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5">
                  <div className="bg-[#5D6D5F]/10 p-1 rounded-sm">
                    <Plus className="h-4 w-4 text-[#5D6D5F]" />
                  </div>
                  <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-800">
                    登记新检测单位
                  </h3>
                </div>

                {unitErr && (
                  <div className="p-3 border border-rose-100 bg-rose-50 text-rose-800 text-[11px] rounded-sm font-sans italic animate-fade-in">
                    ⚠️ {unitErr}
                  </div>
                )}

                <form onSubmit={handleAddUnitSubmit} className="space-y-4 bg-[#FAF9F6] p-5 border border-black/5 rounded-sm shadow-3xs">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">
                      单位代码 *
                    </label>
                    <input
                      type="text"
                      placeholder="例如: pg/ml, ng/ml, mmol/L"
                      value={unitCode}
                      onChange={(e) => setUnitCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-black/15 text-xs text-slate-800 font-mono focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">
                      单位说明 (选填)
                    </label>
                    <textarea
                      placeholder="例如: 皮克/毫升 (pg/mL)"
                      value={unitDesc}
                      onChange={(e) => setUnitDesc(e.target.value)}
                      onInput={handleTextareaInput}
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-black/15 text-xs text-slate-800 focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F] resize-y min-h-[56px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-xs uppercase tracking-wider rounded-sm transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <Plus className="h-4 w-4" />
                    新增项目单位
                  </button>
                </form>

                <div className="bg-slate-50 p-4 border border-black/5 rounded-sm">
                  <span className="font-semibold text-slate-700 text-[11px] block mb-1">💡 小说明:</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-serif">
                    可以在右侧快速修改已经登记单位的「说明文字」。
                  </p>
                </div>
              </div>

              {/* Right Column: 2/3 List Area */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Search & Batch Tools Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF9F6] p-3 border border-black/5 rounded-sm">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索单位代码或说明..."
                      value={unitSearch}
                      onChange={(e) => setUnitSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-black/10 rounded-sm text-xs focus:outline-hidden focus:border-[#5D6D5F] focus:ring-1 focus:ring-[#5D6D5F]"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {isBatchEditingUnits ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveBatchUnits}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5D6D5F] text-white hover:bg-[#4b5a4d] text-[11px] font-bold rounded-sm shadow-xs cursor-pointer"
                        >
                          <Save className="h-3 w-3" />
                          保存批量修改
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleBatchUnits}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-sm cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleToggleBatchUnits}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-black/10 hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded-sm cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3 text-[#5D6D5F]" />
                        启用批量修改
                      </button>
                    )}
                  </div>
                </div>

                {/* Units Table */}
                <div className="border border-black/5 rounded-sm overflow-hidden shadow-3xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-black/5 text-[10px] font-bold uppercase tracking-wider text-slate-600 select-none">
                        <th className="py-3 px-4 w-1/4">单位代码</th>
                        <th className="py-3 px-4 w-7/12">单位说明文字 (双击直接修改)</th>
                        <th className="py-3 px-4 w-2/12 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] text-xs font-sans">
                      {filteredUnits.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-12 text-center text-slate-400 italic font-serif">
                            没有检索到对应的单位词条
                          </td>
                        </tr>
                      ) : (
                        filteredUnits.map((u) => {
                          const isSingleEditing = editingUnitId === u.id;
                          const orig = units.find(origU => origU.id === u.id);
                          const isModified = isBatchEditingUnits && orig && orig.description !== u.description;

                          return (
                            <tr 
                              key={u.id} 
                              className={`hover:bg-[#FAF9F6]/40 transition-colors ${
                                isModified ? 'bg-amber-50/50' : ''
                              } ${isSingleEditing ? 'bg-slate-50/50' : ''}`}
                            >
                              {/* 1. Unit Code */}
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                {u.code}
                              </td>

                              {/* 2. Unit Description */}
                              <td className="py-3 px-4">
                                {isBatchEditingUnits ? (
                                  <textarea
                                    value={u.description || ''}
                                    onChange={(e) => handleBatchUnitChange(u.id, e.target.value)}
                                    rows={1}
                                    onInput={handleTextareaInput}
                                    className="w-full px-2 py-1.5 border border-black/15 rounded-xs bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F] font-sans resize-y min-h-[36px]"
                                  />
                                ) : isSingleEditing ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <textarea
                                      value={editingUnitValue}
                                      onChange={(e) => setEditingUnitValue(e.target.value)}
                                      onInput={handleTextareaInput}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSaveSingleUnit(u.id);
                                        }
                                        if (e.key === 'Escape') setEditingUnitId(null);
                                      }}
                                      autoFocus
                                      rows={1}
                                      className="flex-1 px-2.5 py-1.5 border border-black/20 rounded text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-[#5D6D5F] font-sans resize-y"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSingleUnit(u.id)}
                                      className="p-1.5 bg-[#5D6D5F] text-white rounded hover:bg-[#4b5a4d] shadow-3xs"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingUnitId(null)}
                                      className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div 
                                    onDoubleClick={() => {
                                      setEditingUnitId(u.id);
                                      setEditingUnitValue(u.description || '');
                                    }}
                                    className="text-slate-700 cursor-pointer hover:bg-slate-50 rounded px-2 py-1.5 border border-transparent hover:border-black/5 break-words max-w-lg transition-all min-h-[28px]"
                                    title="双击直接快速编辑"
                                  >
                                    {u.description || <span className="text-slate-300 italic">未提供详细说明</span>}
                                    {isModified && (
                                      <span className="ml-2 text-[9px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded-sm">
                                        已修改
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* 3. Actions */}
                              <td className="py-3 px-4 text-right">
                                {!isBatchEditingUnits && (
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!isSingleEditing && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingUnitId(u.id);
                                          setEditingUnitValue(u.description || '');
                                        }}
                                        className="p-1 px-2 hover:bg-slate-100 text-slate-600 rounded-sm border border-black/10 text-[10px] transition-all cursor-pointer"
                                      >
                                        修改
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`确认注销检测单位 "${u.code}" 吗？这会清除词典库。`)) {
                                          onDeleteDictUnit(u.id);
                                          triggerSuccessMsg(`已成功注销单位: ${u.code}`);
                                        }
                                      }}
                                      className="p-1 px-2 hover:bg-rose-50 text-rose-800 rounded-sm border border-rose-200 text-[10px] transition-all cursor-pointer"
                                    >
                                      删除
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {isBatchEditingUnits && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm flex items-center justify-between text-[11px] text-amber-850 animate-pulse">
                    <span>✍️ 您正在批量编辑检测单位说明，修改完成后别忘了点击右上角「保存批量修改」保存内容！</span>
                    <button 
                      type="button"
                      onClick={handleSaveBatchUnits}
                      className="px-2.5 py-1 bg-amber-700 text-white rounded hover:bg-amber-800 text-[10px] font-bold shrink-0 shadow-3xs"
                    >
                      点击保存
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
