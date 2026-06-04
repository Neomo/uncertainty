/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Project, Parameter } from '../types';
import { Download, Upload, Trash2, RotateCcw, Check, FileJson, AlertTriangle } from 'lucide-react';
import { INITIAL_PROJECTS, INITIAL_PARAMETERS } from '../utils/sampleData';

interface BackupDataProps {
  projects: Project[];
  parameters: Parameter[];
  onImportData: (projects: Project[], parameters: Parameter[]) => void;
  onResetToSample: () => void;
  onClearAll: () => void;
}

export default function BackupData({
  projects,
  parameters,
  onImportData,
  onResetToSample,
  onClearAll,
}: BackupDataProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle trigger export of state JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projects,
      parameters,
    }, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `检测不确定度配置备份_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMsg('数据已成功导出为 JSON 文件！');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Handle choose file for import
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.projects || !parsed.parameters || !Array.isArray(parsed.projects) || !Array.isArray(parsed.parameters)) {
          throw new Error('导入文件格式不正确，缺少 projects 或 parameters 数组字段');
        }

        if (window.confirm(`确定要导入这 ${parsed.projects.length} 个项目与 ${parsed.parameters.length} 组参数吗？将会替换您当前的全部数据！`)) {
          onImportData(parsed.projects, parsed.parameters);
          setSuccessMsg('数据导入成功，已更新当前配置！');
          setErrorMsg('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setTimeout(() => setSuccessMsg(''), 3000);
        }
      } catch (err: any) {
        setErrorMsg(`解析文件失败: ${err.message || '文件损坏或非法格式'}`);
        setSuccessMsg('');
      }
    };
    reader.readAsText(file);
  };

  // Safe triggering clear database
  const handleClear = () => {
    if (window.confirm('警告：此操作将清空所有已保存的项目和参数水平数据！且不可撤销，确定清空吗？')) {
      onClearAll();
      setSuccessMsg('数据库已清空。');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Safe triggering reset sample data
  const handleReset = () => {
    if (window.confirm('确定要恢复默认的示范数据（FT3、FT4 样本）吗？该操作将覆盖您目前所有的自定义配置！')) {
      onResetToSample();
      setSuccessMsg('已重置为默认示范数据！');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div id="backup-data-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Export & Import Panel - Editorial Style */}
      <div className="bg-white p-6 rounded-sm border border-black/5 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <FileJson className="h-5 w-5 text-[#5D6D5F]" />
            项目数据库持久化备份与还原
          </h3>
          <p className="text-xs text-slate-500 font-serif italic mt-1 leading-relaxed">
            将全部医学检验项目和不确定度级别参数，导出为标准 JSON 格式加密存储备份。随时可以重新导入。
          </p>
        </div>

        {/* Messaging responses */}
        {successMsg && (
          <div className="p-3 bg-[#e7ece8] text-[#3c473e] rounded-sm text-xs font-serif italic border border-[#5D6D5F]/20">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-800 rounded-sm text-xs font-serif italic border border-rose-150">
            {errorMsg}
          </div>
        )}

        <div className="pt-3 flex flex-wrap gap-3">
          {/* Export JSON trigger button */}
          <button
            id="btn-backup-export"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white font-semibold text-xs uppercase tracking-widest rounded-sm hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            导出备份 (.json)
          </button>

          {/* Import JSON file trigger */}
          <button
            id="btn-backup-import-trigger"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-5 py-2.5 border border-black/15 text-slate-700 bg-white hover:bg-neutral-50 hover:border-black/35 rounded-sm text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            导入备份 (.json)
          </button>
          
          <input
            id="backup-file-input"
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </div>
      </div>

      {/* Dangerous/Safety Operations */}
      <div className="bg-white p-6 rounded-sm border border-black/5 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            演示数据与实验室数据库清理
          </h3>
          <p className="text-xs text-slate-500 font-serif italic mt-1 leading-relaxed">
            您可以一键清除所有的医学检验检测指标模型，或恢复默认的 FT3、FT4 不确定度评定样本数据。
          </p>
        </div>

        <div className="pt-3 flex flex-wrap gap-3">
          {/* Reset template items */}
          <button
            id="btn-restore-samples"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-semibold rounded-sm text-xs uppercase tracking-widest cursor-pointer transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            恢复示范数据 (FT3 / FT4)
          </button>

          {/* Wipe data */}
          <button
            id="btn-clear-db"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-150 rounded-sm text-xs font-semibold uppercase tracking-widest cursor-pointer transition-all"
          >
            <Trash2 className="h-4 w-4" />
            清空所有记录
          </button>
        </div>
      </div>
    </div>
  );
}
