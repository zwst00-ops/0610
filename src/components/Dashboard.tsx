import { useState } from 'react';
import MassSimulator from './MassSimulator';
import ParkingEstimator from './ParkingEstimator';
import ScaleConverter from './ScaleConverter';
import { 
  Building2, 
  Car, 
  Scale, 
  HelpCircle, 
  ArrowRight, 
  Info,
  Layers,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'mass' | 'parking' | 'scale'>('mass');
  const [showDemoTips, setShowDemoTips] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between" id="dashboard-root">
      
      {/* 1. Header Banner */}
      <header className="bg-white border-b border-gray-100 shadow-3xs sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and Tagline */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 rounded-lg text-white flex items-center justify-center shadow-xs">
                <Building2 className="size-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-gray-900 tracking-tight font-sans">
                  ArchStudio <span className="text-[11px] font-normal text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1 font-mono">v1.2</span>
                </h1>
                <p className="text-[10px] text-gray-400 font-medium">건축 실무자를 위한 올인원 법규 및 설계 도량 보정 툴박스</p>
              </div>
            </div>

            {/* Main Tabs Navigation */}
            <nav className="flex space-x-1" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('mass')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'mass'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                <Layers className="size-3.5" />
                <span className="hidden sm:inline">정북 일조사선 & 매스</span>
                <span className="sm:hidden">일조사선</span>
              </button>

              <button
                onClick={() => setActiveTab('parking')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'parking'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                <Car className="size-3.5" />
                <span className="hidden sm:inline">법정 주차 & 자재량</span>
                <span className="sm:hidden">주차/자재</span>
              </button>

              <button
                onClick={() => setActiveTab('scale')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'scale'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                <Scale className="size-3.5" />
                <span>스케일 컨버터</span>
              </button>
            </nav>

          </div>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col gap-6">
        
        {/* API Key Not Required Notice & Demo Tips Box */}
        {showDemoTips && (
          <div className="bg-radial from-slate-900 to-slate-950 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-sm relative overflow-hidden" id="demo-guide-banner">
            {/* Background design elements */}
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
              <Building2 className="size-64 text-white" />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-cyan-500/20 text-cyan-400 font-extrabold px-2.5 py-0.5 rounded-full tracking-wider font-mono">
                  PRESENTATION PREPARATION DIRECTORY (API Key-free)
                </span>
                <button 
                  onClick={() => setShowDemoTips(false)}
                  className="text-xs text-slate-500 hover:text-slate-200 cursor-pointer"
                  title="가이드창 닫기"
                >
                  ✕ 닫기
                </button>
              </div>

              <h2 className="text-base font-bold text-white mt-1.5 leading-snug">
                시연 발표를 성공적으로 이끄는 실무 사용 가이드 
              </h2>
              <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed">
                본 프로그램은 API 연결 없이 완벽한 자립형 수학적 공식과 실무 건축 규정을 내장하여 작동하므로, 네트워크나 인증 이슈 염려 없이 즉시 안정적인 프리젠테이션 진행이 가능합니다.
              </p>

              {/* Demo Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-[11px] leading-relaxed">
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
                    <span>1단계</span>
                    <ArrowRight className="size-3" />
                    <span>일조사선 검토</span>
                  </div>
                  <span>1F~3F 매스의 정북 이격거리 슬라이더를 하나씩 좌우로 조절해 보세요. 사선 영역 돌파 시 상단 지표 및 SVG 도면 블록이 즉각 <strong>빨간색 침범 경고(❌)</strong>로 변경되는 역동적인 전산 시뮬레이션을 청중에게 강조하십시오.</span>
                </div>

                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
                    <span>2단계</span>
                    <ArrowRight className="size-3" />
                    <span>원클릭 연면적 연동</span>
                  </div>
                  <span>주차/자재 탭으로 이동한 뒤 <strong>‘매스 시뮬레이션 연동’</strong> 버튼을 눌러보세요. 앞서 디자인한 건물의 성적표(연면적)가 즉시 복사되며, 법정 주차대수와 골조 공사비 견적이 실시간 스프레드시트로 계산됩니다.</span>
                </div>

                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
                    <span>3단계</span>
                    <ArrowRight className="size-3" />
                    <span>스케일 실사 인쇄 판단</span>
                  </div>
                  <span>컨버터 탭에서 대지 너비(예: 35m x 25m)를 넣고 A3나 A4 용지를 교체해 보세요. 축척 비율에 따른 도면선 두께 산출 비례 바와 함께 실제 종이 안 안에 부지가 여백을 가지고 <strong>성공적으로 배치되는지 여부(FileCheck)</strong>가 판정됩니다.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content Areas with Micro Animation */}
        <div className="flex-1 min-h-0" id="tab-content-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'mass' && <MassSimulator />}
              {activeTab === 'parking' && <ParkingEstimator />}
              {activeTab === 'scale' && <ScaleConverter />}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 justify-center">
            <span>국토교통부 표준 건축법 시행령 제86조, 주차장법 시행령 제6조 기준 설계</span>
            <span className="text-gray-300">|</span>
            <span className="text-blue-500 font-semibold">설계 안정 검증 프로그램</span>
          </div>
          <div className="flex items-center gap-1 justify-center text-gray-400">
            <span>Made for Architect Pro Demo with</span>
            <Heart className="size-3.5 feed-heart text-red-500 fill-red-500 animate-pulse" />
            <span>by Gemini Codecraft</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
