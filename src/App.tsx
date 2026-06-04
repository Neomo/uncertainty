/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Project, Parameter } from './types';
import { INITIAL_PROJECTS, INITIAL_PARAMETERS } from './utils/sampleData';
import ProjectList from './components/ProjectList';
import ParameterConfig from './components/ParameterConfig';
import ReportGenerator from './components/ReportGenerator';
import BackupData from './components/BackupData';
import { Activity, ShieldCheck, Database, FileSpreadsheet, Layers, Sliders, Info, HardDriveUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'parameters' | 'report' | 'backup'>('projects');

  // Load from LocalStorage on mount
  useEffect(() => {
    const storedProjects = localStorage.getItem('unc_projects');
    const storedParams = localStorage.getItem('unc_parameters');

    if (storedProjects) {
      try {
        setProjects(JSON.parse(storedProjects));
      } catch (err) {
        console.error('Failed to parse projects from storage:', err);
        setProjects(INITIAL_PROJECTS);
      }
    } else {
      setProjects(INITIAL_PROJECTS);
    }

    if (storedParams) {
      try {
        setParameters(JSON.parse(storedParams));
      } catch (err) {
        console.error('Failed to parse parameters from storage:', err);
        setParameters(INITIAL_PARAMETERS);
      }
    } else {
      setParameters(INITIAL_PARAMETERS);
    }
  }, []);

  // Sync back to localstorage on projects update
  const saveProjectsToStorage = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('unc_projects', JSON.stringify(updatedProjects));
  };

  // Sync back to localstorage on parameters update
  const saveParametersToStorage = (updatedParams: Parameter[]) => {
    setParameters(updatedParams);
    localStorage.setItem('unc_parameters', JSON.stringify(updatedParams));
  };

  // State actions: Project Create
  const handleAddProject = (newProj: Omit<Project, 'id'>) => {
    const id = `proj_${Date.now()}`;
    const payload: Project = { ...newProj, id };
    const newList = [...projects, payload];
    saveProjectsToStorage(newList);
  };

  // State actions: Project Update
  const handleUpdateProject = (updatedProj: Project) => {
    const newList = projects.map((p) => (p.id === updatedProj.id ? updatedProj : p));
    saveProjectsToStorage(newList);
  };

  // State actions: Project Delete (cascading deletes any levels attached to this project)
  const handleDeleteProject = (projectId: string) => {
    const newProjs = projects.filter((p) => p.id !== projectId);
    const newParams = parameters.filter((param) => param.projectId !== projectId);
    saveProjectsToStorage(newProjs);
    saveParametersToStorage(newParams);
  };

  // State actions: Parameter Create
  const handleAddParameter = (newParam: Omit<Parameter, 'id'>) => {
    const id = `param_${Date.now()}`;
    const payload: Parameter = { ...newParam, id };
    const newList = [...parameters, payload];
    saveParametersToStorage(newList);
  };

  // State actions: Parameter Update
  const handleUpdateParameter = (updatedParam: Parameter) => {
    const newList = parameters.map((p) => (p.id === updatedParam.id ? updatedParam : p));
    saveParametersToStorage(newList);
  };

  // State actions: Parameter Delete
  const handleDeleteParameter = (paramId: string) => {
    const newList = parameters.filter((p) => p.id !== paramId);
    saveParametersToStorage(newList);
  };

  // State actions: Backup import
  const handleImportData = (importedProjects: Project[], importedParameters: Parameter[]) => {
    saveProjectsToStorage(importedProjects);
    saveParametersToStorage(importedParameters);
  };

  // State actions: Restore database back to demo state
  const handleResetToSample = () => {
    saveProjectsToStorage(INITIAL_PROJECTS);
    saveParametersToStorage(INITIAL_PARAMETERS);
  };

  // State actions: Clear database
  const handleClearAll = () => {
    saveProjectsToStorage([]);
    saveParametersToStorage([]);
  };

  return (
    <div id="application-container" className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#5D6D5F]/20">
      
      {/* 🔬 Medical Header - Editorial Style */}
      <header className="bg-[#FAF9F6] border-b border-black/10 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#5D6D5F] rounded-full flex items-center justify-center text-white shadow-xs">
              <Activity className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-serif font-bold tracking-tight text-slate-900">
                  检测不确定度计算与报告生成器
                </h1>
                <span className="bg-[#5D6D5F] text-white text-[9px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-sm">
                  ISO 15189 系统
                </span>
              </div>
              <p className="text-xs text-slate-500 font-serif italic mt-0.5">
                医学实验室认可专用 · 精密度及偏差双向自动合成评判 · 合并汇总报告一键复制导出
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] text-slate-600 uppercase tracking-wider">
            <div className="bg-[#F2EFE9] px-3.5 py-1.5 border border-black/5 flex items-center gap-1.5 rounded-sm">
              <ShieldCheck className="h-4 w-4 text-[#5D6D5F]" />
              <span>数据安全：本地沙盒</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Navigation Tabs bar - Editorial Style */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-black/10 pb-2">
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.2em] font-semibold">
            {/* Tab 1: Projects */}
            <button
              id="tab-projects"
              onClick={() => setActiveTab('projects')}
              className={`pb-2.5 transition-all cursor-pointer border-b ${
                activeTab === 'projects'
                  ? 'text-[#5D6D5F] border-[#5D6D5F]'
                  : 'text-slate-400 border-transparent hover:text-slate-700'
              }`}
            >
              ① 项目配置
            </button>

            {/* Tab 2: Parameters */}
            <button
              id="tab-parameters"
              onClick={() => setActiveTab('parameters')}
              className={`pb-2.5 transition-all cursor-pointer border-b ${
                activeTab === 'parameters'
                  ? 'text-[#5D6D5F] border-[#5D6D5F]'
                  : 'text-slate-400 border-transparent hover:text-slate-700'
              }`}
            >
              ② 各种参数
            </button>

            {/* Tab 3: Report Generator */}
            <button
              id="tab-report"
              onClick={() => setActiveTab('report')}
              className={`pb-2.5 transition-all cursor-pointer border-b ${
                activeTab === 'report'
                  ? 'text-[#5D6D5F] border-[#5D6D5F]'
                  : 'text-slate-400 border-transparent hover:text-slate-700'
              }`}
            >
              ③ 报告生成页面
            </button>

            {/* Tab 4: Backup */}
            <button
              id="tab-backup"
              onClick={() => setActiveTab('backup')}
              className={`pb-2.5 transition-all cursor-pointer border-b ${
                activeTab === 'backup'
                  ? 'text-[#5D6D5F] border-[#5D6D5F]'
                  : 'text-slate-400 border-transparent hover:text-slate-700'
              }`}
            >
              ④ 备份与还原
            </button>
          </nav>

          <div className="flex items-center gap-2 px-3 py-1 bg-[#F2EFE9] border border-black/5 text-[10px] uppercase tracking-wider text-slate-600 font-mono font-bold">
            <Info className="h-3.5 w-3.5 text-[#5D6D5F]" />
            项目: {projects.length} / 配置: {parameters.length} 组
          </div>
        </div>

        {/* Selected Tab content container */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
              className="h-full"
            >
              {activeTab === 'projects' && (
                <ProjectList
                  projects={projects}
                  parameters={parameters}
                  onAddProject={handleAddProject}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                />
              )}

              {activeTab === 'parameters' && (
                <ParameterConfig
                  projects={projects}
                  parameters={parameters}
                  onAddParameter={handleAddParameter}
                  onUpdateParameter={handleUpdateParameter}
                  onDeleteParameter={handleDeleteParameter}
                />
              )}

              {activeTab === 'report' && (
                <ReportGenerator
                  projects={projects}
                  parameters={parameters}
                />
              )}

              {activeTab === 'backup' && (
                <BackupData
                  projects={projects}
                  parameters={parameters}
                  onImportData={handleImportData}
                  onResetToSample={handleResetToSample}
                  onClearAll={handleClearAll}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 🔬 Standard Footer */}
      <footer className="bg-white border-t border-black/5 mt-auto shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#5D6D5F]/85 gap-2">
          <span className="font-serif italic text-slate-800">© 2026 医学检验中心 · 不确定度快速分析系统 (V1.2)</span>
          <div className="flex items-center gap-3 uppercase tracking-wider text-[10px]">
            <span>支持：ISO 15189 / GB/T 22576 标准</span>
            <span className="opacity-20">|</span>
            <a href="#tab-backup" onClick={(e) => { e.preventDefault(); setActiveTab('backup'); }} className="hover:text-black hover:underline transition-all">
              配置备份管理
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
