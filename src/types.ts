/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Project {
  id: string; // 唯一ID
  code: string; // 检测项目简称, 如 FT3, FT4
  name: string; // 检测项目中文名, 如 游离三碘甲状腺原氨酸
  instrument: string; // 检测仪器, 如 SIEMENSBN II, 罗氏Cobas
  method: string; // 检测方法, 如 化学发光免疫分析
  interference: string; // 干扰因素, 如 严重溶血标本
  traceability: string; // 校准品溯源性, 如 ERM-DA470k/I
}

export interface Parameter {
  id: string; // 唯一行ID
  projectId: string; // 关联的检测项目代号/ID
  unit: string; // 单位, 如 pg/ml
  level: string; // 水平（浓度）, 如 1, 2, 3
  dateRange: string; // 日期范围, 如 20250101-20250630
  mean: number; // 累积均值
  qcCV: number; // Qc.cv %
  calCV: number; // Cal.cv %
  tea: number; // TEa
  k: number; // 扩展常数, 通常为 2
}

export interface CalculatedParameter extends Parameter {
  calCVSquared: number; // Cal.cv平方
  qcCVSquared: number; // QC.cv平方
  sumCVSquared: number; // Cal.cv平方+QC.cv平方
  combinedUC: number; // 合成相对UC
  expandedUC: number; // 扩展相对UC
  complianceStatus: string; // 达标状态, 如 "< 1/2Tea" / "<TEa" / ">TEa"
  evaluation: string; // 评判, "达到要求" / "没有达到要求"
}
