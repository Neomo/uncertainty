/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Parameter, DictInstrument, DictProject, DictUnit } from '../types';
import { Plus, Edit2, Trash2, Search, X, Check, Eye, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectListProps {
  projects: Project[];
  parameters: Parameter[];
  onAddProject: (project: Omit<Project, 'id'> | Omit<Project, 'id'>[]) => void;
  onUpdateProject: (project: Project | Project[]) => void;
  onDeleteProject: (projectId: string) => void;
  dictInstruments: DictInstrument[];
  dictProjects: DictProject[];
  dictUnits: DictUnit[];
}

export default function ProjectList({
  projects,
  parameters,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  dictInstruments,
  dictProjects,
  dictUnits,
}: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; code: string; relatedCount: number } | null>(null);
  const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProjectCodes, setSelectedProjectCodes] = useState<string[]>([]);
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [batchProjects, setBatchProjects] = useState<Project[]>([]);
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: 'unit' | 'method' | 'interference' | 'traceability' | 'labLotTestId'; value: string } | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [groupByInstrument, setGroupByInstrument] = useState<boolean>(false);

  // Start batch edit mode
  const handleStartBatchEdit = () => {
    setBatchProjects(JSON.parse(JSON.stringify(projects)));
    setIsBatchEditing(true);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Cancel batch edit mode
  const handleCancelBatchEdit = () => {
    setIsBatchEditing(false);
    setBatchProjects([]);
  };

  // Change individual field inside batch edit array
  const handleBatchFieldChange = (
    projectId: string,
    field: 'unit' | 'method' | 'interference' | 'traceability' | 'labLotTestId',
    value: string
  ) => {
    setBatchProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, [field]: value } : p))
    );
  };

  // Save batch editing modifications
  const handleSaveBatchEdit = () => {
    onUpdateProject(batchProjects);
    setIsBatchEditing(false);
    setSuccessMessage('批量修改检测项目成功！');
  };

  // Save an individual inline cell on blur or Enter key
  const handleInlineSave = (
    projectId: string,
    field: 'unit' | 'method' | 'interference' | 'traceability' | 'labLotTestId',
    value: string
  ) => {
    const orig = projects.find((p) => p.id === projectId);
    if (orig && (orig[field] || '') !== value) {
      onUpdateProject({
        ...orig,
        [field]: value,
      });
      setSuccessMessage(`已更新项目 ${orig.code} 的${
        field === 'unit' ? '单位' :
        field === 'method' ? '检测方法' :
        field === 'interference' ? '干扰因素' :
        field === 'labLotTestId' ? 'LabLotTestID' : '校准品溯源性'
      }`);
    }
    setInlineEdit(null);
  };

  // Handle open modal for new project
  const handleOpenNew = () => {
    const defaultProjCode = dictProjects[0]?.code || '';
    setCurrentProject({
      code: defaultProjCode,
      name: dictProjects[0]?.name || '',
      instrument: dictInstruments[0]?.code || '',
      unit: dictUnits[0]?.code || '',
      method: '',
      interference: '',
      traceability: '',
      labLotTestId: '',
    });
    // Initialize checks list with first item by default
    setSelectedProjectCodes(defaultProjCode ? [defaultProjCode] : []);
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditing(true);
  };

  // Handle open modal for editing
  const handleOpenEdit = (project: Project) => {
    setCurrentProject(project);
    setSelectedProjectCodes([project.code]);
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditing(true);
  };

  // Handle change project selection from dictionary (for fallback/editing view if needed)
  const handleDictProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const match = dictProjects.find((dp) => dp.code === code);
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        code,
        name: match ? match.name : '',
      });
    }
  };

  // Unified save routine supporting closing vs staying open (continue adding)
  const handleSaveCommon = (isContinue: boolean) => {
    if (!currentProject) return;
    setErrorMessage('');
    setSuccessMessage('');

    const { instrument, unit, method, interference, traceability, labLotTestId } = currentProject;

    if (!instrument?.trim()) {
      setErrorMessage('请选择检测仪器');
      return;
    }
    if (!unit?.trim()) {
      setErrorMessage('请选择项目单位');
      return;
    }

    const testInstrument = instrument.trim();
    const isNew = !currentProject.id;

    if (isNew) {
      if (selectedProjectCodes.length === 0) {
        setErrorMessage('请至少勾选一个检测项目');
        return;
      }

      // Check combination duplicates for ALL checked codes
      const duplicatedCodes: string[] = [];
      const codesToAdd: string[] = [];

      selectedProjectCodes.forEach((code) => {
        const testCode = code.trim();
        const exists = projects.some(
          (p) => p.code.toLowerCase() === testCode.toLowerCase() && 
                 p.instrument.trim().toLowerCase() === testInstrument.toLowerCase()
        );
        if (exists) {
          duplicatedCodes.push(testCode);
        } else {
          codesToAdd.push(testCode);
        }
      });

      if (duplicatedCodes.length > 0 && codesToAdd.length === 0) {
        setErrorMessage(`所选项目 (${duplicatedCodes.join(', ')}) 与仪器 "${testInstrument}" 组合已存在，请勿重复添加`);
        return;
      }

      // Add multiple valid projects in one single batch call to prevent React state collision and ID duplicates
      const batchPayloads = codesToAdd.map((code) => {
        const match = dictProjects.find((dp) => dp.code === code);
        const testName = match ? match.name : '';
        return {
          code: code.toUpperCase(),
          name: testName,
          unit: unit.trim(),
          instrument: testInstrument,
          method: method?.trim() || '',
          interference: interference?.trim() || '',
          traceability: traceability?.trim() || '',
          labLotTestId: labLotTestId?.trim() || '',
        };
      });
      if (batchPayloads.length > 0) {
        onAddProject(batchPayloads);
      }

      const addedMsg = codesToAdd.length > 0 
        ? `成功登记项目: ${codesToAdd.join(', ')}` 
        : '';
      const dupMsg = duplicatedCodes.length > 0 
        ? `跳过已存在组合: ${duplicatedCodes.join(', ')}` 
        : '';

      if (isContinue) {
        // Clear checkbox selection so user can pick other projects
        setSelectedProjectCodes([]);
        
        if (addedMsg) {
          setSuccessMessage(addedMsg);
        }
        if (dupMsg) {
          setErrorMessage(dupMsg);
        }
      } else {
        setIsEditing(false);
        setCurrentProject(null);
        setSelectedProjectCodes([]);
      }
    } else {
      // Editing a single project
      const testCode = currentProject.code?.trim() || '';
      const testName = currentProject.name?.trim() || '';
      if (!testCode) {
        setErrorMessage('检测项目代码不能为空');
        return;
      }

      const exists = projects.some(
        (p) =>
          p.id !== currentProject.id &&
          p.code.toLowerCase() === testCode.toLowerCase() &&
          p.instrument.trim().toLowerCase() === testInstrument.toLowerCase()
      );
      if (exists) {
        setErrorMessage(`检测项目 "${testCode}" (仪器: "${testInstrument}") 被其他项目占用，请换个组合`);
        return;
      }

      onUpdateProject({
        id: currentProject.id!,
        code: testCode.toUpperCase(),
        name: testName,
        unit: unit.trim(),
        instrument: testInstrument,
        method: method?.trim() || '',
        interference: interference?.trim() || '',
        traceability: traceability?.trim() || '',
        labLotTestId: labLotTestId?.trim() || '',
      });

      if (isContinue) {
        setSuccessMessage('检测项目已成功更新');
      } else {
        setIsEditing(false);
        setCurrentProject(null);
        setSelectedProjectCodes([]);
      }
    }
  };

  // Primary save called by form submit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveCommon(false);
  };

  // Handle delete project of specific id (confirm recursive parameters delete)
  const handleDelete = (id: string, code: string) => {
    const relatedCount = parameters.filter((p) => p.projectId === id).length;
    setDeleteConfirm({ id, code, relatedCount });
  };

  // Get all unique instruments existing in the current project list
  const uniqueInstruments = Array.from(new Set(projects.map((p) => p.instrument?.trim()).filter(Boolean)));

  // Filter projects based on instrument selection first, then search query
  const filteredByInstrument = selectedInstrument
    ? projects.filter((p) => (p.instrument || '').trim().toLowerCase() === selectedInstrument.trim().toLowerCase())
    : projects;

  const filteredProjects = filteredByInstrument.filter(
    (p) =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouped projects mapping for group display mode
  const groupedProjects: { [instrument: string]: Project[] } = {};
  filteredProjects.forEach((p) => {
    const inst = (p.instrument || '').trim() || '未指定仪器';
    if (!groupedProjects[inst]) {
      groupedProjects[inst] = [];
    }
    groupedProjects[inst].push(p);
  });

  const renderRow = (project: Project, index: number) => {
    const relatedParams = parameters.filter((p) => p.projectId === project.id);
    const instDetails = dictInstruments.find((di) => di.code === project.instrument)?.name || project.instrument;
    
    // Get active object copy if batch-editing, otherwise use original
    const displayProj = isBatchEditing
      ? (batchProjects.find((bp) => bp.id === project.id) || project)
      : project;

    return (
      <tr
        key={project.id}
        className="hover:bg-[#FAF9F6] transition-colors group"
      >
        <td className="py-4 px-4 text-xs font-mono text-slate-400">
          {index + 1}
        </td>
        <td className="py-4 px-4 text-xs font-mono text-slate-700">
          {isBatchEditing ? (
            <input
              type="text"
              value={displayProj.labLotTestId || ''}
              onChange={(e) => handleBatchFieldChange(project.id, 'labLotTestId', e.target.value)}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F]"
            />
          ) : inlineEdit?.id === project.id && inlineEdit?.field === 'labLotTestId' ? (
            <input
              type="text"
              autoFocus
              value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={() => handleInlineSave(project.id, 'labLotTestId', inlineEdit.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSave(project.id, 'labLotTestId', inlineEdit.value);
                if (e.key === 'Escape') setInlineEdit(null);
              }}
              className="w-full px-2 py-1 border border-gray-350 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F]"
            />
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: project.id, field: 'labLotTestId', value: project.labLotTestId || '' })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none text-[#5D6D5F] font-bold"
              title="双击进行编辑"
            >
              {project.labLotTestId || <span className="text-gray-300 italic font-normal">-</span>}
            </div>
          )}
        </td>
        <td className="py-4 px-4 text-xs font-bold text-slate-800">
          <span className="bg-[#F2EFE9] text-slate-800 px-2 py-1 rounded-sm text-xs font-mono font-bold tracking-wide border border-black/5">
            {project.code}
          </span>
        </td>
        <td className="py-4 px-4 text-sm font-semibold text-slate-900 font-serif">
          {project.name}
        </td>
        
        {/* Column 1: Unit / 单位 */}
        <td className="py-4 px-4 text-xs font-mono text-slate-700 font-bold">
          {isBatchEditing ? (
            <select
              value={displayProj.unit || ''}
              onChange={(e) => handleBatchFieldChange(project.id, 'unit', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F]"
            >
              <option value="">--无--</option>
              {dictUnits.map((u) => (
                <option key={u.id} value={u.code}>
                  {u.code}
                </option>
              ))}
            </select>
          ) : inlineEdit?.id === project.id && inlineEdit?.field === 'unit' ? (
            <select
              autoFocus
              value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={() => handleInlineSave(project.id, 'unit', inlineEdit.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSave(project.id, 'unit', inlineEdit.value);
                if (e.key === 'Escape') setInlineEdit(null);
              }}
              className="px-2 py-1 border border-gray-350 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F]"
            >
              <option value="">--无--</option>
              {dictUnits.map((u) => (
                <option key={u.id} value={u.code}>
                  {u.code}
                </option>
              ))}
            </select>
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: project.id, field: 'unit', value: project.unit })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none"
              title="双击进行编辑"
            >
              {project.unit || <span className="text-gray-300 italic">- 双击输入 -</span>}
            </div>
          )}
        </td>

        <td className="py-4 px-4 text-xs text-slate-650">
          {instDetails || <span className="text-gray-300">-</span>}
        </td>

        {/* Column 2: Method / 检测方法 */}
        <td className="py-4 px-4 text-xs text-slate-600 font-bold">
          {isBatchEditing ? (
            <input
              type="text"
              value={displayProj.method || ''}
              onChange={(e) => handleBatchFieldChange(project.id, 'method', e.target.value)}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F]"
            />
          ) : inlineEdit?.id === project.id && inlineEdit?.field === 'method' ? (
            <input
              type="text"
              autoFocus
              value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={() => handleInlineSave(project.id, 'method', inlineEdit.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSave(project.id, 'method', inlineEdit.value);
                if (e.key === 'Escape') setInlineEdit(null);
              }}
              className="w-full px-2 py-1 border border-gray-350 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F]"
            />
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: project.id, field: 'method', value: project.method || '' })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none"
              title="双击进行编辑"
            >
              {project.method || <span className="text-gray-300 italic">- 双击输入 -</span>}
            </div>
          )}
        </td>

        {/* Column 3: Interference / 干扰因素 */}
        <td className="py-4 px-4 text-xs text-slate-500 max-w-[150px] truncate">
          {isBatchEditing ? (
            <input
              type="text"
              value={displayProj.interference || ''}
              onChange={(e) => handleBatchFieldChange(project.id, 'interference', e.target.value)}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F]"
            />
          ) : inlineEdit?.id === project.id && inlineEdit?.field === 'interference' ? (
            <input
              type="text"
              autoFocus
              value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={() => handleInlineSave(project.id, 'interference', inlineEdit.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSave(project.id, 'interference', inlineEdit.value);
                if (e.key === 'Escape') setInlineEdit(null);
              }}
              className="w-full px-2 py-1 border border-gray-350 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F]"
            />
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: project.id, field: 'interference', value: project.interference || '' })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none truncate"
              title={project.interference || '双击进行编辑'}
            >
              {project.interference || <span className="text-gray-300 italic">- 双击输入 -</span>}
            </div>
          )}
        </td>

        {/* Column 4: Traceability / 校准品溯源性 */}
        <td className="py-4 px-4 text-xs text-slate-500 max-w-[150px] truncate">
          {isBatchEditing ? (
            <input
              type="text"
              value={displayProj.traceability || ''}
              onChange={(e) => handleBatchFieldChange(project.id, 'traceability', e.target.value)}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F]"
            />
          ) : inlineEdit?.id === project.id && inlineEdit?.field === 'traceability' ? (
            <input
              type="text"
              autoFocus
              value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={() => handleInlineSave(project.id, 'traceability', inlineEdit.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSave(project.id, 'traceability', inlineEdit.value);
                if (e.key === 'Escape') setInlineEdit(null);
              }}
              className="w-full px-2 py-1 border border-gray-350 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#5D6D5F]"
            />
          ) : (
            <div
              onDoubleClick={() => setInlineEdit({ id: project.id, field: 'traceability', value: project.traceability || '' })}
              className="cursor-pointer hover:bg-slate-100 px-1 py-1 rounded border border-dashed border-transparent hover:border-gray-300 transition-all select-none truncate"
              title={project.traceability || '双击进行编辑'}
            >
              {project.traceability || <span className="text-gray-300 italic">- 双击输入 -</span>}
            </div>
          )}
        </td>
        <td className="py-4 px-4 text-right">
          <div className="flex items-center justify-end gap-1 px-1">
            <button
              id={`btn-edit-proj-${project.code}`}
              type="button"
              onClick={() => handleOpenEdit(project)}
              title="编辑项目"
              className="p-1 px-2 text-slate-600 hover:text-white hover:bg-[#5D6D5F] border border-black/10 rounded-sm transition-all cursor-pointer text-xs font-bold"
            >
              <Edit2 className="h-3 w-3 inline mr-1" />
              编辑
            </button>
            <button
              id={`btn-delete-proj-${project.code}`}
              type="button"
              onClick={() => handleDelete(project.id, project.code)}
              title="删除项目"
              className="p-1 px-2 text-rose-700 hover:text-white hover:bg-rose-800 border border-black/10 rounded-sm transition-all cursor-pointer text-xs font-bold"
            >
              <Trash2 className="h-3 w-3 inline mr-1" />
              删除
            </button>
          </div>
          {relatedParams.length > 0 && (
            <div className="text-[10px] text-[#5D6D5F]/80 mt-1 mr-1 pr-1 font-mono tracking-tighter">
              ({relatedParams.length} LEVEL CONFIGS)
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div id="project-list-container" className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-sm shadow-xs border border-black/5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            id="project-search-input"
            type="text"
            placeholder="搜索项目代码、名称、方法或检测仪器..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-black/10 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#5D6D5F] focus:border-[#5D6D5F] text-xs bg-[#FAF9F6]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-650"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isBatchEditing ? (
            <>
              <button
                id="btn-cancel-batch"
                type="button"
                onClick={handleCancelBatchEdit}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-205 text-slate-800 border border-slate-300 font-medium text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
                取消
              </button>
              <button
                id="btn-save-batch"
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
                id="btn-batch-edit"
                type="button"
                onClick={handleStartBatchEdit}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-300 font-medium text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                批量编辑
              </button>
              <button
                id="btn-add-project"
                type="button"
                onClick={handleOpenNew}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-xs uppercase tracking-widest rounded-sm shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                新增检测项目
              </button>
            </>
          )}
        </div>
      </div>

      {/* Instrument Quick Filters & Display Mode Controls */}
      {projects.length > 0 && (
        <div className="bg-white p-5 rounded-sm border border-black/5 space-y-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Quick instruments filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">仪器筛选:</span>
              <button
                type="button"
                onClick={() => setSelectedInstrument(null)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                  selectedInstrument === null
                    ? 'bg-[#5D6D5F] text-white border-transparent'
                    : 'bg-slate-105 text-slate-700 border-slate-200/60 hover:bg-slate-200'
                }`}
              >
                全部仪器
              </button>
              {uniqueInstruments.map((inst) => {
                const isSelected = selectedInstrument?.toLowerCase() === inst.toLowerCase();
                const count = projects.filter((p) => (p.instrument || '').trim().toLowerCase() === inst.toLowerCase()).length;
                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setSelectedInstrument(inst)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#5D6D5F] text-white border-transparent shadow-xs'
                        : 'bg-[#F2EFE9] text-[#5D6D5F] border-transparent hover:bg-slate-200'
                    }`}
                  >
                    <span>{inst}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#5D6D5F]/10 text-[#5D6D5F]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
              {selectedInstrument !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedInstrument(null)}
                  className="text-xs text-rose-700 hover:text-rose-900 border-b border-dashed border-rose-400 ml-1.5 cursor-pointer font-bold select-none"
                >
                  清除选中
                </button>
              )}
            </div>

            {/* Right: Display mode toggles */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">显示模式:</span>
              <div className="inline-flex rounded-sm bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setGroupByInstrument(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-all cursor-pointer ${
                    !groupByInstrument
                      ? 'bg-[#5D6D5F] text-white shadow-2xs'
                      : 'text-slate-650 hover:text-slate-850'
                  }`}
                >
                  默认列表
                </button>
                <button
                  type="button"
                  onClick={() => setGroupByInstrument(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-all cursor-pointer ${
                    groupByInstrument
                      ? 'bg-[#5D6D5F] text-white shadow-2xs'
                      : 'text-slate-650 hover:text-slate-850'
                  }`}
                >
                  按仪器分组
                </button>
              </div>
            </div>
          </div>
          
          {/* Active stats display */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 bg-[#FAF9F6] border-l-2 border-[#5D6D5F] px-3 py-2 rounded-r-xs select-none">
            <div>
              项目统计: <span className="text-[#5D6D5F] font-mono font-bold">已筛选出 {filteredProjects.length} 个检测项目</span> (总共 {projects.length} 个)
            </div>
            {selectedInstrument && (
              <div className="text-xs">
                当前高亮仪器: <span className="font-semibold text-slate-800">{selectedInstrument}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Result Information tip */}
      {!isBatchEditing && projects.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-[#FAF9F6] px-4 py-2 border border-black/5 rounded-xs select-none">
          <span className="font-semibold text-[#5D6D5F]">💡 快速编辑提示:</span>
          <span>双击表格中【单位、检测方法、干扰因素、校准品溯源性】的单元格即可直接对单项进行修改。</span>
        </div>
      )}
      {isBatchEditing && (
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-700 bg-zinc-50 px-4 py-2 border border-zinc-200 rounded-xs animate-pulse">
          <span className="font-semibold text-zinc-800">✍️ 批量编辑中:</span>
          <span>直接修改以下列表中对应项目的【单位、检测方法、干扰因素、校准品溯源性】，修改后记得点击右上角「保存批量修改」保存！</span>
        </div>
      )}

      {/* Projects Table & Cards */}
      <div className="bg-white rounded-sm shadow-xs overflow-hidden border border-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-black/10">
                <th className="py-4 px-4 text-[10px] font-bold text-[#5D6D5F] uppercase tracking-wider w-16 font-mono">
                  序号ID
                </th>
                <th className="py-4 px-4 text-[10px] font-bold text-[#5D6D5F] uppercase tracking-wider w-24">
                  LabLotTestID
                </th>
                <th className="py-4 px-4 text-[10px] font-bold text-[#5D6D5F] uppercase tracking-wider w-28">
                  检测项目（CODE）
                </th>
                <th className="py-4 px-4 text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
                  检测项目中文
                </th>
                <th className="py-4 px-4 text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
                  单位（CODE）
                </th>
                <th className="py-4 px-4 text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
                  检测仪器（仪器详情）
                </th>
                <th className="py-4 px-4 text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
                  检测方法
                </th>
                <th className="py-4 px-4 text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
                  干扰因素
                </th>
                <th className="py-4 px-4 text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
                  校准品溯源性
                </th>
                <th className="py-4 px-4 text-[10px] font-bold text-[#5D6D5F] uppercase tracking-wider text-right w-24">
                  操作 ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400 text-xs font-serif italic">
                    {searchTerm ? '没有找到匹配的检测项目' : '暂无检测项目，请点击上方“新增检测项目”按钮添加。'}
                  </td>
                </tr>
              ) : !groupByInstrument ? (
                filteredProjects.map((project, index) => renderRow(project, index))
              ) : (
                Object.keys(groupedProjects).map((instName) => {
                  const groupProjs = groupedProjects[instName];
                  const instMatch = dictInstruments.find((di) => di.code === instName);
                  const label = instMatch ? `${instName} - ${instMatch.name}` : instName;
                  return (
                    <React.Fragment key={instName}>
                      {/* Section Header Row */}
                      <tr className="bg-slate-100/75 border-y border-black/5 select-none font-semibold">
                        <td colSpan={10} className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#5D6D5F] bg-[#FAF9F6] px-2.5 py-1 rounded border border-[#5D6D5F]/15">
                              仪器: {label}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              (该仪器共 <span className="font-semibold text-[#5D6D5F] font-mono">{groupProjs.length}</span> 个检测项目)
                            </span>
                          </div>
                        </td>
                      </tr>
                      {groupProjs.map((project, index) => renderRow(project, index))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Form Overlay/Modal */}
      <AnimatePresence>
        {isEditing && currentProject && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-base font-bold text-gray-800">
                  {currentProject.id ? '编辑检测项目' : '新增检测项目'}
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium border border-rose-100">
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
                    {successMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column: Instrument and Unit */}
                  <div className="space-y-4">
                    {/* Detector Instrument selector dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        检测仪器 *
                      </label>
                      <select
                        id="input-project-instrument"
                        required
                        value={currentProject.instrument || ''}
                        onChange={(e) =>
                          setCurrentProject({ ...currentProject, instrument: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D6D5F] text-sm bg-gray-50/50"
                      >
                        {dictInstruments.length === 0 ? (
                          <option value="">-- 请先在字典页面登记仪器 --</option>
                        ) : (
                          dictInstruments.map((inst) => (
                            <option key={inst.id} value={inst.code}>
                              {inst.code} ({inst.name})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Unit Selector dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        项目单位 *
                      </label>
                      <select
                        id="input-project-unit"
                        required
                        value={currentProject.unit || ''}
                        onChange={(e) =>
                          setCurrentProject({ ...currentProject, unit: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D6D5F] text-sm bg-gray-50/50"
                      >
                        {dictUnits.length === 0 ? (
                          <option value="">-- 请先在字典页面登记单位 --</option>
                        ) : (
                          dictUnits.map((u) => (
                            <option key={u.id} value={u.code}>
                              {u.code} {u.description ? `(${u.description})` : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* LabLotTestID field */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        LabLotTestID (选填)
                      </label>
                      <input
                        id="input-project-lablottestid"
                        type="text"
                        placeholder="例如: 23942"
                        value={currentProject.labLotTestId || ''}
                        onChange={(e) =>
                          setCurrentProject({ ...currentProject, labLotTestId: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D6D5F] text-sm bg-gray-50/50 font-mono"
                      />
                    </div>
                  </div>

                  {/* Right Column: Project checkboxes or Single select */}
                  <div className="flex flex-col h-full justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex justify-between items-center">
                      <span>检测项目 *</span>
                      {!currentProject.id && dictProjects.length > 0 && (
                        <div className="flex gap-2 text-[10px] text-[#5D6D5F]">
                          <button
                            type="button"
                            onClick={() => setSelectedProjectCodes(dictProjects.map((p) => p.code))}
                            className="hover:underline cursor-pointer font-semibold"
                          >
                            全选
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedProjectCodes([])}
                            className="hover:underline cursor-pointer font-semibold"
                          >
                            清空
                          </button>
                        </div>
                      )}
                    </label>

                    {!currentProject.id ? (
                      /* Multi-select Checkbox Area for New Project */
                      <div className="border border-gray-200 rounded-lg p-3 bg-gray-55/50 max-h-[135px] overflow-y-auto space-y-1.5 shadow-inner flex-1 bg-white">
                        {dictProjects.length === 0 ? (
                          <div className="text-slate-400 text-xs italic py-4 text-center">
                            -- 请先在字典页面登记项目 --
                          </div>
                        ) : (
                          dictProjects.map((proj) => {
                            const isChecked = selectedProjectCodes.includes(proj.code);
                            return (
                              <label
                                key={proj.id}
                                className="flex items-center gap-2 text-xs text-slate-700 font-sans cursor-pointer hover:bg-[#5D6D5F]/5 py-0.5 px-1 rounded-xs select-none transition-all"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedProjectCodes(selectedProjectCodes.filter((c) => c !== proj.code));
                                    } else {
                                      setSelectedProjectCodes([...selectedProjectCodes, proj.code]);
                                    }
                                  }}
                                  className="rounded border-gray-300 text-[#5D6D5F] focus:ring-[#5D6D5F] h-3.5 w-3.5 cursor-pointer accent-[#5D6D5F]"
                                />
                                <span className="font-mono font-bold text-slate-800 bg-[#F2EFE9] border border-black/5 px-1 rounded-sm text-[10px]">
                                  {proj.code}
                                </span>
                                <span className="text-slate-500 truncate text-[11px]" title={proj.name}>
                                  {proj.name}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    ) : (
                      /* Single select / display for Editing Project */
                      <select
                        id="input-project-code"
                        disabled
                        required
                        value={currentProject.code || ''}
                        className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                      >
                        <option value={currentProject.code}>
                          {currentProject.code} ({currentProject.name})
                        </option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Detect Method */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      检测方法
                    </label>
                    <input
                      id="input-project-method"
                      type="text"
                      placeholder="e.g. 化学发光免疫分析"
                      value={currentProject.method || ''}
                      onChange={(e) =>
                        setCurrentProject({ ...currentProject, method: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D6D5F] text-sm bg-gray-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Interference Factors */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        干扰因素
                      </label>
                      <input
                        id="input-project-interference"
                        type="text"
                        placeholder="e.g. 严重溶血标本"
                        value={currentProject.interference || ''}
                        onChange={(e) =>
                          setCurrentProject({ ...currentProject, interference: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D6D5F] text-sm bg-gray-50/50"
                      />
                    </div>

                    {/* Calibrator Traceability */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        校准品溯源性
                      </label>
                      <input
                        id="input-project-traceability"
                        type="text"
                        placeholder="e.g. ERM-DA470k/I"
                        value={currentProject.traceability || ''}
                        onChange={(e) =>
                          setCurrentProject({ ...currentProject, traceability: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D6D5F] text-sm bg-gray-50/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-650 hover:text-slate-800 bg-gray-50 border border-gray-200 rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    取消
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCommon(true)}
                    className="px-4 py-2 bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer font-serif"
                  >
                    继续添加
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white text-xs font-semibold uppercase tracking-widest rounded-sm shadow-xs transition-colors cursor-pointer"
                  >
                    保存
                  </button>
                </div>
              </form>
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
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-[#5D6D5F]" />
                <div className="text-xs">
                  <p className="font-serif font-bold text-slate-900 mb-1.5 leading-normal uppercase tracking-wider text-[11px]">
                    确认删除检测项目?
                  </p>
                  <p className="text-slate-650 font-serif italic mb-2">
                    该操作将删除：<span className="font-bold text-slate-900 font-mono">{deleteConfirm.code}</span>
                  </p>
                  {deleteConfirm.relatedCount > 0 && (
                    <p className="text-rose-800 font-bold font-serif tracking-tight mt-1 bg-rose-50 p-2 border border-rose-100">
                      警告：此操作将连同删除该项目关联的 {deleteConfirm.relatedCount} 个浓度水平参数！且该操作不可撤销。
                    </p>
                  )}
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
                    onDeleteProject(deleteConfirm.id);
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
