import React from 'react';
import { X, Shield, Award, Radio, CheckCircle2, UserCheck, Crosshair } from 'lucide-react';
import { sound } from '../utils/soundFx';

export default function CommanderModal({
  isOpen,
  commanderType, // 'INCHEON' | 'KOKOMO'
  onClose,
  lang = 'ko',
  commanderPhotos,
  themeMode = 'light'
}) {
  if (!isOpen || !commanderType) return null;

  const isLight = themeMode === 'light';
  const isUsa = commanderType === 'KOKOMO';

  const data = isUsa ? {
    title: lang === 'ko' ? '미주법인 법인장' : 'US Subsidiary President',
    rank: lang === 'ko' ? '미주법인 총괄책임자' : 'Head of US Corporation',
    dept: lang === 'ko' ? '미주법인 본부 (Indiana Kokomo)' : 'US Headquarters (Indiana Kokomo)',
    image: commanderPhotos?.KOKOMO || '/assets/commander_usa.png',
    themeColor: 'amber',
    borderColor: isLight ? 'border-amber-400' : 'border-amber-400',
    textColor: isLight ? 'text-amber-800 font-bold' : 'text-amber-300',
    glowColor: 'shadow-[0_0_35px_rgba(251,191,36,0.45)]',
    badgeBg: isLight ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-amber-950 border-amber-500 text-amber-300',
    callsign: 'KOKOMO-LEAD-01',
    mission: lang === 'ko' 
      ? '미국 인디애나 코코모 거점 생산/물류 라인 총괄 및 고객사(SPE) 적기 공급 관리'
      : 'Overall management of Kokomo production, intermodal rail logistics & on-time SPE deliveries.',
    responsibilities: lang === 'ko' ? [
      '미주법인 3대 핵심 재고(Multi Assy, Cap Assy, Back ship) 수급 및 생산량 최종 승인',
      '롱비치항 환적 화물철도(Intermodal Freight) 미 내륙 이송 관제 및 보관 창고 운영 총괄',
      '고객 SPE 반도체 공장 직납 공급망(JIT) 안정성 유지 및 비상 조달 총괄'
    ] : [
      'Final authorization of Multi Assy, Cap Assy, and Back ship allocations',
      'Long Beach transshipment to overland rail routing & Kokomo warehouse operations',
      'Maintaining zero-downtime JIT supply lines to customer SPE production plants'
    ],
    status: lang === 'ko' ? '상시 관제중 (ACTIVE ON-DUTY)' : 'ACTIVE ON-DUTY'
  } : {
    title: lang === 'ko' ? '영업팀 납기, 계획 담당 이경록 책임' : 'Sales Delivery & Planning Lead (Lee Kyung-rok)',
    rank: lang === 'ko' ? '영업팀 납기·계획 책임자' : 'Head of Sales & Dispatch Planning',
    dept: lang === 'ko' ? '영업관리 및 출하계획본부 (대한민국 인천)' : 'Global Sales & Planning HQ (Incheon, KR)',
    image: commanderPhotos?.INCHEON || '/assets/commander_incheon.png',
    themeColor: 'cyan',
    borderColor: isLight ? 'border-blue-400' : 'border-cyan-400',
    textColor: isLight ? 'text-blue-800 font-bold' : 'text-cyan-300',
    glowColor: 'shadow-[0_0_35px_rgba(0,240,255,0.45)]',
    badgeBg: isLight ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-cyan-950 border-cyan-500 text-cyan-300',
    callsign: 'INCHEON-LEAD-01',
    mission: lang === 'ko'
      ? '대한민국 인천 거점 검사대기·출하합격 로트 판정 및 태평양 횡단 해상/항공 선적 관리'
      : 'Management over Incheon inspection pass, QA lots & trans-Pacific vessel dispatches.',
    responsibilities: lang === 'ko' ? [
      '인천 사업장 로트(LOT) 단위 품질 검사대기 승인 및 즉시 출하합격(선적대기) 판정',
      '태평양 횡단 정기 컨테이너선(SEA) 및 긴급 항공편(AIR) 차수 편성·출항 스케줄 확정',
      '미주법인 요청 긴급 오더 신속 배정 및 글로벌 공급 리드타임 단축 관리'
    ] : [
      'Final sign-off on lot-by-lot inspection clearance and immediate dispatch readiness',
      'Scheduling regular trans-Pacific ocean container batches and emergency air freights',
      'Rapid prioritization of urgent US corporate requisitions and lead time optimization'
    ],
    status: lang === 'ko' ? '영업·출하 관제중 (ACTIVE ON-DUTY)' : 'ACTIVE ON-DUTY'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono animate-fadeIn">
      <div 
        className={`pixel-box border-2 ${data.borderColor} w-full max-w-lg relative overflow-hidden rounded-md shadow-2xl ${
          isLight ? 'bg-white' : `bg-[#090f1d] ${data.glowColor}`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Tactical Banner */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#111e35] border-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${data.textColor} animate-pulse`} />
            <span className={`text-[11px] font-black tracking-wider ${
              isLight ? 'text-slate-900' : 'text-slate-200'
            }`}>
              {lang === 'ko' ? '거점 책임자 프로필 (STATION LEAD DOSSIER)' : 'STATION LEAD DOSSIER'}
            </span>
            <span className={`text-[9px] px-1.5 py-0.2 border ${data.badgeBg} font-bold rounded`}>
              {data.callsign}
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className={`p-1 rounded transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'hover:bg-[#1f3150] text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Commander Photo & Identity Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            
            {/* Photo Box with Military Reticle Frame */}
            <div className="relative group flex-shrink-0">
              <div className={`w-36 h-48 sm:w-40 sm:h-52 ${isLight ? 'bg-slate-100' : 'bg-[#060a14]'} border-2 ${data.borderColor} p-1 relative shadow-md overflow-hidden rounded-xs`}>
                <img 
                  src={data.image} 
                  alt={data.title}
                  className="w-full h-full object-cover object-top filter brightness-105 contrast-105"
                />
                
                {/* Corner Crosshair Reticles */}
                <div className={`absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 ${data.borderColor}`}></div>
                <div className={`absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 ${data.borderColor}`}></div>
                <div className={`absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 ${data.borderColor}`}></div>
                <div className={`absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 ${data.borderColor}`}></div>

                {/* Live Status Watermark */}
                <div className="absolute bottom-1.5 inset-x-1.5 bg-black/85 border border-slate-700 py-0.5 text-center">
                  <span className="text-[9px] font-black text-emerald-400 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                    {data.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                  <Award className={`w-4 h-4 ${data.textColor}`} />
                  <span className={`text-[11px] font-bold ${data.textColor} uppercase tracking-wider`}>
                    {data.rank}
                  </span>
                </div>
                <h2 className={`text-xl sm:text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'} tracking-tight`}>
                  {data.title}
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'} mt-0.5`}>
                  {data.dept}
                </p>
              </div>

              {/* Mission Statement */}
              <div className={`p-2.5 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0b1424] border-slate-800 text-slate-300'} border text-[11px] leading-relaxed rounded`}>
                <span className={`font-bold ${data.textColor} block mb-0.5`}>
                  {lang === 'ko' ? '▶ 주요 담당 업무:' : '▶ Key Responsibilities:'}
                </span>
                {data.mission}
              </div>

              {/* Responsibilities list */}
              <div className={`space-y-1 text-[10px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <span className={`${isLight ? 'text-slate-600' : 'text-slate-400'} font-bold block`}>
                  {lang === 'ko' ? '주요 승인 및 관리 업무:' : 'Key Authorizations & Management:'}
                </span>
                {data.responsibilities.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-left">
                    <CheckCircle2 className={`w-3 h-3 ${isLight ? (isUsa ? 'text-amber-600' : 'text-blue-600') : data.textColor} flex-shrink-0 mt-0.5`} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Close Button */}
          <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'} flex justify-end`}>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className={`px-5 py-2 font-bold border text-xs shadow-sm active:scale-95 transition-all rounded ${
                isLight 
                  ? (isUsa ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700') 
                  : (isUsa ? 'bg-gradient-to-r from-amber-800 to-amber-700 border-amber-400 text-amber-100' : 'bg-gradient-to-r from-cyan-800 to-cyan-700 border-cyan-400 text-cyan-100')
              }`}
            >
              {lang === 'ko' ? '확인 닫기' : 'Close Dossier'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
