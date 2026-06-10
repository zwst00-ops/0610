export interface ZoningOption {
  id: string;
  name: string;
  maxBCR: number; // 건폐율 상한 (%)
  maxFAR: number; // 용적률 상한 (%)
  hasSolarSetback: boolean; // 일조권 사선제한 대상 여부
  color: string;
}

export const ZONING_AREAS: ZoningOption[] = [
  { id: 'ex_res', name: '전용주거지역', maxBCR: 50, maxFAR: 100, hasSolarSetback: true, color: '#22c55e' },
  { id: 'gen_res', name: '일반주거지역', maxBCR: 60, maxFAR: 200, hasSolarSetback: true, color: '#3b82f6' },
  { id: 'semi_res', name: '준주거지역', maxBCR: 70, maxFAR: 400, hasSolarSetback: false, color: '#06b6d4' },
  { id: 'cent_com', name: '중심상업지역', maxBCR: 90, maxFAR: 1500, hasSolarSetback: false, color: '#ef4444' },
  { id: 'gen_com', name: '일반상업지역', maxBCR: 80, maxFAR: 1000, hasSolarSetback: false, color: '#f97316' },
  { id: 'neigh_com', name: '근린상업지역', maxBCR: 70, maxFAR: 800, hasSolarSetback: false, color: '#f59e0b' },
  { id: 'gen_ind', name: '일반공업지역', maxBCR: 70, maxFAR: 350, hasSolarSetback: false, color: '#8b5cf6' },
  { id: 'green_pres', name: '보전녹지지역', maxBCR: 20, maxFAR: 80, hasSolarSetback: false, color: '#15803d' },
];

export interface BuildingUsageOption {
  id: string;
  name: string;
  parkingSqMeterPerUnit: number; // 주차장 산정 기준 면적 (㎡당 1대)
  isResidential: boolean;
}

export const BUILDING_USAGES: BuildingUsageOption[] = [
  { id: 'retail_1', name: '제1종 근린생활시설', parkingSqMeterPerUnit: 134, isResidential: false },
  { id: 'retail_2', name: '제2종 근린생활시설', parkingSqMeterPerUnit: 134, isResidential: false },
  { id: 'office', name: '업무시설', parkingSqMeterPerUnit: 100, isResidential: false },
  { id: 'assembly', name: '문화 및 집회시설', parkingSqMeterPerUnit: 100, isResidential: false },
  { id: 'sales', name: '판매시설', parkingSqMeterPerUnit: 150, isResidential: false },
  { id: 'residential_multi', name: '공동주택 (세대평균 85㎡ 이하)', parkingSqMeterPerUnit: 75, isResidential: true },
  { id: 'residential_single', name: '단독주택 (면적기준 50~150㎡)', parkingSqMeterPerUnit: 100, isResidential: true },
];

export interface FloorConfig {
  floorNumber: number;
  height: number; // 층고 (m)
  width: number;  // 건물 폭 (m)
  offset: number; // 정북방향 대지경계선으로부터의 이격거리 (m)
}

export interface SiteConfig {
  siteArea: number; // 대지면적 (㎡)
  siteWidth: number; // 대지 너비/폭 (m)
  zoningId: string;
}

export interface MaterialCostResult {
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description: string;
}
