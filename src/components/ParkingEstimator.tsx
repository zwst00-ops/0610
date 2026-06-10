import { useState, useMemo } from 'react';
import { BUILDING_USAGES, BuildingUsageOption, MaterialCostResult } from '../types';
import { 
  SquarePlay, 
  Coins, 
  Flame, 
  Construction, 
  Calculator, 
  FileText,
  Download,
  Car,
  PackageCheck
} from 'lucide-react';

interface EstimatorProps {
  simulatedTotalFloorArea?: number; // can take dynamic linkage if available
}

export default function ParkingEstimator({ simulatedTotalFloorArea = 240 }: EstimatorProps) {
  // Inputs for Parking Calculator
  const [selectedUsageId, setSelectedUsageId] = useState<string>('retail_1');
  const [customArea, setCustomArea] = useState<number>(simulatedTotalFloorArea);
  
  // Custom Material Calculator Inputs
  const [concreteUnitPrice, setConcreteUnitPrice] = useState<number>(92000); // 1 ㎥당 92,000원 (레미콘 단가)
  const [rebarUnitPrice, setRebarUnitPrice] = useState<number>(850000);   // 1 Ton당 850,000원 (철근 단가)
  const [brickUnitPrice, setBrickUnitPrice] = useState<number>(180);       // 장당 180원 (점토벽돌 단가)
  
  // Toggles for tabs
  const [activeSubTab, setActiveSubTab] = useState<'parking' | 'materials'>('parking');

  const selectedUsage = useMemo(() => {
    return BUILDING_USAGES.find(u => u.id === selectedUsageId) || BUILDING_USAGES[0];
  }, [selectedUsageId]);

  // Handle Linkage with live simulator
  const applySimulatedArea = () => {
    setCustomArea(Math.round(simulatedTotalFloorArea));
  };

  // Legal Parking Calculation:
  // Required = customArea / parkingSqMeterPerUnit
  // In Korea: 
  // If the calculation turns out to be less than 1.0 (e.g. 0.8), it is usually rounded to 0 (except for some residential configurations which require at least 1).
  // If the total is >= 1.0:
  // Fractional part: if >= 0.5, round to 1 (Korean local rules differ slightly, usually: standard is mathematical ceiling or nearest fraction rule.
  // Let's implement standard precision and the rounded up final result.
  const parkingCalculation = useMemo(() => {
    const rawValue = customArea / selectedUsage.parkingSqMeterPerUnit;
    let requiredSpaces = 0;
    
    if (selectedUsage.isResidential) {
      // Residential usually requires at least 1 space per unit, or minimum 1 if area warrants it
      requiredSpaces = Math.max(1, Math.ceil(rawValue));
    } else {
      // Commercial: if rawValue is less than 1, it's 0. Otherwise, round mathematical nearest
      if (rawValue < 1.0) {
        requiredSpaces = 0;
      } else {
        // Under structural rules, 1.5 spaces rounded up to 2, 2.3 spaces rounded down to 2 etc.
        const decimalPart = rawValue - Math.floor(rawValue);
        requiredSpaces = decimalPart >= 0.5 ? Math.ceil(rawValue) : Math.floor(rawValue);
      }
    }

    return {
      rawValue,
      requiredSpaces
    };
  }, [customArea, selectedUsage]);

  // Material and Cost Estimation calculations:
  // Base structural metrics for concrete building per 1 ㎡ of floor area:
  // - Concrete (레미콘): 0.45 ㎥ per ㎡
  // - Rebar/Steel (철근): 0.08 Tons per ㎡
  // - Brick (벽돌): Wall brick 1B external = approx 130 bricks per ㎡. Let's assume average wall partition ratio of 0.8㎡ of wall per ㎡ floor area. Approx 60 bricks per floor ㎡.
  const estimates: MaterialCostResult[] = useMemo(() => {
    const concreteQty = customArea * 0.45; // ㎥
    const rebarQty = customArea * 0.08;    // Tons
    const brickQty = customArea * 64;      // Bricks

    return [
      {
        itemName: '구조용 철근콘크리트 (레미콘 25-24-150)',
        unit: '㎥ (루베)',
        quantity: Math.round(concreteQty),
        unitPrice: concreteUnitPrice,
        totalPrice: Math.round(concreteQty) * concreteUnitPrice,
        description: '기초, 슬래브 및 주구조체 레미콘 타설용 (기준: 0.45 ㎥/㎡)'
      },
      {
        itemName: '고장력 이형철근 (SD400 / 10mm~22mm)',
        unit: 'Tons',
        quantity: parseFloat(rebarQty.toFixed(2)),
        unitPrice: rebarUnitPrice,
        totalPrice: Math.round(rebarQty * rebarUnitPrice),
        description: '보, 기둥, 단열 옹벽 배근용 자재 (기준: 0.08 Tons/㎡)'
      },
      {
        itemName: '외패널/치장 조적용 점토벽돌 (외관 마감)',
        unit: 'EA (장)',
        quantity: Math.round(brickQty),
        unitPrice: brickUnitPrice,
        totalPrice: Math.round(brickQty) * brickUnitPrice,
        description: '외벽 마감재 및 파티션 조적용 벽돌 (기준: 64 EA/㎡)'
      }
    ];
  }, [customArea, concreteUnitPrice, rebarUnitPrice, brickUnitPrice]);

  // Sum of structural material cost
  const totalCostSum = useMemo(() => {
    return estimates.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [estimates]);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col h-full" id="parking-estimator-root">
      
      {/* Tab Switcher & Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5">
        <div className="flex items-center gap-2">
          <Calculator className="text-blue-600 size-5" />
          <h2 className="font-semibold text-gray-900 text-lg">주차대수 및 골조 자재량 산출서</h2>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
          <button 
            onClick={() => setActiveSubTab('parking')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'parking' 
              ? 'bg-white text-blue-600 shadow-xs' 
              : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Car className="size-3.5" />
            <span>법정 주차 산정</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('materials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'materials' 
              ? 'bg-white text-blue-600 shadow-xs' 
              : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <PackageCheck className="size-3.5" />
            <span>자재 소요량/공사비</span>
          </button>
        </div>
      </div>

      {/* Shared calculation input section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100 mb-6">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">용도 분류 (주차 및 자재 기준)</label>
          <select 
            value={selectedUsageId}
            onChange={(e) => setSelectedUsageId(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg text-xs px-3 py-2.5 text-gray-800 outline-hidden font-sans"
          >
            {BUILDING_USAGES.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">검토 대상 연면적</label>
          <div className="relative">
            <input 
              type="number"
              value={customArea}
              onChange={(e) => setCustomArea(Math.max(1, Number(e.target.value)))}
              className="w-full bg-white border border-gray-200 rounded-lg text-xs px-3 py-2.5 text-gray-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400 font-sans">㎡</span>
          </div>
        </div>

        <div className="flex items-end">
          <button 
            onClick={applySimulatedArea}
            className="w-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            title="법규 시뮬레이터에 있는 최신 건물 규모 연면적 가져오기"
          >
            <SquarePlay className="size-4 text-blue-600" />
            <span>매스 시뮬레이션 연동</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: LEGAL PARKING CALCULATIONS */}
      {activeSubTab === 'parking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* Result Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-full">주차 분석 결과</span>
              <h4 className="mt-2 text-sm font-semibold text-gray-800 leading-snug">
                {selectedUsage.name} 법정 대수
              </h4>
              <div className="text-[11px] text-gray-500 mt-1">
                지역 조례 기준 산식: 연면적 ÷ {selectedUsage.parkingSqMeterPerUnit}㎡
              </div>

              <div className="mt-8 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-blue-750 font-mono tracking-tight">
                  {parkingCalculation.requiredSpaces}
                </span>
                <span className="text-lg font-bold text-gray-700">대</span>
                <span className="text-xs text-gray-400 font-mono">
                  (산출치: {parkingCalculation.rawValue.toFixed(3)}대)
                </span>
              </div>
            </div>

            <div className="bg-white/80 border border-blue-100 rounded-lg p-3.5 mt-6 text-xs text-indigo-900 leading-relaxed font-sans shadow-2xs">
              <span className="font-bold text-blue-800 block mb-1">💡 분석 코멘트</span>
              본 면적({customArea}㎡)에 따른 최소 확보 주차 한계선입니다. 지자체 주차장 조례에 따라 다를 수 있으나 기초 심의 도서 통과를 위해서는 최소 <strong>{parkingCalculation.requiredSpaces}대</strong>를 배치 평면도에 구상해두셔야 합니다.
            </div>
          </div>

          {/* Parking Standard Layout Blueprint details */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>●</span> 한국 표준 주차구획 규격 데이터 (실무 치수 가이드)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Standard */}
              <div className="border border-gray-150 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-gray-800">일반형 주차 (평면형)</span>
                  <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.2 rounded font-semibold font-mono">2.5m x 5.0m</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  국토부 가장 대중적인 기본 규격. 일반 하이브리드 차량 및 SUV 주차 여유선 확보에 알맞습니다.
                </p>
              </div>

              {/* Parallel */}
              <div className="border border-gray-150 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-gray-800">평행 주차 (측면형)</span>
                  <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.2 rounded font-semibold font-mono">2.0m x 6.0m</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  이면도로, 소형 주거 골목 이격 차선에 주로 시공됩니다. 대형 세단의 경우 2.0m x 6.0m 필요.
                </p>
              </div>

              {/* Expanded */}
              <div className="border border-gray-150 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-gray-800">확장형 주차 (권장형)</span>
                  <span className="bg-indigo-50 text-indigo-750 text-[10px] px-2 py-0.2 rounded font-semibold font-mono">2.6m x 5.2m</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  여성 운전자, 문콕 분쟁 예방차원에서 현대 핀테크 아파트 단지에 거의 필수 적용되는 신형 트렌드 규격.
                </p>
              </div>

              {/* Disabled */}
              <div className="border border-gray-150 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-gray-800">장애인 전용 주차</span>
                  <span className="bg-blue-50 text-blue-755 text-[10px] px-2 py-0.2 rounded font-semibold font-mono">3.3m x 5.0m</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  보행차 휠체어 하차 최소 통로폭(1.2m)이 확보되어 있어, 일반 주차선보다 좌우측 도색 거리가 대폭 넓습니다.
                </p>
              </div>

            </div>

            {/* Quick mini-graphics mapping legal layout */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mt-1 text-center flex flex-col justify-center">
              <div className="text-[10px] text-slate-400 mb-3 text-left font-mono">
                SCHEMATIC VISUALIZATION: {parkingCalculation.requiredSpaces} Parking Lot Layout Template
              </div>
              
              <div className="flex flex-wrap gap-2.5 justify-center">
                {parkingCalculation.requiredSpaces === 0 ? (
                  <div className="text-xs text-slate-500 py-3">법정 의무 주차 산정 대수가 0대입니다.</div>
                ) : (
                  Array.from({ length: Math.min(10, parkingCalculation.requiredSpaces) }).map((_, idx) => (
                    <div 
                      key={`visual-p-${idx}`} 
                      className="w-14 h-24 border-2 border-dashed border-cyan-500/50 bg-cyan-950/20 rounded-sm flex flex-col justify-between p-1.5 text-center transition-all hover:border-blue-400 hover:bg-slate-850"
                    >
                      <span className="text-[8px] font-mono text-cyan-400 tracking-tighter">P-{idx + 1}</span>
                      <div className="size-4 bg-slate-800/80 rounded-xs self-center flex items-center justify-center font-bold text-[8px] text-gray-300">
                        🚗
                      </div>
                      <span className="text-[7px] text-slate-500 font-mono">2.5x5.0</span>
                    </div>
                  ))
                )}
                {parkingCalculation.requiredSpaces > 10 && (
                  <div className="w-14 h-24 border border-slate-700 bg-slate-800/50 rounded-sm flex items-center justify-center text-[10px] font-bold text-gray-400 font-mono">
                    +{parkingCalculation.requiredSpaces - 10} More
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: MATERIAL QUANTITY SURVEYOR & COSTS */}
      {activeSubTab === 'materials' && (
        <div className="flex flex-col gap-5 flex-1 select-none">
          <div className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-900">
            <span className="font-semibold flex items-center gap-1.5">
              <Flame className="size-3.5 text-amber-600 animate-pulse" />
              참고: 철근콘크리트 구조 기준 시세 적용 (2026 자재 단가 기준 변경 적용 가능)
            </span>
          </div>

          {/* Price Adjustment Config */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 border border-gray-150 rounded-xl text-xs">
            <div>
              <label className="block text-gray-500 mb-1 font-medium">레미콘 단가 (1 ㎥당)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={concreteUnitPrice}
                  step="1000"
                  onChange={(e) => setConcreteUnitPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white border border-gray-200 rounded-md py-1.5 pl-2.5 pr-8 text-gray-800 font-mono"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-gray-400 font-sans">원</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-500 mb-1 font-medium">철근 단가 (1 Ton당)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={rebarUnitPrice}
                  step="10000"
                  onChange={(e) => setRebarUnitPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white border border-gray-200 rounded-md py-1.5 pl-2.5 pr-8 text-gray-800 font-mono"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-gray-400 font-sans">원</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-500 mb-1 font-medium">마감 점토벽돌 (장당)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={brickUnitPrice}
                  step="10"
                  onChange={(e) => setBrickUnitPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white border border-gray-200 rounded-md py-1.5 pl-2.5 pr-8 text-gray-800 font-mono"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-gray-400 font-sans">원</span>
              </div>
            </div>
          </div>

          {/* SPREADSHEET TABLE LIST */}
          <div className="border border-gray-200 rounded-xl overflow-hidden font-sans">
            <div className="bg-gray-50 p-3 border-b border-gray-200 grid grid-cols-12 text-xs font-bold text-gray-600">
              <span className="col-span-5">자재 품목 / 세부 요약</span>
              <span className="col-span-2 text-right">소요 물량 / 단위</span>
              <span className="col-span-2 text-right">시중 단가</span>
              <span className="col-span-3 text-right">합계 금액 (원)</span>
            </div>

            <div className="divide-y divide-gray-150">
              {estimates.map((item, idx) => (
                <div key={`m-item-${idx}`} className="p-3 bg-white grid grid-cols-12 text-xs items-center gap-0.5">
                  <div className="col-span-5 flex flex-col">
                    <span className="font-semibold text-gray-800 text-[12px]">{item.itemName}</span>
                    <span className="text-[10px] text-gray-400 font-sans tracking-tight leading-snug">{item.description}</span>
                  </div>

                  <span className="col-span-2 text-right font-mono text-gray-700 font-bold">
                    {item.quantity.toLocaleString()} <span className="font-sans font-normal text-gray-400 text-[10px]">{item.unit}</span>
                  </span>

                  <span className="col-span-2 text-right font-mono text-gray-400 text-[11px]">
                    {item.unitPrice.toLocaleString()}원
                  </span>

                  <span className="col-span-3 text-right font-mono font-bold text-gray-800">
                    {item.totalPrice.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>

            {/* Total Footer row */}
            <div className="bg-slate-50 p-4 border-t border-gray-200 grid grid-cols-12 text-sm">
              <span className="col-span-6 font-bold text-slate-800 flex items-center gap-1">
                <Coins className="size-4 text-amber-500" />
                <span>총 주요 골조 및 마감 자재비 합산</span>
              </span>
              <span className="col-span-6 text-right font-mono font-extrabold text-blue-700 text-lg">
                {totalCostSum.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 leading-snug">
            ※ 위 견적은 전기, 가구, 토목 공량 제외 순수 철근콘크리트 구조체 및 기본 마감벽돌의 산식 비례식에 근거한 설계단계 간이 추정치입니다. 실제 정밀견적 및 구조계산서 설계 내용과 환경에 따라 ±15% 가량 오차가 날 수 있습니다.
          </div>
        </div>
      )}

    </div>
  );
}
