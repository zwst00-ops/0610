import { useState, useMemo } from 'react';
import { 
  Scale, 
  RefreshCw, 
  FileCheck, 
  HelpCircle, 
  Minimize2, 
  Crop,
  Layers
} from 'lucide-react';

const STANDARD_SCALES = [1, 5, 10, 30, 50, 100, 110, 120, 150, 200, 300, 500, 600, 1000];

export default function ScaleConverter() {
  // Input states
  const [selectedScale, setSelectedScale] = useState<number>(100); // 1/100
  
  // Real to Drawing input
  const [realLength, setRealLength] = useState<number>(15); // 15 meters
  const [realUnit, setRealUnit] = useState<'m' | 'mm'>('m');

  // Drawing to Real input
  const [drawingLength, setDrawingLength] = useState<number>(120); // 120 mm
  const [drawingUnit, setDrawingUnit] = useState<'mm' | 'cm'>('mm');

  // Paper fit check inputs
  const [siteWidthReal, setSiteWidthReal] = useState<number>(30);  // 30m
  const [siteHeightReal, setSiteHeightReal] = useState<number>(20); // 20m
  const [selectedPaper, setSelectedPaper] = useState<'A3' | 'A4'>('A3');

  // 1. Convert Real To Drawing
  // Real (meters/mm) -> Paper (mm)
  const convertedToDrawing = useMemo(() => {
    const realLengthMm = realUnit === 'm' ? realLength * 1000 : realLength;
    const paperLengthMm = realLengthMm / selectedScale;
    return {
      mm: paperLengthMm,
      cm: paperLengthMm / 10
    };
  }, [realLength, realUnit, selectedScale]);

  // 2. Convert Drawing To Real
  // Paper (mm/cm) -> Real (m)
  const convertedToReal = useMemo(() => {
    const paperLengthMm = drawingUnit === 'cm' ? drawingLength * 10 : drawingLength;
    const realLengthMm = paperLengthMm * selectedScale;
    return {
      m: realLengthMm / 1000,
      mm: realLengthMm
    };
  }, [drawingLength, drawingUnit, selectedScale]);

  // 3. Multi-Scale Comparison: Size on paper for different standard scales for input realLength
  const scaleComparisons = useMemo(() => {
    const realMm = realUnit === 'm' ? realLength * 1000 : realLength;
    return STANDARD_SCALES.map((sc) => {
      const sizeOnPaperMm = realMm / sc;
      return {
        scale: sc,
        valueMm: sizeOnPaperMm,
        // Relative percentage width for visualization (Max scale is 1, so size is largest. Let's base percentage on 1:5 scale maximum or standard 400px width limit)
        percentOfMax: Math.min(100, (sizeOnPaperMm / (realMm / 30)) * 100) // normalized relative to 1/30 scale
      };
    });
  }, [realLength, realUnit]);

  // 4. Paper Fitting Check
  // Paper Sizes in mm:
  // A3: 420 x 297
  // A4: 297 x 210
  const paperFitting = useMemo(() => {
    const paperDimensions = selectedPaper === 'A3' ? { w: 420, h: 297 } : { w: 297, h: 210 };
    
    // Convert real dimensions to drawing mm
    const siteWidthDrawingMm = (siteWidthReal * 1000) / selectedScale;
    const siteHeightDrawingMm = (siteHeightReal * 1000) / selectedScale;

    // Standard margin factor in drafting is approx 10% on each side (20mm minimum)
    const marginsMm = 40; 
    const usableW = paperDimensions.w - marginsMm;
    const usableH = paperDimensions.h - marginsMm;

    // Fits both orientations?
    // Case 1: Landscape (Width to Width, Height to Height)
    const fitsLandscape = siteWidthDrawingMm <= usableW && siteHeightDrawingMm <= usableH;
    // Case 2: Portrait / Rotated (Width to Height, Height to Width)
    const fitsPortrait = siteWidthDrawingMm <= usableH && siteHeightDrawingMm <= usableW;

    const fits = fitsLandscape || fitsPortrait;

    return {
      siteWidthDrawingMm,
      siteHeightDrawingMm,
      usableW,
      usableH,
      paperW: paperDimensions.w,
      paperH: paperDimensions.h,
      fits
    };
  }, [siteWidthReal, siteHeightReal, selectedScale, selectedPaper]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="scale-converter-root">
      
      {/* 1. Left Side: Active Converters */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        
        {/* Main Conversion Panel */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Scale className="text-blue-600 size-5" />
            <h3 className="font-semibold text-gray-900 text-lg">실무 축척 및 치수 상호 변환기</h3>
          </div>

          {/* Scale Selector */}
          <div className="bg-slate-50 p-4 border border-gray-100 rounded-xl mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 font-sans">설계 도면 축척 선택 (1 : N)</label>
                <div className="text-[11px] text-gray-400">도량 환산 설계의 기준점이 될 축척 비율을 세팅하세요.</div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400 font-mono">1 :</span>
                <select 
                  value={selectedScale}
                  onChange={(e) => setSelectedScale(Number(e.target.value))}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono font-bold text-blue-700 outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {STANDARD_SCALES.map((sc) => (
                    <option key={`sc-opt-${sc}`} value={sc}>
                      {sc === 1 ? '1 (원척 / 1:1)' : sc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Real -> Drawing */}
            <div className="p-4 border border-gray-150 rounded-xl bg-gray-50/20">
              <span className="text-[11px] px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full">REAL ➔ DRAWING</span>
              <h4 className="font-semibold text-gray-800 text-xs mt-2.5 mb-3">현장 실측 전산 축소 (실제 거리에서 도면 선길이로)</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">실제 대지/건물 거리</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.1"
                      value={realLength}
                      onChange={(e) => setRealLength(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-16 font-mono text-sm"
                    />
                    <select 
                      value={realUnit}
                      onChange={(e) => setRealUnit(e.target.value as 'm' | 'mm')}
                      className="absolute right-1 top-1 bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 rounded-md py-1 px-1.5 focus:outline-hidden font-mono"
                    >
                      <option value="m">meter</option>
                      <option value="mm">mm</option>
                    </select>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-center py-1">
                  <div className="inline-block p-1 bg-white border border-gray-150 rounded-full">
                    <RefreshCw className="size-3 text-blue-500 rotate-90" />
                  </div>
                </div>

                {/* Paper Output */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 space-y-1">
                  <span className="text-[10px] text-blue-600 font-bold">출력 도면선 폭 (1/{selectedScale} 비례 축소)</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-sm font-bold text-slate-800">도면 치수:</span>
                    <span className="text-base font-extrabold text-blue-700 font-mono">
                      {convertedToDrawing.mm.toFixed(1)} <span className="text-xs font-bold text-gray-400 font-sans">mm</span>
                    </span>
                  </div>
                  <div className="text-[10.5px] text-gray-400 font-mono text-right">
                    = {convertedToDrawing.cm.toFixed(2)} cm (자 장폭 기준)
                  </div>
                </div>
              </div>
            </div>

            {/* Drawing -> Real */}
            <div className="p-4 border border-gray-150 rounded-xl bg-gray-50/20">
              <span className="text-[11px] px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full">DRAWING ➔ REAL</span>
              <h4 className="font-semibold text-gray-800 text-xs mt-2.5 mb-3">도면 실측 현장 환산 (출력선 치수에서 대지 실거리로)</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">출력 도면 실측 길이</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="1"
                      value={drawingLength}
                      onChange={(e) => setDrawingLength(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-16 font-mono text-sm"
                    />
                    <select 
                      value={drawingUnit}
                      onChange={(e) => setDrawingUnit(e.target.value as 'mm' | 'cm')}
                      className="absolute right-1 top-1 bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 rounded-md py-1 px-1.5 focus:outline-hidden font-mono"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                    </select>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-center py-1">
                  <div className="inline-block p-1 bg-white border border-gray-150 rounded-full">
                    <RefreshCw className="size-3 text-indigo-500 rotate-90" />
                  </div>
                </div>

                {/* Real Output */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 space-y-1">
                  <span className="text-[10px] text-indigo-650 font-bold">현장 실측 환산 거리 (1*{selectedScale} 비례 줌)</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-sm font-bold text-slate-800">실제 현장:</span>
                    <span className="text-base font-extrabold text-indigo-700 font-mono">
                      {convertedToReal.m.toFixed(3)} <span className="text-xs font-bold text-gray-400 font-sans">meters (m)</span>
                    </span>
                  </div>
                  <div className="text-[10.5px] text-gray-400 font-mono text-right">
                    = {convertedToReal.mm.toLocaleString()} mm (공사 물량기준)
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Paper Fitting Checker */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crop className="text-indigo-600 size-5" />
              <h3 className="font-semibold text-gray-900">도면 규격 종이 안착 검토 (A3/A4)</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5 leading-normal">
              작성하려는 실제 부지 규모가 선택한 축척 비율상으로 A3 또는 A4 제도용지에 한계 마진선 안으로 딱 맞게 인쇄될 것인지 분석합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border border-gray-100 rounded-xl bg-slate-50 mb-5 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-gray-500 mb-1 font-medium">검토 대지 가로 x 세로</label>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="number"
                    value={siteWidthReal}
                    onChange={(e) => setSiteWidthReal(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-gray-200 rounded-md py-1.5 px-2 font-mono"
                  />
                  <span className="text-gray-400 text-[10px]">x</span>
                  <input 
                    type="number"
                    value={siteHeightReal}
                    onChange={(e) => setSiteHeightReal(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-gray-200 rounded-md py-1.5 px-2 font-mono"
                  />
                  <span className="text-gray-400 font-mono">m</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-500 mb-1 font-medium">인쇄 도면 종이 규격</label>
                <div className="flex bg-white p-1 rounded-md border border-gray-200">
                  <button 
                    onClick={() => setSelectedPaper('A3')}
                    className={`flex-1 text-center py-1 rounded text-xs font-bold cursor-pointer ${
                      selectedPaper === 'A3' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    A3 (42x29cm)
                  </button>
                  <button 
                    onClick={() => setSelectedPaper('A4')}
                    className={`flex-1 text-center py-1 rounded text-xs font-bold cursor-pointer ${
                      selectedPaper === 'A4' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    A4 (29x21cm)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 leading-snug text-center sm:text-left">
              도면 1/{selectedScale} 드래프트 비례 폭: <strong className="font-mono text-gray-800">{paperFitting.siteWidthDrawingMm.toFixed(1)}mm x {paperFitting.siteHeightDrawingMm.toFixed(1)}mm</strong> 
              <br />
              <span className="text-[10px] text-gray-400">(인쇄 안전 가용구획 수치: {paperFitting.usableW}mm x {paperFitting.usableH}mm)</span>
            </div>

            <div className={`px-4 py-2 border rounded-xl flex items-center gap-1.5 text-xs font-bold ${
              paperFitting.fits 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
              : 'bg-red-50 text-red-800 border-red-100'
            }`}>
              <FileCheck className="size-4 shrink-0" />
              <span>
                {paperFitting.fits 
                  ? `인쇄 안착 성공 ${selectedPaper} 출력 가능 ○` 
                  : `인쇄 구격 초과 (${selectedPaper} 초과) ❌`
                }
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Right Side: Multi-Scale bar chart comparisons */}
      <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="text-blue-600 size-5" />
          <h3 className="font-semibold text-gray-900 text-sm">축척별 도면선 길이 비례 한눈에 비교</h3>
        </div>
        <p className="text-xs text-gray-400 mb-5 leading-normal">
          실제거리 <strong className="font-mono text-gray-700">{realLength}{realUnit}</strong>에 대해, 축척별로 출력 도면에 나타나는 상대선 길이(mm) 입니다. 스케일 감을 잡기 좋은 스마트 휠 리스트입니다.
        </p>

        {/* Visual Scroll Area */}
        <div className="space-y-3.5 flex-1 max-h-[380px] overflow-y-auto pr-1">
          {scaleComparisons.map((item) => {
            const isTargetScale = item.scale === selectedScale;
            return (
              <div 
                key={`comp-scale-${item.scale}`}
                onClick={() => setSelectedScale(item.scale)}
                className={`py-2 px-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  isTargetScale 
                  ? 'bg-blue-50/60 border-blue-200' 
                  : 'bg-gray-50/35 border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1 bg-transparent select-none">
                  <span className={`font-mono font-bold ${isTargetScale ? 'text-blue-700' : 'text-gray-700'}`}>
                    1 : {item.scale}
                  </span>
                  <span className="font-mono font-bold text-gray-800">
                    {item.valueMm.toFixed(1)} <span className="font-normal text-gray-400 text-[10px]">mm</span>
                  </span>
                </div>
                
                {/* Horizontal simple bar chart */}
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${isTargetScale ? 'bg-blue-600' : 'bg-gray-300'}`}
                    style={{ width: `${item.percentOfMax}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-150 text-[10px] text-gray-400 leading-snug flex items-center gap-1">
          <HelpCircle className="size-3.5 text-gray-400 shrink-0" />
          <span>각 축척 버튼을 클릭하면 위 축척 기준 세팅이 실시간 연동되어 동기화됩니다.</span>
        </div>
      </div>

    </div>
  );
}
