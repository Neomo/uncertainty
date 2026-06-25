/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Parameter, CalculatedParameter, DictInstrument } from '../types';
import { calculateParameter } from '../utils/calculations';
import { Plus, Edit2, Trash2, Sliders, Check, AlertCircle, X, HelpCircle, Copy, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface ParameterConfigProps {
  projects: Project[];
  parameters: Parameter[];
  onAddParameter: (param: Omit<Parameter, 'id'> | Omit<Parameter, 'id'>[], afterId?: string) => void;
  onUpdateParameter: (param: Parameter | Parameter[]) => void;
  onDeleteParameter: (paramId: string) => void;
  dictInstruments?: DictInstrument[];
}

export default function ParameterConfig({
  projects,
  parameters,
  onAddParameter,
  onUpdateParameter,
  onDeleteParameter,
  dictInstruments = [],
}: ParameterConfigProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; projectName: string; level: string } | null>(null);
  const [currentParam, setCurrentParam] = useState<Partial<Parameter> | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Batch Add State
  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [selectedProjIds, setSelectedProjIds] = useState<string[]>([]);
  const [batchLevel, setBatchLevel] = useState('1');
  const [batchDateRange, setBatchDateRange] = useState('20250101-20250630');
  const [batchMean, setBatchMean] = useState('1.0');
  const [batchQcCV, setBatchQcCV] = useState('1.0');
  const [batchCalCV, setBatchCalCV] = useState('1.0');
  const [batchTea, setBatchTea] = useState('25');
  const [batchK, setBatchK] = useState('2');
  const [batchErrorMsg, setBatchErrorMsg] = useState('');

  // Batch Edit & Inline Edit State
  const [successTip, setSuccessTip] = useState('');
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [batchParams, setBatchParams] = useState<Parameter[]>([]);
  const [inlineEdit, setInlineEdit] = useState<{
    id: string;
    field: 'level' | 'dateRange' | 'mean' | 'qcCV' | 'calCV' | 'tea' | 'k';
    value: string;
  } | null>(null);

  // Filter & Group Controls
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [groupByInstrument, setGroupByInstrument] = useState<boolean>(false);
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(false);

  // Helper of level status style with distinct background colors for each level
  const getLevelStyle = (level: string) => {
    const norm = String(level).trim().toLowerCase().replace(/^l/i, '');
    if (norm === '1') {
      return 'bg-[#E3F2FD] text-[#0D47A1] border-[#BBDEFB] font-bold';
    } else if (norm === '2') {
      return 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9] font-bold';
    } else if (norm === '3') {
      return 'bg-[#F3E5F5] text-[#4A148C] border-[#E1BEE7] font-bold';
    } else {
      return 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2] font-bold';
    }
  };

  // Get all unique instruments existing in current project list
  const uniqueInstruments = Array.from(new Set(projects.map((p) => p.instrument?.trim()).filter(Boolean))) as string[];

  // Auto calculate the parameters to display in the table
  const displayParams = isBatchEditing ? batchParams : parameters;
  const calculatedList: CalculatedParameter[] = displayParams.map((p) => {
    const calc = calculateParameter(p);
    const proj = projects.find((proj) => proj.id === p.projectId);
    if (proj) {
      calc.unit = proj.unit;
    }
    return calc;
  });

  // Filter display list based on selected instrument
  const filteredCalculatedList = selectedInstrument
    ? calculatedList.filter((param) => {
        const proj = projects.find((p) => p.id === param.projectId);
        return (proj?.instrument || '').trim().toLowerCase() === selectedInstrument.trim().toLowerCase();
      })
    : calculatedList;

  // Grouped calculated parameters mapping for group display mode
  const groupedCalculatedList: { [instrument: string]: CalculatedParameter[] } = {};
  filteredCalculatedList.forEach((param) => {
    const proj = projects.find((p) => p.id === param.projectId);
    const inst = (proj?.instrument || '').trim() || '未指定仪器';
    if (!groupedCalculatedList[inst]) {
      groupedCalculatedList[inst] = [];
    }
    groupedCalculatedList[inst].push(param);
  });

  // Allowed projects (do not have any configured parameters yet)
  const allowedProjects = projects.filter((p) => !parameters.some((param) => param.projectId === p.id));

  // Check if a duplicate (Project Code - Instrument Code - Level) exists
  const checkDuplicate = (projectId: string, level: string, excludeParamId?: string): boolean => {
    const targetProj = projects.find((p) => p.id === projectId);
    if (!targetProj) return false;

    return parameters.some((p) => {
      if (excludeParamId && p.id === excludeParamId) return false;
      const proj = projects.find((pr) => pr.id === p.projectId);
      if (!proj) return false;

      return (
        proj.code.trim().toLowerCase() === targetProj.code.trim().toLowerCase() &&
        proj.instrument.trim().toLowerCase() === targetProj.instrument.trim().toLowerCase() &&
        p.level.trim().toLowerCase() === level.trim().toLowerCase()
      );
    });
  };

  // Open modal to configure a new parameter level
  const handleOpenAdd = () => {
    if (projects.length === 0) {
      alert('请先在“检测项目信息”页面添加至少一个检测项目！');
      return;
    }
    const defaultProj = projects[0];
    setCurrentParam({
      projectId: defaultProj.id,
      unit: defaultProj.unit || 'pg/ml',
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

  // Open modal to edit an existing parameter level
  const handleOpenEdit = (param: Parameter) => {
    setCurrentParam(param);
    setErrorMsg('');
    setIsEditing(true);
  };

  // Quick add a new level for the specific project row
  const handleQuickAddLevel = (param: Parameter) => {
    const proj = projects.find((p) => p.id === param.projectId);
    if (!proj) return;

    // Find all parameters belonging to any project with the same code & instrument as this one
    const siblingProjects = projects.filter(
      (p) => p.code.trim().toLowerCase() === proj.code.trim().toLowerCase() &&
             p.instrument.trim().toLowerCase() === proj.instrument.trim().toLowerCase()
    );
    const siblingProjIds = siblingProjects.map((p) => p.id);
    const existingLevels = parameters
      .filter((p) => siblingProjIds.includes(p.projectId))
      .map((p) => p.level.trim().toLowerCase());

    const currentLevel = param.level || '1';
    let nextLevelNum = 2;
    const match = currentLevel.match(/^(\D*)(\d+)(\D*)$/);
    
    let prefix = '';
    let suffix = '';
    if (match) {
      prefix = match[1];
      nextLevelNum = parseInt(match[2], 10) + 1;
      suffix = match[3];
    }

    let proposedLevel = match ? `${prefix}${nextLevelNum}${suffix}` : `${currentLevel}_2`;

    // Automatically advance to get first non-existing level for this project
    let safetyCounter = 0;
    while (existingLevels.includes(proposedLevel.trim().toLowerCase()) && safetyCounter < 100) {
      safetyCounter++;
      if (match) {
        nextLevelNum++;
        proposedLevel = `${prefix}${nextLevelNum}${suffix}`;
      } else {
        proposedLevel = `${currentLevel}_${safetyCounter + 1}`;
      }
    }

    if (existingLevels.includes(proposedLevel.trim().toLowerCase())) {
      alert(`无法自动生成新级别：该项目的常见水平浓度均已配置！`);
      return;
    }

    const payload: Omit<Parameter, 'id'> = {
      projectId: param.projectId,
      unit: param.unit,
      level: proposedLevel,
      dateRange: param.dateRange,
      mean: param.mean,
      qcCV: param.qcCV,
      calCV: param.calCV,
      tea: param.tea,
      k: param.k,
    };

    onAddParameter(payload, param.id);

    setSuccessTip(`已快速新增项目 ${proj.code}${proj.instrument ? ` - ${proj.instrument}` : ''} 的 Level L${proposedLevel} 浓度参数数据！`);
    setTimeout(() => {
      setSuccessTip('');
    }, 3000);
  };

  // Import cumulative mean and Qc.cv from Excel
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to array of arrays
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rows.length < 3) {
          alert('导入失败：Excel 文件数据行数不足。第 1 行为表头，第 2 行为字段类型，第 3 行起为数据。');
          return;
        }

        const headers = rows[0] as string[];
        if (!headers || headers.length === 0) {
          alert('导入失败：Excel 文件中未找到有效的表头。');
          return;
        }

        // Find relevant columns dynamically
        const labLotTestIdIdx = headers.findIndex((h) => h && (
          String(h).trim().toLowerCase() === 'lablottestid' ||
          String(h).trim().toLowerCase() === 'lablottest_id' ||
          String(h).trim().toLowerCase() === 'testid'
        ));
        const instrumentIdx = headers.findIndex((h) => h && (String(h).trim() === '仪器' || String(h).trim() === '检测仪器'));
        const codeIdx = headers.findIndex((h) => h && (String(h).trim() === '项目代号' || String(h).trim() === '项目代码' || String(h).trim() === '项目简称'));
        const levelIdx = headers.findIndex((h) => h && (String(h).trim() === '水平' || String(h).trim() === '水平代号' || String(h).trim() === '浓度水平'));
        const meanIdx = headers.findIndex((h) => h && (String(h).trim() === '累积均值' || String(h).trim().includes('均值')));
        const qccvIdx = headers.findIndex((h) => h && (String(h).trim().toLowerCase().startsWith('qc.cv') || String(h).trim().toLowerCase().startsWith('qccv')));

        const missingCols = [];
        if (instrumentIdx === -1) missingCols.push('仪器');
        if (codeIdx === -1) missingCols.push('项目代号');
        if (levelIdx === -1) missingCols.push('水平');
        if (meanIdx === -1) missingCols.push('累积均值');
        if (qccvIdx === -1) missingCols.push('Qc.cv');

        if (missingCols.length > 0) {
          alert(`导入失败：Excel 缺少以下必需列：${missingCols.join(', ')}`);
          return;
        }

        let updatedCount = 0;
        const toUpdate: Parameter[] = [];

        // Excel rows start from index 2 (third row)
        for (let i = 2; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const labLotTestIdVal = labLotTestIdIdx !== -1 ? String(row[labLotTestIdIdx] || '').trim() : '';
          const instrumentVal = String(row[instrumentIdx] || '').trim();
          const codeVal = String(row[codeIdx] || '').trim();
          const levelVal = String(row[levelIdx] || '').trim();
          const meanRaw = row[meanIdx];
          const qccvRaw = row[qccvIdx];

          if (!labLotTestIdVal && !instrumentVal && !codeVal && !levelVal) continue;

          // Parse numeric inputs safely
          const meanVal = meanRaw !== undefined && meanRaw !== null ? parseFloat(String(meanRaw).trim()) : NaN;
          const qccvVal = qccvRaw !== undefined && qccvRaw !== null ? parseFloat(String(qccvRaw).trim()) : NaN;

          if (isNaN(meanVal) || isNaN(qccvVal)) {
            continue;
          }

          // Search matching parameter in local database parameters list
          const matchParam = parameters.find((param) => {
            const proj = projects.find((p) => p.id === param.projectId);
            if (!proj) return false;

            const normalParamLevel = param.level.trim().replace(/^L/i, '').toLowerCase();
            const normalExcelLevel = levelVal.trim().replace(/^L/i, '').toLowerCase();
            const levelMatch = normalParamLevel === normalExcelLevel;
            if (!levelMatch) return false;

            // Priority 1: match by LabLotTestID if non-empty
            if (labLotTestIdVal && proj.labLotTestId && proj.labLotTestId.trim().toLowerCase() === labLotTestIdVal.toLowerCase()) {
              return true;
            }

            // Priority 2: fallback to Instrument + Project Code matching
            const instMatch = proj.instrument.trim().toLowerCase() === instrumentVal.toLowerCase();
            const codeMatch = proj.code.trim().toLowerCase() === codeVal.toLowerCase();

            return instMatch && codeMatch;
          });

          if (matchParam) {
            const existingInUpdate = toUpdate.find((p) => p.id === matchParam.id);
            if (existingInUpdate) {
              existingInUpdate.mean = meanVal;
              existingInUpdate.qcCV = qccvVal;
            } else {
              toUpdate.push({
                ...matchParam,
                mean: meanVal,
                qcCV: qccvVal,
              });
              updatedCount++;
            }
          }
        }

        if (updatedCount > 0) {
          onUpdateParameter(toUpdate);
          setSuccessTip(`成功从 Excel 导入并覆盖了 ${updatedCount} 条项目的累积均值与 Qc.cv 数据！`);
          setTimeout(() => {
            setSuccessTip('');
          }, 5000);
        } else {
          alert('导入失败：未匹配到系统中的检测项目或对应水平。请确认 Excel中 仪器、项目代号（项目代码）及 水平 与系统完美匹配。');
        }
      } catch (err) {
        console.error(err);
        alert('解析 Excel 时出现错误，请确保上传了正确的 xlsx/xls 文件。');
      }
      
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  // Open batch add modal
  const handleOpenBatchAdd = () => {
    if (projects.length === 0) {
      alert('请先在“检测项目信息”页面添加至少一个检测项目！');
      return;
    }
    if (allowedProjects.length === 0) {
      alert('所有项目均已配置了浓度参数！如需添加新的深度级别参数，请使用“配置项目参数浓度”单个新增。');
      return;
    }
    setSelectedProjIds(allowedProjects.map((p) => p.id)); // Default checked all available
    setBatchLevel('1');
    setBatchDateRange('20250101-20250630');
    setBatchMean('1.0');
    setBatchQcCV('1.0');
    setBatchCalCV('1.0');
    setBatchTea('25');
    setBatchK('2');
    setBatchErrorMsg('');
    setIsBatchAdding(true);
  };

  // Submit batch add
  const handleBatchAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjIds.length === 0) {
      setBatchErrorMsg('请至少勾选一个检测项目！');
      return;
    }

    const meanNum = Number(batchMean);
    const qcCVNum = Number(batchQcCV);
    const calCVNum = Number(batchCalCV);
    const teaNum = Number(batchTea);
    const kNum = Number(batchK);

    if (
      meanNum < 0 || qcCVNum < 0 || calCVNum < 0 || teaNum < 0 || kNum <= 0 ||
      isNaN(meanNum) || isNaN(qcCVNum) || isNaN(calCVNum) || isNaN(teaNum) || isNaN(kNum)
    ) {
      setBatchErrorMsg('数值参数不能为负，K 因子必须大于 0！');
      return;
    }

    if (!batchLevel.trim() || !batchDateRange.trim()) {
      setBatchErrorMsg('水平代号与日期范围不能为空！');
      return;
    }

    const payloads: Omit<Parameter, 'id'>[] = selectedProjIds.map((projId) => {
      const projObj = projects.find((p) => p.id === projId);
      return {
        projectId: projId,
        unit: projObj?.unit || '',
        level: batchLevel.trim(),
        dateRange: batchDateRange.trim(),
        mean: meanNum,
        qcCV: qcCVNum,
        calCV: calCVNum,
        tea: teaNum,
        k: kNum,
      };
    });

    onAddParameter(payloads);
    setIsBatchAdding(false);
    setSuccessTip(`成功批量添加了 ${payloads.length} 个项目的参数浓度水平模型！`);
    setTimeout(() => setSuccessTip(''), 4000);
  };

  // Start parameter batch modification
  const handleStartBatchEdit = () => {
    setBatchParams(JSON.parse(JSON.stringify(parameters)));
    setIsBatchEditing(true);
    setErrorMsg('');
    setSuccessTip('');
  };

  // Cancel parameter batch modification
  const handleCancelBatchEdit = () => {
    setIsBatchEditing(false);
    setBatchParams([]);
  };

  // Change individual field in parameter batch copy array
  const handleBatchFieldChange = (
    paramId: string,
    field: 'level' | 'dateRange' | 'mean' | 'qcCV' | 'calCV' | 'tea' | 'k',
    value: string
  ) => {
    setBatchParams((prev) =>
      prev.map((p) => {
        if (p.id !== paramId) return p;
        if (field === 'level' || field === 'dateRange') {
          return { ...p, [field]: value };
        } else {
          return { ...p, [field]: value === '' ? 0 : Number(value) };
        }
      })
    );
  };

  // Save parameter batch modifications
  const handleSaveBatchEdit = () => {
    const hasInvalid = batchParams.some(p => 
      !p.level?.trim() || !p.dateRange?.trim() ||
      p.mean === undefined || p.mean < 0 ||
      p.qcCV === undefined || p.qcCV < 0 ||
      p.calCV === undefined || p.calCV < 0 ||
      p.tea === undefined || p.tea < 0 ||
      p.k === undefined || p.k <= 0
    );

    if (hasInvalid) {
      alert('请检查所有数值是否正确且非负，日期和级别不能为空，其中 K 因子必须大于 0！');
      return;
    }

    // Check duplicates in batchParams
    const seenCombos = new Set<string>();
    let duplicateFound = false;
    let duplicateInfo = '';

    for (const p of batchParams) {
      const proj = projects.find((pr) => pr.id === p.projectId);
      if (!proj) continue;
      const key = `${proj.code.trim()}||${proj.instrument.trim()}||${p.level.trim()}`.toLowerCase();
      if (seenCombos.has(key)) {
        duplicateFound = true;
        duplicateInfo = `[${proj.code} - ${proj.instrument}] 的 L${p.level} 水平`;
        break;
      }
      seenCombos.add(key);
    }

    if (duplicateFound) {
      alert(`保存失败：检测到重复配置 ${duplicateInfo} 的参数。项目代码-仪器代码-水平组合只允许同时存在一个！`);
      return;
    }

    onUpdateParameter(batchParams);
    setIsBatchEditing(false);
    setSuccessTip('批量修改检测项目参数浓度成功！');
    setTimeout(() => setSuccessTip(''), 3500);
  };

  // Inline save individual key-value change
  const handleInlineSave = (
    paramId: string,
    field: 'level' | 'dateRange' | 'mean' | 'qcCV' | 'calCV' | 'tea' | 'k',
    value: string
  ) => {
    const orig = parameters.find((p) => p.id === paramId);
    if (orig) {
      const isStringField = field === 'level' || field === 'dateRange';
      const parsedValue = isStringField ? value.trim() : (value === '' ? 0 : Number(value));
      
      if (!isStringField) {
        if (isNaN(parsedValue as number) || (parsedValue as number) < 0 || (field === 'k' && (parsedValue as number) <= 0)) {
          setInlineEdit(null);
          return;
        }
      } else {
        if (!value.trim()) {
          setInlineEdit(null);
          return;
        }
      }

      if (orig[field] !== parsedValue) {
        if (field === 'level') {
          if (checkDuplicate(orig.projectId, parsedValue as string, orig.id)) {
            const proj = projects.find((pr) => pr.id === orig.projectId);
            alert(`快速更新失败：检测项目 [${proj?.code || ''} - ${proj?.instrument || ''}] 的 L${(parsedValue as string).trim()} 水平参数已存在！`);
            setInlineEdit(null);
            return;
          }
        }

        const updated = {
          ...orig,
          [field]: parsedValue,
        } as Parameter;
        onUpdateParameter(updated);
        const proj = projects.find((pr) => pr.id === orig.projectId);
        setSuccessTip(`已快速更新项目 ${proj?.code || ''} Level ${orig.level} 的${
          field === 'level' ? '水平代号' :
          field === 'dateRange' ? '日期范围' :
          field === 'mean' ? '累积均值' :
          field === 'qcCV' ? 'QC.cv %' :
          field === 'calCV' ? 'Cal.cv %' :
          field === 'tea' ? 'TEa %' : 'K 扩展常数'
        }`);
        setTimeout(() => setSuccessTip(''), 3000);
      }
    }
    setInlineEdit(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParam) return;

    const { projectId, level, dateRange, mean, qcCV, calCV, tea, k } = currentParam;

    if (!projectId || !level?.trim() || !dateRange?.trim()) {
      setErrorMsg('项目、水平与日期范围不能为空！');
      return;
    }

    if (
      mean === undefined || mean < 0 ||
      qcCV === undefined || qcCV < 0 ||
      calCV === undefined || calCV < 0 ||
      tea === undefined || tea < 0 ||
      k === undefined || k <= 0
    ) {
      setErrorMsg('数值参数不能为负，且 K 因子必须大于 0！');
      return;
    }

    const selectedProj = projects.find((p) => p.id === projectId);
    const resolvedUnit = selectedProj?.unit || '';

    if (checkDuplicate(projectId, level, currentParam.id)) {
      setErrorMsg(`配置失败：检测项目 [${selectedProj?.code || ''} - ${selectedProj?.instrument || ''}] 的 L${level.trim()} 水平参数已配置，不能重复配置相同的水平！`);
      return;
    }

    const payload: Omit<Parameter, 'id'> = {
      projectId,
      unit: resolvedUnit,
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

  const renderRow = (param: CalculatedParameter) => {
    const proj = projects.find((p) => p.id === param.projectId);
    const isSuccess = param.evaluation === '达到要求';
    return (
      <tr key={param.id} className="hover:bg-[#FAF9F6] transition-colors border-b border-black/5">
        {/* Project Code */}
        <td className="py-4 px-3 font-semibold text-slate-900">
          <div className="flex flex-col">
            <span className="font-mono text-sm font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
              {proj ? `${proj.code}${proj.instrument ? `-${proj.instrument}` : ''}` : '未知'}
              {proj?.labLotTestId && (
                <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/55">
                  ID: {proj.labLotTestId}
                </span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 font-serif italic max-w-[110px] truncate" title={proj?.name}>
              {proj?.name || ''}
            </span>
          </div>
        </td>
        {/* Unit */}
        <td className="py-4 px-2 text-center text-slate-605 font-mono text-xs">
          {param.unit}
        </td>
        {/* Level */}
        <td className="py-4 px-2 text-center text-xs">
          {isBatchEditing ? (
            <input
              type="text"
              value={param.level || ''}
              onChange={(e) => handleBatchFieldChange(param.id, 'level', e.target.value)}
              className="w-14 px-1.5 py-0.5 border border-gray-300 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono font-bold"
            />
          ) : inlineEdit?.id === param.id && inlineEdit?.field === 'level' ? (
            <input
              type="text"
              autoFocus
              value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={() => handleInlineSave(param.id, 'level', inlineEdit.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSave(param.id, 'level', inlineEdit.value);
                if (e.key === 'Escape') setInlineEdit(null);
              }}
              className="w-14 px-1.5 py-0.5 border border-gray-400 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono font-bold"
            />
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: param.id, field: 'level', value: param.level || '' })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none inline-block font-mono"
              title="双击编辑"
            >
              <span className={`px-2 py-0.5 rounded-sm border text-[11px] ${getLevelStyle(param.level)} md:min-w-10 text-center inline-block`}>
                L{param.level}
              </span>
            </div>
          )}
        </td>
        {/* Date Range */}
        <td className="py-4 px-3 text-center text-slate-450 font-mono text-[10px]">
          {isBatchEditing ? (
            <input
              type="text"
              value={param.dateRange || ''}
              onChange={(e) => handleBatchFieldChange(param.id, 'dateRange', e.target.value)}
              className="w-32 px-1.5 py-0.5 border border-gray-300 rounded text-center text-[10px] tracking-tight bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] uppercase"
            />
          ) : inlineEdit?.id === param.id && inlineEdit?.field === 'dateRange' ? (
            <input
              type="text"
              autoFocus
              value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={() => handleInlineSave(param.id, 'dateRange', inlineEdit.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSave(param.id, 'dateRange', inlineEdit.value);
                if (e.key === 'Escape') setInlineEdit(null);
              }}
              className="w-32 px-1.5 py-0.5 border border-gray-400 rounded text-center text-[10px] tracking-tight bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] uppercase"
            />
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: param.id, field: 'dateRange', value: param.dateRange || '' })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none"
              title="双击编辑"
            >
              {param.dateRange}
            </div>
          )}
        </td>
        {/* Mean */}
        <td className="py-4 px-2 text-center text-slate-900 font-bold font-mono">
          {isBatchEditing ? (
            <input
              type="number"
              step="any"
              value={param.mean !== undefined ? param.mean : ''}
              onChange={(e) => handleBatchFieldChange(param.id, 'mean', e.target.value)}
              className="w-20 px-1.5 py-0.5 border border-gray-300 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono font-bold"
            />
          ) : inlineEdit?.id === param.id && inlineEdit?.field === 'mean' ? (
            <input
              type="number"
              step="any"
              autoFocus
              value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={() => handleInlineSave(param.id, 'mean', inlineEdit.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSave(param.id, 'mean', inlineEdit.value);
                if (e.key === 'Escape') setInlineEdit(null);
              }}
              className="w-20 px-1.5 py-0.5 border border-gray-405 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono font-bold"
            />
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: param.id, field: 'mean', value: String(param.mean) })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none font-bold"
              title="双击编辑"
            >
              {param.mean}
            </div>
          )}
        </td>
        {/* Qc.cv */}
        <td className="py-4 px-2 text-center text-slate-650 font-mono">
          {isBatchEditing ? (
            <div className="flex items-center justify-center gap-0.5">
              <input
                type="number"
                step="any"
                value={param.qcCV !== undefined ? param.qcCV : ''}
                onChange={(e) => handleBatchFieldChange(param.id, 'qcCV', e.target.value)}
                className="w-14 px-1 py-0.5 border border-gray-300 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono"
              />
              <span className="text-[10px] text-gray-500">%</span>
            </div>
          ) : inlineEdit?.id === param.id && inlineEdit?.field === 'qcCV' ? (
            <div className="flex items-center justify-center gap-0.5">
              <input
                type="number"
                step="any"
                autoFocus
                value={inlineEdit.value}
                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                onBlur={() => handleInlineSave(param.id, 'qcCV', inlineEdit.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineSave(param.id, 'qcCV', inlineEdit.value);
                  if (e.key === 'Escape') setInlineEdit(null);
                }}
                className="w-14 px-1 py-0.5 border border-gray-400 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono"
              />
              <span className="text-[10px] text-gray-500">%</span>
            </div>
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: param.id, field: 'qcCV', value: String(param.qcCV) })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none"
              title="双击编辑"
            >
              {param.qcCV}%
            </div>
          )}
        </td>
        {/* Cal.cv */}
        <td className="py-4 px-2 text-center text-slate-650 font-mono">
          {isBatchEditing ? (
            <div className="flex items-center justify-center gap-0.5">
              <input
                type="number"
                step="any"
                value={param.calCV !== undefined ? param.calCV : ''}
                onChange={(e) => handleBatchFieldChange(param.id, 'calCV', e.target.value)}
                className="w-14 px-1 py-0.5 border border-gray-300 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono"
              />
              <span className="text-[10px] text-gray-500">%</span>
            </div>
          ) : inlineEdit?.id === param.id && inlineEdit?.field === 'calCV' ? (
            <div className="flex items-center justify-center gap-0.5">
              <input
                type="number"
                step="any"
                autoFocus
                value={inlineEdit.value}
                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                onBlur={() => handleInlineSave(param.id, 'calCV', inlineEdit.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineSave(param.id, 'calCV', inlineEdit.value);
                  if (e.key === 'Escape') setInlineEdit(null);
                }}
                className="w-14 px-1 py-0.5 border border-gray-400 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono"
              />
              <span className="text-[10px] text-gray-500">%</span>
            </div>
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: param.id, field: 'calCV', value: String(param.calCV) })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none"
              title="双击编辑"
            >
              {param.calCV}%
            </div>
          )}
        </td>
        {/* TEa */}
        <td className="py-4 px-2 text-center text-slate-650 font-mono">
          {isBatchEditing ? (
            <div className="flex items-center justify-center gap-0.5">
              <input
                type="number"
                step="any"
                value={param.tea !== undefined ? param.tea : ''}
                onChange={(e) => handleBatchFieldChange(param.id, 'tea', e.target.value)}
                className="w-14 px-1 py-0.5 border border-gray-300 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono"
              />
              <span className="text-[10px] text-gray-500">%</span>
            </div>
          ) : inlineEdit?.id === param.id && inlineEdit?.field === 'tea' ? (
            <div className="flex items-center justify-center gap-0.5">
              <input
                type="number"
                step="any"
                autoFocus
                value={inlineEdit.value}
                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                onBlur={() => handleInlineSave(param.id, 'tea', inlineEdit.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineSave(param.id, 'tea', inlineEdit.value);
                  if (e.key === 'Escape') setInlineEdit(null);
                }}
                className="w-14 px-1 py-0.5 border border-gray-405 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono"
              />
              <span className="text-[10px] text-gray-550">%</span>
            </div>
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: param.id, field: 'tea', value: String(param.tea) })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none"
              title="双击编辑"
            >
              {param.tea}%
            </div>
          )}
        </td>
        {/* K */}
        <td className="py-4 px-2 text-center text-slate-400 font-mono">
          {isBatchEditing ? (
            <input
              type="number"
              step="any"
              value={param.k !== undefined ? param.k : ''}
              onChange={(e) => handleBatchFieldChange(param.id, 'k', e.target.value)}
              className="w-12 px-1 py-0.5 border border-gray-300 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono"
            />
          ) : inlineEdit?.id === param.id && inlineEdit?.field === 'k' ? (
            <input
              type="number"
              step="any"
              autoFocus
              value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={() => handleInlineSave(param.id, 'k', inlineEdit.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSave(param.id, 'k', inlineEdit.value);
                if (e.key === 'Escape') setInlineEdit(null);
              }}
              className="w-12 px-1 py-0.5 border border-gray-400 rounded text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] font-mono"
            />
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: param.id, field: 'k', value: String(param.k) })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none"
              title="双击编辑"
            >
              {param.k}
            </div>
          )}
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
                ? 'bg-emerald-100 text-[#1B5E20]'
                : param.complianceStatus.includes('<')
                ? 'bg-[#FFF3E0] text-[#E65100]'
                : 'bg-rose-105 text-rose-800 animate-pulse'
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
              id={`btn-add-level-param-${param.id}`}
              onClick={() => handleQuickAddLevel(param)}
              title="快速增加新水平"
              className="p-1 px-1.5 text-[#5D6D5F] hover:text-white hover:bg-[#5D6D5F] border border-[#5D6D5F]/30 hover:border-transparent rounded-sm transition-all cursor-pointer text-[10px]"
            >
              增加
            </button>
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
  };

  // Calculate live preview for modal
  const getLivePreview = () => {
    if (!currentParam) return null;
    const selectedProj = projects.find((p) => p.id === currentParam.projectId);
    const resolvedUnit = selectedProj?.unit || 'pg/ml';
    const temp: Parameter = {
      id: 'temp',
      projectId: currentParam.projectId || '',
      unit: resolvedUnit,
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
      <div className="bg-[#F2EFE9] border border-black/5 p-5 rounded-sm space-y-3.5 shadow-2xs">
        <div 
          onClick={() => setIsGuideCollapsed(!isGuideCollapsed)} 
          className="flex items-center justify-between cursor-pointer select-none pb-0.5"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-[#5D6D5F] shrink-0" />
            <span className="font-serif font-bold text-slate-900 text-sm uppercase tracking-wider">
              不确定度合成评定说明与标准公式 (ISO 15189)
            </span>
          </div>
          <button
            type="button"
            className="p-1 hover:bg-black/5 rounded transition-all text-slate-600 focus:outline-none cursor-pointer"
            title={isGuideCollapsed ? "展开说明" : "折叠说明"}
          >
            {isGuideCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
        
        {!isGuideCollapsed && (
          <div className="text-xs text-slate-800 leading-relaxed pl-6">
            <ul className="list-disc list-inside space-y-1.5 text-slate-700 font-serif italic">
              <li><strong>校准品偏差平方 (Cal.cv²)：</strong> <code>{"Cal.cv * Cal.cv"}</code></li>
              <li><strong>室内质控不精密度平方 (QC.cv²)：</strong> <code>{"Qc.cv * Qc.cv"}</code></li>
              <li><strong>合成相对标准不确定度 (Uc)：</strong> <code>{"√ (Cal.cv² + QC.cv²)"}</code></li>
              <li><strong>扩展相对标准不确定度 (U)：</strong> <code>{"合成相对UC * K"} (通常采用 K = 2)</code></li>
              <li><strong>国际金标准评判级别：</strong> {"高度契合 (≤ 1/2 TEa)"} | {"合格/接收 (≤ 100% TEa)"} | {"未达标 (超过规定的允许偏差)"}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Action panel - Editorial Style */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-sm shadow-xs border border-black/5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
          当前共定义了 <span className="text-[#5D6D5F] text-lg font-mono font-bold mx-1">{parameters.length}</span> 项浓度水平参数模型
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {isBatchEditing ? (
            <>
              <button
                id="btn-cancel-param-batch"
                type="button"
                onClick={handleCancelBatchEdit}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
                取消
              </button>
              <button
                id="btn-save-param-batch"
                type="button"
                onClick={handleSaveBatchEdit}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-xs uppercase tracking-widest rounded-sm shadow-xs transition-colors cursor-pointer"
              >
                <Check className="h-4 w-4" />
                保存批量修改
              </button>
            </>
          ) : (
            <>
              <button
                id="btn-batch-add-param"
                type="button"
                onClick={handleOpenBatchAdd}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-[#5D6D5F]" />
                批量添加
              </button>
              <button
                id="btn-batch-edit-param"
                type="button"
                onClick={handleStartBatchEdit}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-300 font-medium text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 hover:scale-105 transition-all text-[#5D6D5F]" />
                批量编辑
              </button>
              <label
                id="btn-excel-import"
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-[#5D6D5F]" />
                Excel 导入
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelImport}
                  className="hidden"
                />
              </label>
              <button
                id="btn-add-param"
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-xs uppercase tracking-widest rounded-sm shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                配置项目参数浓度
              </button>
            </>
          )}
        </div>
      </div>

      {successTip && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs px-4 py-3 rounded-xs flex items-center justify-between shadow-xs animate-fade-in select-none">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#5D6D5F]" />
            <span className="font-medium">{successTip}</span>
          </div>
          <button onClick={() => setSuccessTip('')} className="text-emerald-500 hover:text-emerald-700 font-mono text-sm leading-none">&times;</button>
        </div>
      )}

      {!isBatchEditing && parameters.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-[#FAF9F6] px-4 py-2 border border-black/5 rounded-xs select-none">
          <span className="font-semibold text-[#5D6D5F]">💡 快速编辑提示:</span>
          <span>双击表格中【水平、日期范围、累积均值、Qc.cv、Cal.cv、TEa、K】的数据可以直接内分量单独微调。</span>
        </div>
      )}

      {isBatchEditing && (
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-700 bg-zinc-50 px-4 py-2 border border-zinc-200 rounded-xs animate-pulse select-none">
          <span className="font-semibold text-zinc-800">✍️ 批量编辑中:</span>
          <span>您可以直接修改下方列中各水平对应的输入框，修改完成后记得点击右上角「保存批量修改」保存您的内容！</span>
        </div>
      )}
      {projects.length > 0 && (
        <div className="bg-[#FAF9F6] p-4.5 rounded-sm border border-black/5 space-y-4 shadow-3xs animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Quick instruments filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mr-1">仪器快速筛选:</span>
              <button
                type="button"
                onClick={() => setSelectedInstrument(null)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                  selectedInstrument === null
                    ? 'bg-[#5D6D5F] text-white border-transparent shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                全部项目 ({parameters.length})
              </button>
              {uniqueInstruments.map((inst) => {
                const isSelected = selectedInstrument?.toLowerCase() === inst.toLowerCase();
                const label = inst;
                
                // Count filtered parameters for this instrument
                const count = parameters.filter((param) => {
                  const p = projects.find((pr) => pr.id === param.projectId);
                  return (p?.instrument || '').trim().toLowerCase() === inst.toLowerCase();
                }).length;

                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setSelectedInstrument(inst)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#5D6D5F] text-white border-transparent shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Group-by Display Toggles */}
            <div className="flex items-center gap-2.5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/50">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">显示模式:</span>
              <div className="flex bg-slate-200/55 p-0.5 rounded border border-black/5">
                <button
                  type="button"
                  onClick={() => setGroupByInstrument(false)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    !groupByInstrument
                      ? 'bg-white text-[#5D6D5F] shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  平铺列表
                </button>
                <button
                  type="button"
                  onClick={() => setGroupByInstrument(true)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    groupByInstrument
                      ? 'bg-white text-[#5D6D5F] shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  按仪器分组
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              {filteredCalculatedList.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-16 text-center text-gray-400 text-sm">
                    {selectedInstrument ? '该仪器下暂无配置任何检测项目浓度参数' : '暂未配置检测项目的水平参数，点击右上方“配置项目参数浓度”开始进行快速计算。'}
                  </td>
                </tr>
              ) : !groupByInstrument ? (
                filteredCalculatedList.map((param) => renderRow(param))
              ) : (
                Object.keys(groupedCalculatedList).map((instName) => {
                  const groupParams = groupedCalculatedList[instName];
                  if (groupParams.length === 0) return null;
                  const instMatch = dictInstruments.find((di) => di.code.toLowerCase() === instName.toLowerCase() || di.name.toLowerCase() === instName.toLowerCase());
                  const labelName = instMatch ? instMatch.name : instName;
                  return (
                    <React.Fragment key={instName}>
                      {/* Group Separator/Header Row Row */}
                      <tr className="bg-[#FAF9F6] border-y border-black/5 select-none my-1">
                        <td colSpan={17} className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-xs font-bold text-slate-800 bg-[#EFECE6] px-2.5 py-1 rounded border border-black/5 tracking-wider">
                              仪器代码/名称: {labelName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              (该仪器下包含 <span className="font-bold text-[#5D6D5F] font-mono">{groupParams.length}</span> 个浓度水平模型)
                            </span>
                          </div>
                        </td>
                      </tr>
                      {groupParams.map((param) => renderRow(param))}
                    </React.Fragment>
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

                  <div>
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

        {isBatchAdding && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-3xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden"
            >
              {/* Projects List Selection Panel (Left column - width 7/12) */}
              <div className="p-6 md:col-span-7 bg-[#FAF9F6] border-r border-gray-150 flex flex-col justify-between max-h-[580px]">
                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 font-serif">选择要添加的检测项目</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">仅列出未曾配置过任何浓度水平参数的项目</p>
                    </div>
                    {allowedProjects.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProjIds(allowedProjects.map(p => p.id))}
                          className="text-[10px] text-[#5D6D5F] hover:underline font-semibold cursor-pointer"
                        >
                          全选
                        </button>
                        <span className="text-gray-350 text-xs">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedProjIds([])}
                          className="text-[10px] text-slate-500 hover:underline font-semibold cursor-pointer"
                        >
                          全不选
                        </button>
                      </div>
                    )}
                  </div>

                  {allowedProjects.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs font-serif italic">
                      没有可配置的新检测项目（已配置浓度参数）。
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {allowedProjects.map((p) => {
                        const isChecked = selectedProjIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-3 p-3 rounded-md border text-xs cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'bg-[#5D6D5F]/5 border-[#5D6D5F]/35'
                                : 'bg-white border-gray-150 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedProjIds(selectedProjIds.filter(id => id !== p.id));
                                } else {
                                  setSelectedProjIds([...selectedProjIds, p.id]);
                                }
                              }}
                              className="mt-0.5 text-[#5D6D5F] focus:ring-[#5D6D5F] h-4 w-4 rounded border-gray-305 accent-[#5D6D5F]"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 font-mono text-xs">
                                {p.code}{p.instrument ? ` - ${p.instrument}` : ''}
                              </span>
                              <span className="text-[11px] text-gray-500 mt-0.5">
                                {p.name || '无项目名'}
                              </span>
                              {p.unit && (
                                <span className="inline-block self-start font-mono text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded-xs mt-1">
                                  单位: {p.unit}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 mt-4 text-[11px] text-slate-500">
                  已选择 <span className="text-[#5D6D5F] font-bold font-mono">{selectedProjIds.length}</span> / {allowedProjects.length} 个新项目
                </div>
              </div>

              {/* Configure Parameters Shared Panel (Right column - width 5/12) */}
              <div className="p-6 md:col-span-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-150">
                    <h3 className="text-sm font-bold text-gray-800 font-serif">配置批量参数模板</h3>
                    <button
                      type="button"
                      onClick={() => setIsBatchAdding(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {batchErrorMsg && (
                    <div className="p-3 mt-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium border border-rose-100">
                      {batchErrorMsg}
                    </div>
                  )}

                  <form id="batch-add-form" onSubmit={handleBatchAddSubmit} className="space-y-3.5 mt-4">
                    {/* Level Code */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1 font-serif">
                        水平代号 *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1"
                        value={batchLevel}
                        onChange={(e) => setBatchLevel(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] text-xs font-mono"
                      />
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1 font-serif">
                        日期范围 *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 20250101-20250630"
                        value={batchDateRange}
                        onChange={(e) => setBatchDateRange(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Mean value */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1 font-serif">
                          累积均值 *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={batchMean}
                          onChange={(e) => setBatchMean(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] text-xs font-mono"
                        />
                      </div>

                      {/* TEa value */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1 font-serif">
                          TEa 允许误差% *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={batchTea}
                          onChange={(e) => setBatchTea(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* QC.cv */}
                      <div>
                        <label className="block text-[10.5px] font-bold text-gray-700 uppercase tracking-wider mb-1 font-mono font-bold">
                          Qc.cv % *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={batchQcCV}
                          onChange={(e) => setBatchQcCV(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] text-xs font-mono"
                        />
                      </div>

                      {/* Cal.cv */}
                      <div>
                        <label className="block text-[10.5px] font-bold text-gray-700 uppercase tracking-wider mb-1 font-mono font-bold">
                          Cal.cv % *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={batchCalCV}
                          onChange={(e) => setBatchCalCV(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] text-xs font-mono"
                        />
                      </div>

                      {/* K coeff */}
                      <div>
                        <label className="block text-[10.5px] font-bold text-gray-700 uppercase tracking-wider mb-1 font-serif">
                          K 因子 *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={batchK}
                          onChange={(e) => setBatchK(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsBatchAdding(false)}
                        className="px-3.5 py-2 text-gray-600 hover:text-gray-850 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors cursor-pointer font-semibold"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={selectedProjIds.length === 0}
                        className="px-4 py-2 text-white bg-[#5D6D5F] hover:bg-[#4b5a4d] disabled:opacity-40 disabled:cursor-not-allowed rounded shadow-xs transition-colors cursor-pointer font-semibold"
                      >
                        确认批量添加
                      </button>
                    </div>
                  </form>
                </div>
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
