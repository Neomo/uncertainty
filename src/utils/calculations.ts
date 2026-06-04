/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Parameter, CalculatedParameter } from '../types';

/**
 * Perform uncertainty calculations for a given parameter row.
 * {Cal.cv平方} = Cal.cv 的平方
 * {QC.cv平方} = QC.cv 的平方
 * {Cal.cv平方+QC.cv平方} = Cal.cv平方 + QC.cv平方
 * {合成相对UC} = sqrt(Cal.cv平方 + QC.cv平方)
 * {扩展相对UC} = 合成相对UC * K
 * {达标状态} = 比对扩展相对UC 与 TEa:
 *   - < 1/2Tea: 扩展相对UC < TEa * 0.5
 *   - <TEa: TEa * 0.5 <= 扩展相对UC < TEa
 *   - >TEa: 扩展相对UC >= TEa
 * {评判} = "达到要求" if 达标状态 in ["< 1/2Tea", "<TEa"] else "没有达到要求"
 */
export function calculateParameter(param: Parameter): CalculatedParameter {
  const calCV = param.calCV || 0;
  const qcCV = param.qcCV || 0;
  const tea = param.tea || 0;
  const k = param.k || 2;

  // Calculatings and rounding matching standard lab precision (4 decimals for intermediates, 2 for final percentages)
  const calCVSquared = Number((calCV * calCV).toFixed(4));
  const qcCVSquared = Number((qcCV * qcCV).toFixed(4));
  const sumCVSquared = Number((calCVSquared + qcCVSquared).toFixed(4));
  
  // Calculate UC of 합성
  const combinedUC = Number(Math.sqrt(sumCVSquared).toFixed(2));
  
  // Calculate expanded UC. We'll use the precise unrounded combined value multiplied by k, then round to 2 decimals.
  const expandedUC = Number((Math.sqrt(sumCVSquared) * k).toFixed(2));

  // Determine compliance status based on TEa
  let complianceStatus = '';
  let evaluation = '';

  const halfTea = tea / 2;
  if (expandedUC < halfTea) {
    complianceStatus = '< 1/2Tea';
    evaluation = '达到要求';
  } else if (expandedUC < tea) {
    complianceStatus = '<TEa';
    evaluation = '达到要求';
  } else {
    complianceStatus = '>TEa';
    evaluation = '没有达到要求';
  }

  return {
    ...param,
    calCVSquared,
    qcCVSquared,
    sumCVSquared,
    combinedUC,
    expandedUC,
    complianceStatus,
    evaluation,
  };
}
