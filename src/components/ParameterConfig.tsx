/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Parameter, CalculatedParameter } from '../types';
import { calculateParameter } from '../utils/calculations';
import { Plus, Edit2, Trash2, Sliders, Check, AlertCircle, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParameterConfigProps {
  projects: Project[];
  parameters: Parameter[];
  onAddParameter: (param: Omit<Parameter, 'id'>) => void;
  onUpdateParameter: (param: Parameter) => void;
  onDeleteParameter: (paramId: string) => void;
}

export default function ParameterConfig({
  projects,
  parameters,
  onAddParameter,
  onUpdateParameter,
  onDeleteParameter,
}: ParameterConfigProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; projectName: string; level: string } | null>(null);
  const [currentParam, setCurrentParam] = useState<Partial<Parameter> | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto calculate the parameters to display in the table
  const calculatedList: CalculatedParameter[] = parameters.map((p) => calculateParameter(p));

  // Open modal to configure a new parameter level
  const handleOpenAdd = () => {
    if (projects.length === 0) {
      alert('请先在“检测项目信息”页面添加至少一个检测项目！');
      return;
    }
    setCurrentParam({
      projectId: projects[0].id,
      unit: 'pg/ml',
      level: '1',
      dateRange: '20250101-20250630',
      mean: 1.0,
      qcCV: 1.0,
      calCV: 1.0,
      tea: 25,
      k: 2,
    });
    setErrorMsg('');
    setIsEditing(true);
  };

  // Open modal to edit existing parameter row
  const handleOpenEdit = (p: Parameter) => {
    setCurrentParam(p);
    setErrorMsg('');
    setIsEditing(true);
  };

  // Save parameter settings
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParam) return;

    const { projectId, unit, level, dateRange, mean, qcCV, calCV, tea, k } = currentParam;

    if (!projectId || !unit?.trim() || !level?.trim() || !dateRange?.trim()) {
      setErrorMsg('请填写所有必填字段');
      return;
    }

    if (
      mean === undefined || mean < 0 ||
      qcCV === undefined || qcCV < 0 ||
      calCV === undefined || calCV < 0 ||
      tea === undefined || tea < 0 ||
      k === undefined || k <= 0
    ) {
      setErrorMsg('数字参数不能为负数，K必须大于 0');
      return;
    }

    const payload: Omit<Parameter, 'id'> = {
      projectId,
      unit: unit.trim(),
      level: level.trim(),
      dateRange: dateRange.trim(),
      mean: Number(mean),
      qcCV: Number(qcCV),
      calCV: Number(calCV),
      tea: Number(tea),
      k: Number(k),
    };

    if (!currentParam.id) {
      onAddParameter(payload);
    } else {
      onUpdateParameter({
        ...payload,
        id: currentParam.id,
      });
    }

    setIsEditing(false);
    setCurrentParam(null);
  };

  const handleDelete = (id: string, projectName: string, level: string) => {
    setDeleteConfirm({ id, projectName, level });
  };

  // Get project code & name for display
  const getProjectDisplay = (projId: string) => {
    const proj = projects.find((p) => p.id === projId);
    return proj ? `${proj.code}${proj.instrument ? `-${proj.instrument}` : ''} (${proj.name})` : '未知项目';
  };

  // Calculate live preview for modal
  const getLivePreview = () => {
    if (!currentParam) return null;
    const temp: Parameter = {
      id: 'temp',
      projectId: currentParam.projectId || '',
      unit: currentParam.unit || 'pg/ml',
      level: currentParam.level || '1',
      dateRange: currentParam.dateRange || '20250101-20250630',
      mean: Number(currentParam.mean) || 0,
      qcCV: Number(currentParam.qcCV) || 0,
      calCV: Number(currentParam.calCV) || 0,
      tea: Number(currentParam.tea) || 0,
      k: Number(currentParam.k) || 2,
    };
    return calculateParameter(temp);
  };

  const previewCalc = getLivePreview();

  return (
    <div id="parameter-config-container" className="space-y-6">
      {/* Description card - Editorial Style */}
      <div className="bg-[#F2EFE9] border border-black/5 p-6 rounded-sm flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-[#5D6D5F] mt-0.5 shrink-0" />
        <div className="text-xs text-slate-800 leading-relaxed">
          <p className="font-serif font-bold text-slate-900 text-sm mb-1.5 uppercase tracking-wider">
            不确定度合成评定说明与标准公式 (ISO 15189)
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-700 font-serif italic">
            <li><strong>校准品偏差平方 (Cal.cv²)：</strong> <code>{"Cal.cv * Cal.cv"}</code></li>
            <li><strong>室内质控不精密度平方 (QC.cv²)：</strong> <code>{"Qc.cv * Qc.cv"}</code></li>
            <li><strong>合成相对标准不确定度 (Uc)：</strong> <code>{"√ (Cal.cv² + QC.cv²)"}</code></li>
            <li><strong>扩展相对标准不确定度 (U)：</strong> <code>{"合成相对UC * K"} (通常采用 K = 2)</code></li>
            <li><strong>国际金标准评判级别：</strong> {"高度契合 (≤ 1/2 TEa)"} | {"合格/接收 (≤ 100% TEa)"} | {"未达标 (超过规定的允许偏差)"}</li>
          </ul>
        </div>
      </div>

      {/* Action panel - Editorial Style */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-sm shadow-xs border border-black/5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
          当前共定义了 <span className="text-[#5D6D5F] text-lg font-mono font-bold mx-1">{parameters.length}</span> 项浓度水平参数模型
        </p>
        <button
          id="btn-add-param"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-xs uppercase tracking-widest rounded-sm shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          配置项目参数浓度
        </button>
      </div>

      {/* Main Parameters Table - Editorial Style */}
      <div className="bg-white rounded-sm shadow-xs min-h-[200px] border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-black/10">
                <th className="py-4 px-3 text-left font-serif font-bold text-slate-800 w-32 uppercase tracking-wide">检测项目</th>
                <th className="py-4 px-2 text-center font-mono font-bold text-slate-600 w-16">单位</th>
                <th className="py-4 px-2 text-center font-serif font-bold text-slate-600 w-16">水平</th>
                <th className="py-4 px-3 text-center font-mono font-bold text-slate-500 w-36">日期范围</th>
                <th className="py-4 px-2 text-center font-serif font-bold text-slate-900 w-20">累积均值</th>
                <th className="py-4 px-2 text-center font-bold text-slate-700 w-16">Qc.cv %</th>
                <th className="py-4 px-2 text-center font-bold text-slate-700 w-16">Cal.cv %</th>
                <th className="py-4 px-2 text-center font-bold text-slate-700 w-16">TEa %</th>
                <th className="py-4 px-2 text-center font-bold text-slate-500 w-12">K</th>
                <th className="py-4 px-2 text-center font-bold text-slate-500 bg-[#FAF9F6]/40 w-24">Cal.cv ²</th>
                <th className="py-4 px-2 text-center font-bold text-slate-500 bg-[#FAF9F6]/40 w-24">QC.cv ²</th>
                <th className="py-4 px-2 text-center font-bold text-slate-800 bg-[#F2EFE9] w-24">Cal²+QC²和</th>
                <th className="py-4 px-2 text-center font-bold text-[#5D6D5F] bg-[#e7ece8]/50 w-24">合成UC (Uc)</th>
                <th className="py-4 px-2 text-center font-bold text-[#3c473e] bg-[#e7ece8] w-24">扩展UC (U)</th>
                <th className="py-4 px-2 text-center font-bold text-slate-600 w-24">达标级别</th>
                <th className="py-4 px-2 text-center font-bold text-slate-600 w-24">评审判定</th>
                <th className="py-4 px-3 text-right font-bold text-slate-600 w-20">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {calculatedList.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-16 text-center text-gray-400 text-sm">
                    暂未配置检测项目的水平参数，点击右上方“配置项目参数浓度”开始进行快速计算。
                  </td>
                </tr>
              ) : (
                calculatedList.map((param) => {
                  const proj = projects.find((p) => p.id === param.projectId);
                  const isSuccess = param.evaluation === '达到要求';
                  return (
                    <tr key={param.id} className="hover:bg-[#FAF9F6] transition-colors border-b border-black/5">
                      {/* Project Code */}
                      <td className="py-4 px-3 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-bold text-slate-800">
                            {proj ? `${proj.code}${proj.instrument ? `-${proj.instrument}` : ''}` : '未知'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-serif italic max-w-[110px] truncate" title={proj?.name}>
                            {proj?.name || ''}
                          </span>
                        </div>
                      </td>
                      {/* Unit */}
                      <td className="py-4 px-2 text-center text-slate-600 font-mono text-xs">
                        {param.unit}
                      </td>
                      {/* Level */}
                      <td className="py-4 px-2 text-center">
                        <span className="bg-[#F2EFE9] text-slate-700 px-2 py-0.5 rounded-sm font-mono font-bold border border-black/5">
                          L{param.level}
                        </span>
                      </td>
                      {/* Date Range */}
                      <td className="py-4 px-3 text-center text-slate-450 font-mono text-[10px]">
                        {param.dateRange}
                      </td>
                      {/* Mean */}
                      <td className="py-4 px-2 text-center text-slate-900 font-bold font-mono">
                        {param.mean}
                      </td>
                      {/* Qc.cv */}
                      <td className="py-4 px-2 text-center text-slate-650 font-mono">
                        {param.qcCV}%
                      </td>
                      {/* Cal.cv */}
                      <td className="py-4 px-2 text-center text-slate-650 font-mono">
                        {param.calCV}%
                      </td>
                      {/* TEa */}
                      <td className="py-4 px-2 text-center text-slate-650 font-mono">
                        {param.tea}%
                      </td>
                      {/* K */}
                      <td className="py-4 px-2 text-center text-slate-400 font-mono">
                        {param.k}
                      </td>
                      {/* Cal.cv平方 */}
                      <td className="py-4 px-2 text-center bg-[#FAF9F6]/20 text-slate-400 font-mono">
                        {param.calCVSquared}
                      </td>
                      {/* QC.cv平方 */}
                      <td className="py-4 px-2 text-center bg-[#FAF9F6]/20 text-slate-400 font-mono">
                        {param.qcCVSquared}
                      </td>
                      {/* Cal.cv平方+QC.cv平方 */}
                      <td className="py-4 px-2 text-center bg-[#F2EFE9] text-slate-800 font-bold font-mono">
                        {param.sumCVSquared}
                      </td>
                      {/* 合成相对UC */}
                      <td className="py-4 px-2 text-center bg-[#e7ece8]/40 text-[#49564b] font-bold font-mono">
                        {param.combinedUC}%
                      </td>
                      {/* 扩展相对UC */}
                      <td className="py-4 px-2 text-center bg-[#e7ece8] text-[#3c473e] font-bold font-mono">
                        {param.expandedUC}%
                      </td>
                      {/* 达标状态 */}
                      <td className="py-4 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm font-mono font-bold text-[10px] ${
                            param.complianceStatus.includes('< 1/2')
                              ? 'bg-emerald-100 text-emerald-800'
                              : param.complianceStatus.includes('<')
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 animate-pulse'
                          }`}
                        >
                          {param.complianceStatus}
                        </span>
                      </td>
                      {/* 评判 */}
                      <td className="py-4 px-2 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-semibold ${
                            isSuccess
                              ? 'bg-[#5D6D5F] text-white'
                              : 'bg-rose-800 text-white animate-pulse'
                          }`}
                        >
                          {param.evaluation}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`btn-edit-param-${param.id}`}
                            onClick={() => handleOpenEdit(param)}
                            title="修改参数"
                            className="p-1 px-1.5 text-slate-600 hover:text-white hover:bg-[#5D6D5F] border border-black/10 rounded-sm transition-all cursor-pointer text-[10px]"
                          >
                            编辑
                          </button>
                          <button
                            id={`btn-delete-param-${param.id}`}
                            onClick={() => handleDelete(param.id, proj?.code || '未知项目', param.level)}
                            title="删除参数"
                            className="p-1 px-1.5 text-rose-700 hover:text-white hover:bg-rose-800 border border-black/10 rounded-sm transition-all cursor-pointer text-[10px]"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Overlay Parameter / Modal */}
      <AnimatePresence>
        {isEditing && currentParam && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden"
            >
              {/* Form Side - Column width 7/12 */}
              <div className="p-6 md:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-800">
                    {currentParam.id ? '编辑浓度水平参数' : '配置参数水平浓度'}
                  </h3>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 md:hidden transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium border border-rose-100">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                  {/* Select Project */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      选择检测项目 *
                    </label>
                    <select
                      id="select-param-project"
                      required
                      value={currentParam.projectId || ''}
                      onChange={(e) =>
                        setCurrentParam({ ...currentParam, projectId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code}{p.instrument ? `-${p.instrument}` : ''} ({p.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Level */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        水平（浓度）代号 *
                      </label>
                      <input
                        id="input-param-level"
                        type="text"
                        required
                        placeholder="e.g. 1 或者是 2"
                        value={currentParam.level || ''}
                        onChange={(e) =>
                          setCurrentParam({ ...currentParam, level: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50"
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        单位 *
                      </label>
                      <input
                        id="input-param-unit"
                        type="text"
                        required
                        placeholder="e.g. pg/ml"
                        value={currentParam.unit || ''}
                        onChange={(e) =>
                          setCurrentParam({ ...currentParam, unit: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Date range */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        日期范围 *
                      </label>
                      <input
                        id="input-param-date"
                        type="text"
                        required
                        placeholder="e.g. 20250101-20250630"
                        value={currentParam.dateRange || ''}
                        onChange={(e) =>
                          setCurrentParam({ ...currentParam, dateRange: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Mean */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        累积均值 *
                      </label>
                      <input
                        id="input-param-mean"
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 7.77"
                        value={currentParam.mean !== undefined ? currentParam.mean : ''}
                        onChange={(e) =>
                          setCurrentParam({ ...currentParam, mean: e.target.value === '' ? undefined : Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 font-mono"
                      />
                    </div>

                    {/* TEa */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        TEa 允许误差% *
                      </label>
                      <input
                        id="input-param-tea"
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 25"
                        value={currentParam.tea !== undefined ? currentParam.tea : ''}
                        onChange={(e) =>
                          setCurrentParam({ ...currentParam, tea: e.target.value === '' ? undefined : Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Qc.cv */}
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Qc.cv % *
                      </label>
                      <input
                        id="input-param-qccv"
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 4.12"
                        value={currentParam.qcCV !== undefined ? currentParam.qcCV : ''}
                        onChange={(e) =>
                          setCurrentParam({ ...currentParam, qcCV: e.target.value === '' ? undefined : Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 font-mono"
                      />
                    </div>

                    {/* Cal.cv */}
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Cal.cv % *
                      </label>
                      <input
                        id="input-param-calcv"
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 3.20"
                        value={currentParam.calCV !== undefined ? currentParam.calCV : ''}
                        onChange={(e) =>
                          setCurrentParam({ ...currentParam, calCV: e.target.value === '' ? undefined : Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 font-mono"
                      />
                    </div>

                    {/* K coeff */}
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        K 扩展常数 *
                      </label>
                      <input
                        id="input-param-k"
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 2"
                        value={currentParam.k !== undefined ? currentParam.k : ''}
                        onChange={(e) =>
                          setCurrentParam({ ...currentParam, k: e.target.value === '' ? undefined : Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      确认
                    </button>
                  </div>
                </form>
              </div>

              {/* Math Live-Preview Side - Column width 5/12 */}
              <div className="p-6 md:col-span-5 bg-[#3c473e] text-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 md:flex">
                    <h4 className="text-[11px] font-bold text-slate-200 tracking-widest uppercase flex items-center gap-1.5 font-sans">
                      <Sliders className="h-4 w-4 text-emerald-300" />
                      不确定度实时计算公式
                    </h4>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="hidden md:block p-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {previewCalc ? (
                    <div className="space-y-4">
                      {/* Square Cal */}
                      <div className="bg-[#2a332c] p-3 rounded-sm border border-white/5">
                        <div className="text-[10px] text-[#e7ece8] opacity-80 uppercase tracking-wider mb-1 font-sans">
                          校准品不精密度平方 (Cal.cv²)
                        </div>
                        <div className="font-mono text-sm font-bold text-white">
                          {previewCalc.calCV || 0}² = {previewCalc.calCVSquared || 0}
                        </div>
                      </div>

                      {/* Square QC */}
                      <div className="bg-[#2a332c] p-3 rounded-sm border border-white/5">
                        <div className="text-[10px] text-[#e7ece8] opacity-80 uppercase tracking-wider mb-1 font-sans">
                          室内质控不精密度平方 (QC.cv²)
                        </div>
                        <div className="font-mono text-sm font-bold text-white">
                          {previewCalc.qcCV || 0}² = {previewCalc.qcCVSquared || 0}
                        </div>
                      </div>

                      {/* Combined formula */}
                      <div className="bg-[#2a332c] p-3 rounded-sm border border-[#5D6D5F]">
                        <div className="text-[10px] text-[#e7ece8] uppercase tracking-wider mb-1 font-sans font-semibold">
                          合成标准不确定度 (Uc)
                        </div>
                        <div className="font-mono text-xs font-bold text-emerald-300">
                          √({previewCalc.calCVSquared} + {previewCalc.qcCVSquared}) = {previewCalc.combinedUC}%
                        </div>
                      </div>

                      {/* Expanded formula */}
                      <div className="bg-[#2a332c] p-3 rounded-sm border border-[#5D6D5F]">
                        <div className="text-[10px] text-[#e7ece8] uppercase tracking-wider mb-1 font-sans font-semibold">
                          扩展相对不确定度 (U, K={previewCalc.k})
                        </div>
                        <div className="font-mono text-xs font-bold text-amber-200">
                          {previewCalc.combinedUC}% * {previewCalc.k} = {previewCalc.expandedUC}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 font-serif italic">请输入数值以即时预览计算结果...</p>
                  )}
                </div>

                {/* Final verdict preview */}
                {previewCalc && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-[#2a332c] p-2.5 rounded-sm border border-white/5">
                        <div className="text-[9px] uppercase tracking-wider text-slate-300 mb-0.5 font-sans">达标评判</div>
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {previewCalc.complianceStatus}
                        </span>
                      </div>
                      <div className="bg-[#2a332c] p-2.5 rounded-sm border border-white/5">
                        <div className="text-[9px] uppercase tracking-wider text-slate-300 mb-0.5 font-sans">终审判定</div>
                        <span
                          className={`font-semibold text-xs px-2 py-0.5 rounded-sm ${
                            previewCalc.evaluation === '达到要求'
                              ? 'bg-emerald-800 text-white'
                              : 'bg-rose-900 text-white animate-pulse'
                          }`}
                        >
                          {previewCalc.evaluation}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-[#FAF9F6] border border-black/10 rounded-sm p-6 max-w-sm w-full shadow-lg space-y-4"
            >
              <div className="text-amber-700 bg-amber-50 p-4 rounded-sm border border-amber-100 flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-[#5D6D5F]" />
                <div className="text-xs">
                  <p className="font-serif font-bold text-slate-900 mb-1.5 leading-normal uppercase tracking-wider text-[11px]">
                    确认删除浓度水平配置?
                  </p>
                  <p className="text-slate-650 font-serif italic mb-1">
                    检测项目：<span className="font-bold text-slate-900 font-mono">{deleteConfirm.projectName}</span>
                  </p>
                  <p className="text-slate-650 font-serif italic">
                    浓度水平：<span className="font-bold text-slate-900 font-mono">L{deleteConfirm.level}</span>
                  </p>
                  <p className="text-rose-800 font-bold font-serif tracking-tight mt-2 bg-rose-50 p-2 border border-rose-100">
                    注意：此操作将永久删除该组浓度评定计算参数！
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-white border border-black/15 text-xs font-semibold uppercase tracking-wider hover:border-black/35 rounded-sm cursor-pointer transition-all"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteParameter(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }}
                  className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white text-xs font-semibold uppercase tracking-wider rounded-sm cursor-pointer transition-all"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
