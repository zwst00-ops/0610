import { useState, useMemo } from 'react';
import { 
  ZoningOption, 
  ZONING_AREAS, 
  FloorConfig, 
  SiteConfig 
} from '../types';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Ruler, 
  ChevronUp, 
  ChevronDown,
  Info
} from 'lucide-react';

export default function MassSimulator() {
  // 1. Site configuration
  const [site, setSite] = useState<SiteConfig>({
    siteArea: 150, // 150 ㎡ (약 45평)
    siteWidth: 16, // 16m
    zoningId: 'gen_res', // 일반주거지역
  });

  const [buildingDepth, setBuildingDepth] = useState<number>(10); // 건물 깊이 10m

  // Selected zoning details
  const selectedZoning = useMemo(() => {
    return ZONING_AREAS.find(z => z.id === site.zoningId) || ZONING_AREAS[1];
  }, [site.zoningId]);

  // 2. Floors configuration (Initial 3 floors)
  const [floors, setFloors] = useState<FloorConfig[]>([
    { floorNumber: 1, height: 3.2, width: 8.5, offset: 2.0 },
    { floorNumber: 2, height: 3.0, width: 8.5, offset: 2.0 },
    { floorNumber: 3, height: 3.0, width: 7.0, offset: 3.5 },
  ]);

  // Handler to change architectural properties
  const updateFloor = (index: number, key: keyof FloorConfig, value: number) => {
    const updated = [...floors];
    updated[index] = {
      ...updated[index],
      [key]: value
    };
    setFloors(updated);
  };

  const addFloor = () => {
    if (floors.length >= 7) return; // Limit to 7 for simulation clarity
    const lastFloor = floors[floors.length - 1];
    const newFloorNum = floors.length + 1;
    setFloors([
      ...floors,
      {
        floorNumber: newFloorNum,
        height: 3.0,
        width: lastFloor ? Math.max(3, lastFloor.width - 1.0) : 6.0,
        offset: lastFloor ? Math.min(site.siteWidth - 3, lastFloor.offset + 1.0) : 2.0
      }
    ]);
  };

  const removeFloor = () => {
    if (floors.length <= 1) return;
    setFloors(floors.slice(0, -1));
  };

  // 3. Mathematical Calculations
  // Calculate heights of floors relative to ground (bottom and top height of each floor)
  const floorHeightsCalculated = useMemo(() => {
    let cumulativeHeight = 0;
    return floors.map((floor) => {
      const bottom = cumulativeHeight;
      const top = cumulativeHeight + floor.height;
      cumulativeHeight = top;
      return {
        ...floor,
        bottomHeight: bottom,
        topHeight: top
      };
    });
  }, [floors]);

  // Total height of the building
  const totalBuildingHeight = useMemo(() => {
    return floors.reduce((acc, f) => acc + f.height, 0);
  }, [floors]);

  // Solar setback check for each floor
  // Solar Setback criteria:
  // - y <= 9m: required offset is 1.5m
  // - y > 9m: required offset is y / 2
  const floorAssessments = useMemo(() => {
    return floorHeightsCalculated.map((floor) => {
      // Required offsets at bottom and top of this floor
      const reqOffsetBottom = floor.bottomHeight <= 9 ? 1.5 : floor.bottomHeight / 2;
      const reqOffsetTop = floor.topHeight <= 9 ? 1.5 : floor.topHeight / 2;
      
      // Since required offset is monotonically increasing with height, 
      // the strictest check for a constant left-offset floor is at the top of the floor
      const requiredOffset = reqOffsetTop; 
      const actualOffset = floor.offset;
      const isViolated = actualOffset < requiredOffset;
      const isClose = !isViolated && actualOffset < requiredOffset + 0.5; // Warning condition: within 0.5m

      return {
        ...floor,
        requiredOffset,
        actualOffset,
        isViolated,
        isClose
      };
    });
  }, [floorHeightsCalculated]);

  // Overall Solar Setback status (is ANY floor violating?)
  const isSolarSetbackViolated = useMemo(() => {
    if (!selectedZoning.hasSolarSetback) return false;
    return floorAssessments.some(f => f.isViolated);
  }, [floorAssessments, selectedZoning]);

  // Area & Ratio Calculations
  // Architectural footprint area = projection of all floors from left to right.
  const footprintAndArea = useMemo(() => {
    if (floors.length === 0) return { buildingArea: 0, totalFloorArea: 0 };
    
    // Calculate leftmost edge and rightmost edge among all floors
    let minLeft = Infinity;
    let maxRight = -Infinity;
    let totalFloorArea = 0;

    floors.forEach((floor) => {
      const left = floor.offset;
      const right = floor.offset + floor.width;
      if (left < minLeft) minLeft = left;
      if (right > maxRight) maxRight = right;
      
      // Individual floor area = floor width * building depth
      totalFloorArea += floor.width * buildingDepth;
    });

    const footprintWidth = maxRight - minLeft;
    const buildingArea = footprintWidth * buildingDepth;

    return {
      buildingArea,
      totalFloorArea,
      minLeft,
      maxRight
    };
  }, [floors, buildingDepth]);

  const builtBCR = useMemo(() => {
    return (footprintAndArea.buildingArea / site.siteArea) * 100;
  }, [footprintAndArea.buildingArea, site.siteArea]);

  const builtFAR = useMemo(() => {
    return (footprintAndArea.totalFloorArea / site.siteArea) * 100;
  }, [footprintAndArea.totalFloorArea, site.siteArea]);

  const isBCROver = builtBCR > selectedZoning.maxBCR;
  const isFAROver = builtFAR > selectedZoning.maxFAR;

  // Render SVG measurements and settings
  const svgWidth = 550;
  const svgHeight = 360;
  const groundY = 310;
  const northPropertyX = 60; // Offset of North site boundary from SVG left
  
  // 1 meter = 14 pixels
  const pxPerMeter = 14;

  const realToSvgX = (realX: number) => northPropertyX + realX * pxPerMeter;
  const realToSvgY = (realY: number) => groundY - realY * pxPerMeter;

  // Grid lines
  const gridLinesY = [];
  for (let i = 0; i <= 22; i += 2) {
    gridLinesY.push(i);
  }
  const gridLinesX = [];
  for (let i = 0; i <= 30; i += 2) {
    gridLinesX.push(i);
  }

  // Draw the actual boundary limits of 일조사선 on SVG:
  // Envelope path points from ground to top of drawing:
  // at y=0, x=1.5
  // at y=9, x=1.5
  // at y=25, x=12.5 (9 + (25-9)/2 = 12.5? No, req_x = y/2. For y=25, req_x = 12.5)
  const setbackEnvelopePath = useMemo(() => {
    const p1 = `${realToSvgX(1.5)},${realToSvgY(0)}`;
    const p2 = `${realToSvgX(1.5)},${realToSvgY(9)}`;
    const p3 = `${realToSvgX(11.5)},${realToSvgY(23)}`; // at 23m height, req x is 11.5m
    const pGround = `${realToSvgX(0)},${realToSvgY(0)}`;
    return `M ${realToSvgX(0)},${realToSvgY(23)} L ${p3} L ${p2} L ${p1} L ${pGround} Z`;
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="mass-simulator-root">
      {/* LEFT: Inputs & Interactive controls */}
      <div className="col-span-1 lg:col-span-5 flex flex-col gap-5">
        
        {/* 1. Site Parameter Dashboard */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5" id="site-settings-card">
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="text-blue-600 size-5" />
            <h3 className="font-semibold text-gray-900">1. 대지 및 토지 정보 설정</h3>
          </div>
          
          <div className="space-y-4">
            {/* 용도지역 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">용도지역 선택</label>
              <select 
                value={site.zoningId}
                onChange={(e) => setSite({ ...site, zoningId: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 text-gray-800 outline-hidden focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer font-sans"
              >
                {ZONING_AREAS.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} (건폐 {z.maxBCR}% / 용적 {z.maxFAR}%)
                  </option>
                ))}
              </select>
            </div>

            {/* 대지면적, 너비, 건물 깊이 세로 스택 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">대지면적 (A)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={site.siteArea} 
                    onChange={(e) => setSite({ ...site, siteArea: Math.max(10, Number(e.target.value)) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs px-2.5 py-2 text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-gray-400 font-sans">㎡</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">대지폭 (X)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={site.siteWidth} 
                    onChange={(e) => setSite({ ...site, siteWidth: Math.max(5, Number(e.target.value)) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs px-2.5 py-2 text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-gray-400 font-sans">m</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">건물깊이 (Y)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={buildingDepth} 
                    onChange={(e) => setBuildingDepth(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs px-2.5 py-2 text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-gray-400 font-sans">m</span>
                </div>
              </div>
            </div>

            {selectedZoning.hasSolarSetback ? (
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800 border border-blue-100 flex gap-2">
                <Info className="size-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">일조권 사선제한 대상 지역:</span> 해당 대지는 주거지역으로, 정북방향 대지경계선으로부터 건물 높이에 따라 이격해야 합니다. (9m 이하: 1.5m 이격, 9m 초과: 높이의 1/2 대지이격)
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-600 flex gap-2">
                <Info className="size-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">사선제한 제외 지역(상업/공업 등):</span> 일조권 규정 적용 대상 주거지역이 아닙니다. 법상 자유로운 매스 디자인이 가능합니다.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Building Mass Modeler */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex-1" id="mass-configurator-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="text-blue-600 size-5" />
              <h3 className="font-semibold text-gray-900">2. 층별 매스(너비/이격) 조정</h3>
            </div>
            
            {/* 층수 추가/삭제 단추 */}
            <div className="flex gap-1.5">
              <button 
                onClick={removeFloor}
                disabled={floors.length <= 1}
                className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="맨 위 세대 삭제"
              >
                <Trash2 className="size-3.5" />
              </button>
              <button 
                onClick={addFloor}
                disabled={floors.length >= 7}
                className="bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>추가</span>
              </button>
            </div>
          </div>

          {/* 층별 슬라이더 세트 (역순으로 렌더하여, 고층이 위에 보이도록 배치) */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {floors.slice().reverse().map((floor, reverseIdx) => {
              const originalIndex = floors.length - 1 - reverseIdx;
              const assessment = floorAssessments[originalIndex];
              
              return (
                <div 
                  key={floor.floorNumber}
                  style={{ contentVisibility: 'auto' }}
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    assessment?.isViolated 
                    ? 'border-red-200 bg-red-50/50' 
                    : assessment?.isClose 
                    ? 'border-amber-200 bg-amber-50/50' 
                    : 'border-gray-100 bg-gray-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800 font-mono text-sm">{floor.floorNumber}F</span>
                    <div className="flex gap-2">
                      <span className="text-[10px] text-gray-400">
                        누적높이: {assessment?.topHeight.toFixed(1)}m
                      </span>
                      {selectedZoning.hasSolarSetback && (
                        assessment?.isViolated ? (
                          <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-700 rounded-sm font-semibold">침범 ❌</span>
                        ) : assessment?.isClose ? (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-sm font-semibold">근접 ⚠️</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-sm font-semibold">적합  ○</span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* 이격거리 */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-gray-500">정북 경계 이격거리</span>
                        <span className="font-bold font-mono text-gray-700">{floor.offset.toFixed(1)}m</span>
                      </div>
                      <input 
                        type="range"
                        min="0.5"
                        max={Math.max(floor.offset, (site.siteWidth - 2))}
                        step="0.1"
                        value={floor.offset}
                        onChange={(e) => updateFloor(originalIndex, 'offset', parseFloat(e.target.value))}
                        className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* 건물 폭 */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-gray-500">건물 폭 (두께)</span>
                        <span className="font-bold font-mono text-gray-700">{floor.width.toFixed(1)}m</span>
                      </div>
                      <input 
                        type="range"
                        min="2"
                        max={Math.max(floor.width, (site.siteWidth - floor.offset))}
                        step="0.1"
                        value={floor.width}
                        onChange={(e) => updateFloor(originalIndex, 'width', parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT: Visual Canvas & Status Dashboard */}
      <div className="col-span-1 lg:col-span-7 flex flex-col gap-5">
        
        {/* 1. Legal Compliance Dashboard Card */}
        <div className="grid grid-cols-3 gap-3">
          
          {/* 건폐율 */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
            <div className="text-xs text-gray-500 mb-1">건폐율 (BCR)</div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold font-mono ${isBCROver ? 'text-red-600' : 'text-gray-900'}`}>
                {builtBCR.toFixed(1)}%
              </span>
              <span className="text-[11px] text-gray-400">/ {selectedZoning.maxBCR}%</span>
            </div>
            {/* 프로그레스 바 */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${isBCROver ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (builtBCR / selectedZoning.maxBCR) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1 text-gray-400">
              <span>건축면적: {footprintAndArea.buildingArea.toFixed(1)}㎡</span>
              {isBCROver && <span className="text-red-500 font-semibold font-sans">초과!</span>}
            </div>
          </div>

          {/* 용적률 */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
            <div className="text-xs text-gray-500 mb-1">용적률 (FAR)</div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold font-mono ${isFAROver ? 'text-red-600' : 'text-gray-900'}`}>
                {builtFAR.toFixed(1)}%
              </span>
              <span className="text-[11px] text-gray-400">/ {selectedZoning.maxFAR}%</span>
            </div>
            {/* 프로그레스 바 */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${isFAROver ? 'bg-red-500' : 'bg-cyan-500'}`}
                style={{ width: `${Math.min(100, (builtFAR / selectedZoning.maxFAR) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1 text-gray-400">
              <span>연면적: {footprintAndArea.totalFloorArea.toFixed(1)}㎡</span>
              {isFAROver && <span className="text-red-500 font-semibold font-sans">초과!</span>}
            </div>
          </div>

          {/* 일조사선 확인 */}
          <div className={`rounded-xl p-4 border shadow-xs transition-colors flex flex-col justify-between ${
            !selectedZoning.hasSolarSetback 
            ? 'bg-gray-50 border-gray-100 text-gray-500'
            : isSolarSetbackViolated 
            ? 'bg-red-50 border-red-100 text-red-900' 
            : 'bg-emerald-50 border-emerald-100 text-emerald-900'
          }`}>
            <div>
              <div className="text-xs mb-1 font-medium">정북 일조사선 검토</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {!selectedZoning.hasSolarSetback ? (
                  <>
                    <span className="font-bold text-base">해당없음</span>
                  </>
                ) : isSolarSetbackViolated ? (
                  <>
                    <AlertTriangle className="size-4 text-red-600 shrink-0" />
                    <span className="font-bold text-base text-red-700">법규 침범 ❌</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-base text-emerald-700 font-sans">안전 통과 ○</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-[10px] opacity-80 mt-2 font-mono">
              총 건물 높이: {totalBuildingHeight.toFixed(1)}m
            </div>
          </div>

        </div>

        {/* 2. Interactive SVG Blueprint Section */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-lg flex-1 flex flex-col justify-between" id="blueprint-canvas-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-cyan-400 animate-pulse"></span>
              SECTION ELEVATION DRAFT (1:{Math.round(1000/pxPerMeter)} Scale)
            </span>
            <div className="flex gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-1 px-1.5 bg-red-500 rounded-xs"></span> 정북 대지경계선
              </span>
              <span className="flex items-center gap-1 text-orange-400">
                <span className="w-2.5 h-1 border-t border-dashed border-orange-400"></span> 9m이상 일조사선 (H의 1/2)
              </span>
            </div>
          </div>

          {/* Interactive SVG Drawing */}
          <div className="bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden relative flex-1 flex items-center justify-center p-2">
            
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto"
              style={{ maxHeight: '310px' }}
            >
              <defs>
                {/* Forbidden pattern hatched red */}
                <pattern id="forbidden-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(239, 68, 68, 0.28)" strokeWidth="1.5" />
                </pattern>
                {/* Blueprint grid pattern */}
                <pattern id="grid" width="14" height="14" patternUnits="userSpaceOnUse">
                  <path d="M 14 0 L 0 0 0 14" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Light Meter Grids */}
              {gridLinesX.map((m) => (
                <text key={`gtx-${m}`} x={realToSvgX(m)} y={groundY + 16} fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  {m}m
                </text>
              ))}
              {gridLinesY.map((m) => (
                <g key={`gty-${m}`}>
                  {m > 0 && (
                    <line 
                      x1={northPropertyX - 15} 
                      y1={realToSvgY(m)} 
                      x2={svgWidth - 20} 
                      y2={realToSvgY(m)} 
                      stroke="rgba(255,255,255,0.06)" 
                      strokeDasharray="2,5"
                    />
                  )}
                  <text x={northPropertyX - 18} y={realToSvgY(m) + 3} fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="end" fontFamily="monospace">
                    {m}m
                  </text>
                </g>
              ))}

              {/* Solar Setback Envelope (Light red transparency area on left) */}
              {selectedZoning.hasSolarSetback && (
                <path 
                  d={setbackEnvelopePath} 
                  fill="url(#forbidden-hatch)" 
                  stroke="none"
                />
              )}

              {/* Ground Line */}
              <line 
                x1={10} 
                y1={groundY} 
                x2={svgWidth - 10} 
                y2={groundY} 
                stroke="#475569" 
                strokeWidth="3" 
              />
              <text x={25} y={groundY + 16} fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="monospace">GL</text>

              {/* North Property Boundary Line (Red bold line on vertical) */}
              <line 
                x1={northPropertyX} 
                y1={20} 
                x2={northPropertyX} 
                y2={groundY} 
                stroke="#ef4444" 
                strokeWidth="2" 
                strokeDasharray="5,3" 
              />
              <text x={northPropertyX} y={15} fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle">정북대지선</text>

              {/* 9m Setback Reference Line */}
              {selectedZoning.hasSolarSetback && (
                <>
                  {/* At 9m height reference point */}
                  <line 
                    x1={northPropertyX} 
                    y1={realToSvgY(9)} 
                    x2={realToSvgX(1.5)} 
                    y2={realToSvgY(9)} 
                    stroke="rgba(249,115,22,0.6)" 
                    strokeWidth="1" 
                    strokeDasharray="3,3"
                  />
                  {/* Solar Angle line starts at 9m high, slope 0.5 */}
                  <line 
                    x1={realToSvgX(1.5)} 
                    y1={realToSvgY(9)} 
                    x2={realToSvgX(11.5)} 
                    y2={realToSvgY(29)} 
                    stroke="#f97316" 
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                  />
                  {/* Under 9m boundary vertical line */}
                  <line 
                    x1={realToSvgX(1.5)} 
                    y1={realToSvgY(9)} 
                    x2={realToSvgX(1.5)} 
                    y2={groundY} 
                    stroke="#f97316" 
                    strokeWidth="1.5"
                  />
                  {/* Indicator for 9m limit */}
                  <text x={realToSvgX(1.5) + 6} y={realToSvgY(10)} fill="#f97316" fontSize="8" fontFamily="monospace" fontWeight="bold">9m 지점</text>
                  <text x={realToSvgX(1.5) - 6} y={groundY - 10} fill="#f97316" fontSize="8" fontFamily="monospace" textAnchor="end">1.5m 이격</text>
                </>
              )}

              {/* Plot building floors dynamically */}
              {floorHeightsCalculated.map((floor, idx) => {
                const assessment = floorAssessments[idx];
                const x = realToSvgX(floor.offset);
                const w = floor.width * pxPerMeter;
                const h = floor.height * pxPerMeter;
                const y = realToSvgY(floor.topHeight);

                const isFloorViolated = selectedZoning.hasSolarSetback && assessment?.isViolated;
                const isFloorClose = selectedZoning.hasSolarSetback && assessment?.isClose;

                // Color configuration
                let fillCol = "rgba(14, 116, 144, 0.15)";
                let strokeCol = "#0891b2";
                let textCol = "#22d3ee";

                if (isFloorViolated) {
                  fillCol = "rgba(220, 38, 38, 0.25)";
                  strokeCol = "#ef4444";
                  textCol = "#f87171";
                } else if (isFloorClose) {
                  fillCol = "rgba(217, 119, 6, 0.2)";
                  strokeCol = "#f59e0b";
                  textCol = "#fbbf24";
                }

                return (
                  <g key={`svg-floor-${floor.floorNumber}`} className="transition-all duration-300">
                    {/* Shadow block */}
                    <rect 
                      x={x} 
                      y={y} 
                      width={w} 
                      height={h} 
                      fill={fillCol} 
                      stroke={strokeCol} 
                      strokeWidth="2" 
                      rx="3"
                    />
                    
                    {/* Floor Label */}
                    <text 
                      x={x + w/2} 
                      y={y + h/2 + 3} 
                      fill={textCol} 
                      fontSize="9" 
                      fontWeight="bold" 
                      fontFamily="sans-serif" 
                      textAnchor="middle"
                    >
                      {floor.floorNumber}F
                    </text>

                    {/* Width dimension indicator at bottom of floor */}
                    <text 
                      x={x + w/2} 
                      y={y + h - 4} 
                      fill="rgba(255,255,255,0.4)" 
                      fontSize="7" 
                      fontFamily="monospace" 
                      textAnchor="middle"
                    >
                      W:{floor.width.toFixed(1)}m
                    </text>

                    {/* Left dimension (Offset from Property Line) */}
                    <line 
                      x1={northPropertyX} 
                      y1={y + h/2} 
                      x2={x} 
                      y2={y + h/2} 
                      stroke={strokeCol} 
                      strokeWidth="0.8" 
                      strokeDasharray="2,2" 
                    />
                    <rect 
                      x={northPropertyX + (x - northPropertyX)/2 - 14} 
                      y={y + h/2 - 6} 
                      width="28" 
                      height="12" 
                      fill="#020617" 
                      rx="3" 
                    />
                    <text 
                      x={northPropertyX + (x - northPropertyX)/2} 
                      y={y + h/2 + 3} 
                      fill={textCol} 
                      fontSize="7.5" 
                      fontWeight="bold" 
                      fontFamily="monospace" 
                      textAnchor="middle"
                    >
                      {floor.offset.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </svg>
            
            {/* Visual warning alerts overlay */}
            {isSolarSetbackViolated && (
              <div className="absolute top-3 left-4 bg-red-950/90 border border-red-500 rounded-md px-2.5 py-1 text-red-400 text-[10px] font-semibold flex items-center gap-1 shadow-md">
                <AlertTriangle className="size-3.5 text-red-500 animate-bounce" />
                <span>정북방향 일조권 침범 발생 (H의 1/2 미달)</span>
              </div>
            )}
          </div>

          {/* 3. Detailed floor compliance schedule */}
          <div className="mt-3 bg-slate-950 rounded-lg p-3 border border-slate-800/60 font-mono text-[11px] text-slate-300">
            <div className="grid grid-cols-4 border-b border-slate-800 pb-1.5 font-bold text-slate-400">
              <span>세대층</span>
              <span>한계 높이 (H)</span>
              <span>필요 이격치</span>
              <span>실제 이격치</span>
            </div>
            <div className="divide-y divide-slate-900 mt-1 max-h-[85px] overflow-y-auto">
              {floorAssessments.map(f => (
                <div key={f.floorNumber} className="grid grid-cols-4 py-1">
                  <span className="font-semibold text-slate-200">{f.floorNumber}F</span>
                  <span className="text-slate-400">{f.topHeight.toFixed(1)}m</span>
                  <span className="text-slate-400">{f.requiredOffset.toFixed(2)}m</span>
                  <span className={f.isViolated ? 'text-red-400 font-bold' : f.isClose ? 'text-amber-400' : 'text-emerald-400'}>
                    {f.actualOffset.toFixed(1)}m {f.isViolated ? '❌' : '○'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
