/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DictInstrument, DictProject, DictUnit } from '../types';
import { Plus, Trash2, Library, Wrench, FileCode2, Weight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DictionaryConfigProps {
  instruments: DictInstrument[];
  projects: DictProject[];
  units: DictUnit[];
  onAddInstrument: (inst: Omit<DictInstrument, 'id'>) => void;
  onDeleteInstrument: (id: string) => void;
  onAddDictProject: (proj: Omit<DictProject, 'id'>) => void;
  onDeleteDictProject: (id: string) => void;
  onAddDictUnit: (unit: Omit<DictUnit, 'id'>) => void;
  onDeleteDictUnit: (id: string) => void;
}

export default function DictionaryConfig({
  instruments,
  projects,
  units,
  onAddInstrument,
  onDeleteInstrument,
  onAddDictProject,
  onDeleteDictProject,
  onAddDictUnit,
  onDeleteDictUnit,
}: DictionaryConfigProps) {
  // Local form states
  const [instCode, setInstCode] = useState('');
  const [instName, setInstName] = useState('');
  const [instErr, setInstErr] = useState('');

  const [projCode, setProjCode] = useState('');
  const [projName, setProjName] = useState('');
  const [projErr, setProjErr] = useState('');

  const [unitCode, setUnitCode] = useState('');
  const [unitDesc, setUnitDesc] = useState('');
  const [unitErr, setUnitErr] = useState('');

  // Handle instrument submit
  const handleAddInstSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInstErr('');
    const code = instCode.trim();
    const name = instName.trim();

    if (!code || !name) {
      setInstErr('代码和仪器详情都不能为空');
      return;
    }

    if (instruments.some((i) => i.code.toLowerCase() === code.toLowerCase())) {
      setInstErr(`仪器代码 "${code}" 已存在`);
      return;
    }

    onAddInstrument({ code, name });
    setInstCode('');
    setInstName('');
  };

  // Handle project submit
  const handleAddProjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProjErr('');
    const code = projCode.trim();
    const name = projName.trim();

    if (!code || !name) {
      setProjErr('代码和项目中文名都不能为空');
      return;
    }

    if (projects.some((p) => p.code.toLowerCase() === code.toLowerCase())) {
      setProjErr(`项目代码 "${code}" 已存在`);
      return;
    }

    onAddDictProject({ code, name });
    setProjCode('');
    setProjName('');
  };

  // Handle unit submit
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
      setUnitErr(`单位代码 "${code}" 已存在`);
      return;
    }

    onAddDictUnit({ code, description });
    setUnitCode('');
    setUnitDesc('');
  };

  return (
    <div id="dictionary-config-container" className="space-y-6">
      
      {/* Tab Heading Info Bar */}
      <div className="bg-white p-6 rounded-sm shadow-xs border border-black/5">
        <h2 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <Library className="h-5 w-5 text-[#5D6D5F]" />
          〇 基础数据字典管理
        </h2>
        <p className="text-xs text-slate-500 font-serif italic mt-1 leading-relaxed">
          在此管理医学实验室的基础词典，包含了仪器基础库、检测项目基础库与单位参照库。基础数据是配置检验项目和不确定度的重要基石。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. 检测仪器字典 */}
        <div className="bg-white p-6 border border-black/5 rounded-sm shadow-xs flex flex-col justify-between min-h-[450px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-black/5">
              <Wrench className="h-4 w-4 text-[#5D6D5F]" />
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900">
                1. 检验仪器资料库
              </h3>
            </div>

            {/* Error badge */}
            {instErr && (
              <div className="p-2 border border-rose-150 bg-rose-50 text-rose-800 text-[10px] rounded-sm font-serif italic">
                {instErr}
              </div>
            )}

            {/* Quick Add Form */}
            <form onSubmit={handleAddInstSubmit} className="space-y-3 bg-[#FAF9F6] p-4 border border-black/5 rounded-sm">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  仪器代码 *
                </label>
                <input
                  type="text"
                  placeholder="如: SIEMENSBN II"
                  value={instCode}
                  onChange={(e) => setInstCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-black/15 text-xs text-slate-800 font-mono focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  仪器详情 (规格描述) *
                </label>
                <input
                  type="text"
                  placeholder="如: 西门子特定蛋白分析仪"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-black/15 text-xs text-slate-800 focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-[10px] uppercase tracking-widest rounded-sm transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                登记检测仪器
              </button>
            </form>

            {/* Items List */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {instruments.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-6 italic font-serif">暂无登记仪器</p>
              ) : (
                instruments.map((i) => (
                  <div key={i.id} className="flex items-center justify-between p-2.5 border border-black/[0.04] hover:bg-[#FAF9F6] rounded-sm transition-all text-xs font-sans">
                    <div className="truncate pr-2">
                      <div className="font-mono font-bold text-slate-800 text-[11px]">{i.code}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{i.name}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteInstrument(i.id)}
                      className="p-1 px-1.5 text-rose-800 hover:text-white hover:bg-rose-800 border border-black/10 rounded-sm transition-all cursor-pointer text-[9px]"
                      title="注销仪器"
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 2. 检测项目字典 */}
        <div className="bg-white p-6 border border-black/5 rounded-sm shadow-xs flex flex-col justify-between min-h-[450px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-black/5">
              <FileCode2 className="h-4 w-4 text-[#5D6D5F]" />
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900">
                2. 分析指标项目库
              </h3>
            </div>

            {/* Error badge */}
            {projErr && (
              <div className="p-2 border border-rose-150 bg-rose-50 text-rose-800 text-[10px] rounded-sm font-serif italic">
                {projErr}
              </div>
            )}

            {/* Quick Add Form */}
            <form onSubmit={handleAddProjSubmit} className="space-y-3 bg-[#FAF9F6] p-4 border border-black/5 rounded-sm">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  项目代码 (CODE) *
                </label>
                <input
                  type="text"
                  placeholder="如: FT3, FT4, TSH"
                  value={projCode}
                  onChange={(e) => setProjCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-black/15 text-xs text-slate-800 font-mono focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  检测项目中文名称 *
                </label>
                <input
                  type="text"
                  placeholder="如: 游离三碘甲状腺原氨酸"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-black/15 text-xs text-slate-800 focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-[10px] uppercase tracking-widest rounded-sm transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                新增项目词条
              </button>
            </form>

            {/* Items List */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {projects.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-6 italic font-serif">暂无注册词条</p>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 border border-black/[0.04] hover:bg-[#FAF9F6] rounded-sm transition-all text-xs font-sans">
                    <div className="truncate pr-2">
                      <div className="font-mono font-bold text-slate-800 text-[11px]">{p.code}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.name}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteDictProject(p.id)}
                      className="p-1 px-1.5 text-rose-800 hover:text-white hover:bg-rose-800 border border-black/10 rounded-sm transition-all cursor-pointer text-[9px]"
                      title="废弃词条"
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. 项目单位字典 */}
        <div className="bg-white p-6 border border-black/5 rounded-sm shadow-xs flex flex-col justify-between min-h-[450px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-black/5">
              <Weight className="h-4 w-4 text-[#5D6D5F]" />
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900">
                3. 检测单位常数库
              </h3>
            </div>

            {/* Error badge */}
            {unitErr && (
              <div className="p-2 border border-rose-150 bg-rose-50 text-rose-800 text-[10px] rounded-sm font-serif italic">
                {unitErr}
              </div>
            )}

            {/* Quick Add Form */}
            <form onSubmit={handleAddUnitSubmit} className="space-y-3 bg-[#FAF9F6] p-4 border border-black/5 rounded-sm">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  单位代码 (CODE) *
                </label>
                <input
                  type="text"
                  placeholder="如: pg/ml, ng/ml, mmol/L"
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-black/15 text-xs text-slate-800 font-mono focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-1">
                  单位说明 (选填)
                </label>
                <input
                  type="text"
                  placeholder="如: 皮克/毫升"
                  value={unitDesc}
                  onChange={(e) => setUnitDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-black/15 text-xs text-slate-800 focus:border-[#5D6D5F] rounded-sm transition-all focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-[10px] uppercase tracking-widest rounded-sm transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                新增项目单位
              </button>
            </form>

            {/* Items List */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {units.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-6 italic font-serif">暂无注册单位</p>
              ) : (
                units.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2.5 border border-black/[0.04] hover:bg-[#FAF9F6] rounded-sm transition-all text-xs font-sans">
                    <div className="truncate pr-2">
                      <div className="font-mono font-bold text-slate-800 text-[11px]">{u.code}</div>
                      {u.description && <div className="text-[10px] text-slate-500 truncate mt-0.5">{u.description}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteDictUnit(u.id)}
                      className="p-1 px-1.5 text-rose-800 hover:text-white hover:bg-rose-800 border border-black/10 rounded-sm transition-all cursor-pointer text-[9px]"
                      title="注销单位"
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
