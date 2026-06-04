/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Parameter } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_ft3',
    code: 'FT3',
    name: '游离三碘甲状腺原氨酸',
    instrument: 'SIEMENSBN II',
    method: '化学发光免疫分析',
    interference: '严重溶血标本',
    traceability: 'ERM-DA470k/I'
  },
  {
    id: 'proj_ft4',
    code: 'FT4',
    name: '血清游离甲状腺素',
    instrument: '罗氏Cobas',
    method: '化学发光免疫分析',
    interference: '严重溶血标本',
    traceability: 'ERM-DA470k/I'
  },
  {
    id: 'proj_tsh',
    code: 'TSH',
    name: '促甲状腺激素',
    instrument: '罗氏Cobas',
    method: '化学发光免疫分析',
    interference: '严重溶血标本',
    traceability: 'WHO 81/565'
  }
];

export const INITIAL_PARAMETERS: Parameter[] = [
  {
    id: 'param_ft3_l1',
    projectId: 'proj_ft3',
    unit: 'pg/ml',
    level: '1',
    dateRange: '20250101-20250630',
    mean: 7.77,
    qcCV: 4.12,
    calCV: 3.2,
    tea: 25,
    k: 2
  },
  {
    id: 'param_ft3_l2',
    projectId: 'proj_ft3',
    unit: 'pg/ml',
    level: '2',
    dateRange: '20250101-20250630',
    mean: 12.34,
    qcCV: 5.4,
    calCV: 8.9,
    tea: 25,
    k: 2
  },
  {
    id: 'param_ft4_l2',
    projectId: 'proj_ft4',
    unit: 'ng/dl',
    level: '2',
    dateRange: '20250101-20250630',
    mean: 2.15,
    qcCV: 3.93,
    calCV: 8.0,
    tea: 25,
    k: 2
  },
  {
    id: 'param_ft4_l3',
    projectId: 'proj_ft4',
    unit: 'ng/dl',
    level: '3',
    dateRange: '20250101-20250630',
    mean: 2.98,
    qcCV: 4.28,
    calCV: 5.9,
    tea: 25,
    k: 2
  },
  {
    id: 'param_tsh_l1',
    projectId: 'proj_tsh',
    unit: 'uIU/ml',
    level: '1',
    dateRange: '20250101-20250630',
    mean: 1.45,
    qcCV: 3.1,
    calCV: 2.4,
    tea: 20,
    k: 2
  }
];
