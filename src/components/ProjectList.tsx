/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Parameter } from '../types';
import { Plus, Edit2, Trash2, Search, X, Check, Eye, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectListProps {
  projects: Project[];
  parameters: Parameter[];
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function ProjectList({
  projects,
  parameters,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; code: string; relatedCount: number } | null>(null);
  const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle open modal for new project
  const handleOpenNew = () => {
    setCurrentProject({
      code: '',
      name: '',
      instrument: '',
      method: '',
      interference: '',
      traceability: '',
    });
    setErrorMessage('');
    setIsEditing(true);
  };

  // Handle open modal for editing
  const handleOpenEdit = (project: Project) => {
    setCurrentProject(project);
    setErrorMessage('');
    setIsEditing(true);
  };

  // Save project edit/create
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    const { code, name, instrument, method, interference, traceability } = currentProject;

    if (!code?.trim() || !name?.trim()) {
      setErrorMessage('检测项目代码和中文名称为必填项');
      return;
    }

    // Check if code + instrument already exists for a new project
    const isNew = !currentProject.id;
    const testInstrument = instrument?.trim() || '';
    if (isNew) {
      const exists = projects.some(
        (p) => p.code.toLowerCase() === code.trim().toLowerCase() && 
               p.instrument.trim().toLowerCase() === testInstrument.toLowerCase()
      );
      if (exists) {
        setErrorMessage(`检测项目 "${code.trim()}" (仪器: "${testInstrument || '无'}") 已存在，请使用唯一项目-仪器组合`);
        return;
      }
      onAddProject({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        instrument: testInstrument,
        method: method?.trim() || '',
        interference: interference?.trim() || '',
        traceability: traceability?.trim() || '',
      });
    } else {
      // Check if code + instrument was updated to match another project
      const exists = projects.some(
        (p) =>
          p.id !== currentProject.id &&
          p.code.toLowerCase() === code.trim().toLowerCase() &&
          p.instrument.trim().toLowerCase() === testInstrument.toLowerCase()
      );
      if (exists) {
        setErrorMessage(`检测项目 "${code.trim()}" (仪器: "${testInstrument || '无'}") 被其他项目占用，请换个组合`);
        return;
      }
      onUpdateProject({
        id: currentProject.id!,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        instrument: instrument?.trim() || '',
        method: method?.trim() || '',
        interference: interference?.trim() || '',
        traceability: traceability?.trim() || '',
      });
    }

    setIsEditing(false);
    setCurrentProject(null);
  };

  // Handle delete project of specific id (confirm recursive parameters delete)
  const handleDelete = (id: string, code: string) => {
    const relatedCount = parameters.filter((p) => p.projectId === id).length;
    setDeleteConfirm({ id, code, relatedCount });
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter(
    (p) =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <button
          id="btn-add-project"
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-medium text-xs uppercase tracking-widest rounded-sm shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          新增检测项目
        </button>
      </div>

      {/* Projects Table & Cards */}
      <div className="bg-white rounded-sm shadow-xs overflow-hidden border border-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-black/10">
                <th className="py-4 px-4 text-[10px] font-bold text-[#5D6D5F] uppercase tracking-wider w-16 font-mono">
                  No.
                </th>
                <th className="py-4 px-4 text-[10px] font-bold text-[#5D6D5F] uppercase tracking-wider w-28">
                  代码 (CODE)
                </th>
                <th className="py-4 px-4 text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
                  检测项目中文名称
                </th>
                <th className="py-4 px-4 text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
                  检测仪器
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
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-xs font-serif italic">
                    {searchTerm ? '没有找到匹配的检测项目' : '暂无检测项目，请点击上方“新增检测项目”按钮添加。'}
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project, index) => {
                  const relatedParams = parameters.filter((p) => p.projectId === project.id);
                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-[#FAF9F6] transition-colors group"
                    >
                      <td className="py-4 px-4 text-xs font-mono text-slate-400">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-slate-800">
                        <span className="bg-[#F2EFE9] text-slate-800 px-2 py-1 rounded-sm text-xs font-mono font-bold tracking-wide border border-black/5">
                          {project.code}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-slate-900 font-serif">
                        {project.name}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {project.instrument || <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {project.method || <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 max-w-[150px] truncate" title={project.interference}>
                        {project.interference || <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 max-w-[150px] truncate" title={project.traceability}>
                        {project.traceability || <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 px-1">
                          <button
                            id={`btn-edit-proj-${project.code}`}
                            onClick={() => handleOpenEdit(project)}
                            title="编辑项目"
                            className="p-1 px-2 text-slate-600 hover:text-white hover:bg-[#5D6D5F] border border-black/10 rounded-sm transition-all cursor-pointer text-xs"
                          >
                            <Edit2 className="h-3 w-3 inline mr-1" />
                            编辑
                          </button>
                          <button
                            id={`btn-delete-proj-${project.code}`}
                            onClick={() => handleDelete(project.id, project.code)}
                            title="删除项目"
                            className="p-1 px-2 text-rose-700 hover:text-white hover:bg-rose-800 border border-black/10 rounded-sm transition-all cursor-pointer text-xs"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Project Code */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      检测项目简称 (如 FT3, FT4) *
                    </label>
                    <input
                      id="input-project-code"
                      type="text"
                      required
                      placeholder="e.g. FT3"
                      value={currentProject.code || ''}
                      onChange={(e) =>
                        setCurrentProject({ ...currentProject, code: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 uppercase"
                    />
                  </div>

                  {/* Project Chinese Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      检测项目中文 *
                    </label>
                    <input
                      id="input-project-name"
                      type="text"
                      required
                      placeholder="e.g. 游离三碘甲状腺原氨酸"
                      value={currentProject.name || ''}
                      onChange={(e) =>
                        setCurrentProject({ ...currentProject, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Detector Instrument */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      检测仪器
                    </label>
                    <input
                      id="input-project-instrument"
                      type="text"
                      placeholder="e.g. SIEMENSBN II"
                      value={currentProject.instrument || ''}
                      onChange={(e) =>
                        setCurrentProject({ ...currentProject, instrument: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50"
                    />
                  </div>

                  {/* Detect Method */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Interference Factors */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50"
                    />
                  </div>

                  {/* Calibrator Traceability */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50"
                    />
                  </div>
                </div>

                {/* Form Actions */}
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
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
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
