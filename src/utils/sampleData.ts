/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Parameter, DictInstrument, DictProject, DictUnit } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_ft3',
    code: 'FT3',
    name: '游离三碘甲状腺原氨酸',
    unit: 'pg/ml',
    instrument: 'SIEMENSBN II',
    method: '化学发光免疫分析',
    interference: '严重溶血标本',
    traceability: 'ERM-DA470k/I'
  },
  {
    id: 'proj_ft4',
    code: 'FT4',
    name: '血清游离甲状腺素',
    unit: 'ng/dl',
    instrument: '罗氏Cobas',
    method: '化学发光免疫分析',
    interference: '严重溶血标本',
    traceability: 'ERM-DA470k/I'
  },
  {
    id: 'proj_tsh',
    code: 'TSH',
    name: '促甲状腺激素',
    unit: 'uIU/ml',
    instrument: '罗氏Cobas',
    method: '化学发光免疫分析',
    interference: '严重溶血标本',
    traceability: 'WHO 81/565'
  }
];

export const INITIAL_DICT_INSTRUMENTS: DictInstrument[] = [
  { id: 'inst_siemens', code: 'SIEMENSBN II', name: 'SIEMENSBN II' },
  { id: 'inst_roche', code: '罗氏Cobas', name: '罗氏Cobas' },
  { id: 'inst_abbott', code: '雅培Alinity', name: '雅培Alinity' }
];

export const INITIAL_DICT_PROJECTS: DictProject[] = [
  { id: 'dict_proj_ft3', code: 'FT3', name: '游离三碘甲状腺原氨酸' },
  { id: 'dict_proj_ft4', code: 'FT4', name: '血清游离甲状腺素' },
  { id: 'dict_proj_tsh', code: 'TSH', name: '促甲状腺激素' },
  { id: 'dict_proj_tg', code: 'Tg', name: '甲状腺球蛋白' }
];

export const INITIAL_DICT_UNITS: DictUnit[] = [
  { id: 'unit_pgml', code: 'pg/ml', description: '皮克/毫升' },
  { id: 'unit_ngdl', code: 'ng/dl', description: '纳克/分升' },
  { id: 'unit_uiuml', code: 'uIU/ml', description: '微国际单位/毫升' },
  { id: 'unit_ngml', code: 'ng/ml', description: '纳克/毫升' }
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
