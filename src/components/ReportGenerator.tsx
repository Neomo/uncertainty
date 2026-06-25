/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Project, Parameter, CalculatedParameter, DictInstrument } from '../types';
import { calculateParameter } from '../utils/calculations';
import { Download, Copy, Printer, Check, ListChecks, FileSpreadsheet } from 'lucide-react';
import { motion } from 'motion/react';

interface ReportGeneratorProps {
  projects: Project[];
  parameters: Parameter[];
  dictInstruments?: DictInstrument[];
}

export default function ReportGenerator({ projects, parameters, dictInstruments }: ReportGeneratorProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Helper to translate instrument code to dict label (detail description)
  const getInstrumentLabel = (instCode: string): string => {
    if (!instCode) return '-';
    const found = dictInstruments?.find(
      (di) => di.code.trim().toLowerCase() === instCode.trim().toLowerCase()
    );
    return found ? found.name : instCode;
  };

  // Sort projects by project.code & instrument
  const sortedProjects = React.useMemo(() => {
    return [...projects].sort((a, b) => {
      const codeA = (a.code || '').trim().toUpperCase();
      const codeB = (b.code || '').trim().toUpperCase();
      const codeCompare = codeA.localeCompare(codeB, 'zh-CN');
      if (codeCompare !== 0) return codeCompare;
      
      const instA = (a.instrument || '').trim().toUpperCase();
      const instB = (b.instrument || '').trim().toUpperCase();
      return instA.localeCompare(instB, 'zh-CN');
    });
  }, [projects]);

  // Pre-calculate rowSpan mapping of project.id -> span value (0 means skip rendering)
  const rowSpans = React.useMemo(() => {
    const spans: { [key: string]: number } = {};
    for (let i = 0; i < sortedProjects.length; ) {
      const currentCode = (sortedProjects[i].code || '').trim().toUpperCase();
      let count = 1;
      let j = i + 1;
      while (j < sortedProjects.length && (sortedProjects[j].code || '').trim().toUpperCase() === currentCode) {
        count++;
        j++;
      }
      spans[sortedProjects[i].id] = count;
      for (let k = i + 1; k < j; k++) {
        spans[sortedProjects[k].id] = 0;
      }
      i = j;
    }
    return spans;
  }, [sortedProjects]);

  // Helper to get parameters grouped and calculated for a project
  const getProjectLevels = (projectId: string): CalculatedParameter[] => {
    const proj = projects.find((p) => p.id === projectId);
    return parameters
      .filter((p) => p.projectId === projectId)
      .map((p) => {
        const calc = calculateParameter(p);
        if (proj) {
          calc.unit = proj.unit;
        }
        return calc;
      })
      .sort((a, b) => {
        // Sort numerically if possible
        const levelA = Number(a.level);
        const levelB = Number(b.level);
        if (!isNaN(levelA) && !isNaN(levelB)) return levelA - levelB;
        return a.level.localeCompare(b.level);
      });
  };

  // 1. Render column 7: 实验室长期不精密度 (CV%)
  const renderLabImprecision = (levels: CalculatedParameter[]): React.ReactNode => {
    if (levels.length === 0) return '未配置参数';
    
    // Group date ranges. Usually they are identical (e.g. 20250101-20250630)
    const dates = Array.from(new Set(levels.map((l) => l.dateRange)));
    const dateStr = dates.join(', ');

    return (
      <div className="text-left font-sans text-xs space-y-1.5 whitespace-pre-line leading-relaxed">
        <div className="font-semibold text-slate-800">室内质控日期：{dateStr}</div>
        <div className="text-slate-600 mt-1 pl-1 border-l-2 border-slate-200">
          <div className="font-medium text-slate-700">质控数据：</div>
          {levels.map((level, i) => (
            <div key={level.id} className="font-mono text-gray-700 ml-1.5">
              {level.mean} {level.unit}
              <span className="text-slate-500 font-sans text-[11px] ml-2">CV%：</span>
              <span className="font-semibold text-slate-900">{level.qcCV}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 2. Render column 8: 不确定度计算 (相对 / 扩展)
  const renderUncertaintyCalc = (levels: CalculatedParameter[]): React.ReactNode => {
    if (levels.length === 0) return '未配置参数';

    // Get K coeff (can differ or be the same, usually same. We display the first K)
    const kVal = levels[0]?.k || 2;

    return (
      <div className="text-left font-sans text-xs space-y-2 whitespace-pre-line leading-relaxed">
        <div>
          <div className="font-semibold text-slate-800">相对合成不确定度:</div>
          {levels.map((level) => (
            <div key={level.id} className="font-mono text-[#5D6D5F] font-bold ml-1.5">
              Uc = {level.combinedUC}%
            </div>
          ))}
        </div>
        <div className="mt-1">
          <div className="font-semibold text-[#3c473e] font-bold">扩展合成不确定度 (k={kVal}):</div>
          {levels.map((level) => (
            <div key={level.id} className="font-mono text-slate-950 font-black ml-1.5">
              U = {level.expandedUC}%
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. Render column 9: 不确定度报告 (verbal report)
  const renderUncertaintyReport = (levels: CalculatedParameter[]): React.ReactNode => {
    if (levels.length === 0) return '未配置参数';

    return (
      <div className="text-left font-sans text-xs text-slate-700 space-y-1.5 whitespace-pre-line leading-relaxed">
        {levels.map((level, i) => {
          const isLast = i === levels.length - 1;
          return (
            <div key={level.id} className="pl-1">
              在 {level.mean} {level.unit} 水平处，相对不确定度为{' '}
              <span className="font-semibold text-slate-950 font-mono">{level.expandedUC}%</span>
              {isLast ? '。' : '；'}
            </div>
          );
        })}
      </div>
    );
  };

  // 4. Render column 10: 不确定度合格评判
  const renderComplianceEvaluation = (levels: CalculatedParameter[]): React.ReactNode => {
    if (levels.length === 0) return '未配置参数';

    // Extract TEas. Show unique tea percentages. E.g. "TEa=25%"
    const teas = Array.from(new Set(levels.map((l) => l.tea)));
    const teaStr = teas.map((t) => `TEa=${t}%`).join(', ');

    return (
      <div className="text-left font-sans text-xs space-y-1.5 whitespace-pre-line leading-relaxed">
        <div className="font-bold text-slate-800 bg-[#F2EFE9] border border-black/5 px-2 py-0.5 rounded-sm inline-block text-[10px]">
          {teaStr}
        </div>
        <div className="space-y-1 mt-1 pl-1 text-[11px]">
          {levels.map((level, i) => {
            const isLast = i === levels.length - 1;
            const isOk = level.evaluation === '达到要求';
            return (
              <div key={level.id} className="text-slate-750 font-serif">
                <span className="font-mono">{level.mean} {level.unit}</span>，
                扩展: <span className="font-mono text-slate-900 font-semibold">{level.expandedUC}%</span>{' '}
                <span className="font-mono font-medium">{level.complianceStatus}</span> ,{' '}
                <span className={`font-semibold ${isOk ? 'text-[#3c473e] font-sans' : 'text-rose-800 font-sans'}`}>
                  {level.evaluation}
                </span>
                {isLast ? '。' : '；'}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Clipboard copy function for copying table and pasting cleanly into Excel
  const handleCopyToClipboard = async () => {
    if (!tableRef.current) return;
    try {
      // Create a temporary element to copy HTML
      const tableHtml = tableRef.current.outerHTML;
      const blob = new Blob([tableHtml], { type: 'text/html' });
      const plainText = new Blob([tableRef.current.innerText], { type: 'text/plain' });
      
      const data = [new ClipboardItem({
        'text/html': blob,
        'text/plain': plainText
      })];
      
      await navigator.clipboard.write(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard error:', err);
      // Fallback
      try {
        const textRange = document.createRange();
        textRange.selectNode(tableRef.current);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(textRange);
        document.execCommand('copy');
        window.getSelection()?.removeAllRanges();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        alert('您的浏览器不支持直接复制表格，请重试或直接导出文件。');
      }
    }
  };

  // Convert table data to standard downloadable CSV format with UTF-8 BOM to satisfy Excel requirements
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    
    // Header
    const headers = [
      '序号ID',
      '检测项目中文',
      '检测项目',
      '检测仪器',
      '检测方法',
      '干扰因素',
      '校准品溯源性',
      '实验室长期不精密度(CV%)',
      '不确定度计算',
      '不确定度报告',
      '不确定度合格评判'
    ];
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

    // Body
    sortedProjects.forEach((proj, idx) => {
      const levels = getProjectLevels(proj.id);
      
      // Compute raw text representations for CSV
      let imprecisionText = '';
      if (levels.length > 0) {
        const dates = Array.from(new Set(levels.map((l) => l.dateRange))).join(', ');
        imprecisionText = `室内质控日期：${dates}\n质控数据：\n` + 
          levels.map(l => `${l.mean} ${l.unit} (CV%:${l.qcCV})`).join('\n');
      }

      let calculationText = '';
      if (levels.length > 0) {
        const kVal = levels[0]?.k || 2;
        calculationText = '相对合成不确定度：\n' + levels.map(l => `Uc=${l.combinedUC}%`).join('\n') + 
          `\n扩展合成不确定度（k=${kVal}）：\n` + levels.map(l => `Uc=${l.expandedUC}%`).join('\n');
      }

      let reportText = '';
      if (levels.length > 0) {
        reportText = levels.map((l, i) => `在 ${l.mean} ${l.unit} 水平处，相对不确定度为 ${l.expandedUC}%${i === levels.length - 1 ? '。' : '；'}`).join('\n');
      }

      let evalText = '';
      if (levels.length > 0) {
        const teas = Array.from(new Set(levels.map((l) => l.tea))).map(t => `TEa=${t}%`).join(', ');
        evalText = `${teas}\n` + levels.map((l, i) => `${l.mean} ${l.unit}，${l.expandedUC}% ${l.complianceStatus} , ${l.evaluation}${i === levels.length - 1 ? '。' : '；'}`).join('\n');
      }

      const row = [
        String(idx + 1),
        proj.name,
        proj.code,
        getInstrumentLabel(proj.instrument),
        proj.method,
        proj.interference,
        proj.traceability,
        imprecisionText,
        calculationText,
        reportText,
        evalText
      ];

      csvContent += row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `检测项目不确定度生成汇总表_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="report-generator-container" className="space-y-6">
      {/* Report Info Bar - Editorial aesthetic */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-sm shadow-xs border border-black/5">
        <div>
          <h2 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <ListChecks className="h-5 w-5 text-[#5D6D5F]" />
            医学实验室项目临床不确定度汇总评定报告
          </h2>
          <p className="text-xs text-slate-500 font-serif italic mt-1 leading-relaxed">
            数据自动并轨合并，生成符合 CNAS-CL02/ISO 15189 国际校准标准的质量管理报告。可便捷复制到 Excel/Word 执行粘贴。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Print button - Editorial and neat */}
          <button
            onClick={handlePrint}
            title="点击启动打印配置"
            className="flex items-center gap-1.5 px-4 py-2.5 border border-black/15 hover:border-black/35 hover:bg-[#FAF9F6] text-slate-700 rounded-sm text-xs font-semibold uppercase tracking-widest cursor-pointer transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            打印报告
          </button>

          {/* Copy Table to Excel helper */}
          <button
            id="btn-copy-table"
            onClick={handleCopyToClipboard}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-sm shadow-xs cursor-pointer transition-all ${
              copied
                ? 'bg-[#FAF9F6] border border-[#5D6D5F] text-[#3c473e]'
                : 'bg-white border border-black/15 hover:border-[#5D6D5F] hover:text-[#5D6D5F] text-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                已复制 HTML 表格
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                复制表格
              </>
            )}
          </button>

          {/* Export to external spreadsheet */}
          <button
            id="btn-export-excel"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#5D6D5F] hover:bg-[#4b5a4d] text-white font-semibold uppercase tracking-widest text-xs rounded-sm shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            导出 EXCEL/CSV
          </button>
        </div>
      </div>

      {/* Main Consolidated Report Table */}
      <div id="print-report-area" className="bg-white rounded-sm shadow-xs border border-black/5 overflow-hidden printable-shadow min-h-[300px]">
        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className="w-full text-xs font-sans text-left border-collapse border border-black/[0.05]"
          >
            <thead>
              <tr className="bg-[#FAF9F6] font-serif font-black text-slate-800 border-b border-black/10 text-[11px] uppercase tracking-wide">
                <th className="py-4 px-3 text-center border-r border-black/[0.05] w-12" style={{ border: '1px solid #e1e5e9' }}>序号</th>
                <th className="py-4 px-3 border-r border-black/[0.05] w-32" style={{ border: '1px solid #e1e5e9' }}>检验项目</th>
                <th className="py-4 px-3 border-r border-black/[0.05] w-28" style={{ border: '1px solid #e1e5e9' }}>检验仪器</th>
                <th className="py-4 px-3 border-r border-black/[0.05] w-28" style={{ border: '1px solid #e1e5e9' }}>检验方法</th>
                <th className="py-4 px-3 border-r border-black/[0.05] w-24" style={{ border: '1px solid #e1e5e9' }}>干扰因素</th>
                <th className="py-4 px-3 border-r border-black/[0.05] w-28" style={{ border: '1px solid #e1e5e9' }}>校准溯源</th>
                <th className="py-4 px-4 border-r border-black/[0.05] w-52" style={{ border: '1px solid #e1e5e9' }}>实验室长期不精密度（CV%）</th>
                <th className="py-4 px-4 border-r border-black/[0.05] w-48" style={{ border: '1px solid #e1e5e9' }}>计算规则</th>
                <th className="py-4 px-4 border-r border-black/[0.05] w-56" style={{ border: '1px solid #e1e5e9' }}>不确定度报告</th>
                <th className="py-4 px-4 w-60" style={{ border: '1px solid #e1e5e9' }}>合格等级评判</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] font-normal">
              {sortedProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-gray-400 text-sm">
                    暂无检测项目！请在“检测项目信息”及“检测项目参数”页面配置数据。
                  </td>
                </tr>
              ) : (
                sortedProjects.map((project, idx) => {
                  const levels = getProjectLevels(project.id);
                  const rowSpanVal = rowSpans[project.id] ?? 1;
                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50/20 transition-colors"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      {/* Serial */}
                      <td className="py-4 px-2 text-center font-bold text-slate-800" style={{ border: '1px solid #e1e5e9' }}>
                        {idx + 1}
                      </td>

                      {/* Info Chinese name */}
                      {rowSpanVal !== 0 && (
                        <td
                          rowSpan={rowSpanVal}
                          className="py-4 px-3 font-semibold text-slate-900 bg-white"
                          style={{ border: '1px solid #e1e5e9', verticalAlign: 'middle' }}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span>{project.name}</span>
                            <span className="font-mono text-[10px] text-slate-400 font-bold">
                              {project.code}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Instrument */}
                      <td className="py-4 px-3 text-slate-600 font-medium" style={{ border: '1px solid #e1e5e9' }}>
                        {getInstrumentLabel(project.instrument)}
                      </td>

                      {/* Method */}
                      <td className="py-4 px-3 text-slate-600" style={{ border: '1px solid #e1e5e9' }}>
                        {project.method || '-'}
                      </td>

                      {/* Interference */}
                      <td className="py-4 px-3 text-slate-500 text-xs" style={{ border: '1px solid #e1e5e9' }}>
                        {project.interference || '-'}
                      </td>

                      {/* Traceability */}
                      <td className="py-4 px-3 text-slate-500 text-xs" style={{ border: '1px solid #e1e5e9' }}>
                        {project.traceability || '-'}
                      </td>

                      {/* Long term CV % */}
                      <td className="py-4 px-4 bg-slate-50/10" style={{ border: '1px solid #e1e5e9' }}>
                        {renderLabImprecision(levels)}
                      </td>

                      {/* Uncertainty Calculations */}
                      <td className="py-4 px-4 bg-emerald-50/[0.04]" style={{ border: '1px solid #e1e5e9' }}>
                        {renderUncertaintyCalc(levels)}
                      </td>

                      {/* Verbal Report sentence */}
                      <td className="py-4 px-4 bg-slate-50/5" style={{ border: '1px solid #e1e5e9' }}>
                        {renderUncertaintyReport(levels)}
                      </td>

                      {/* Criteria Judgement evaluation */}
                      <td className="py-4 px-4 bg-indigo-50/[0.02]" style={{ border: '1px solid #e1e5e9' }}>
                        {renderComplianceEvaluation(levels)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
