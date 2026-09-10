import fs from 'fs';
import path from 'path';

const content = `import React from 'react';
import { X, Settings, MapPin, Volume2, Monitor, RotateCcw } from 'lucide-react';
import { sound } from '../utils/soundFx';
import { KEY_NODES } from '../utils/geoCoordinates';

export default function SettingsModal({
  isOpen,
  onClose,
  customSpeCoords,
  setCustomSpeCoords,
  soundEnabled,
  setSoundEnabled,
  crtEnabled,
  setCrtEnabled,
  onResetData
}) {
  if (!isOpen) return null;

  const spePresets = [
    { name: '인디애나 코코모 인근 클러스터 (기본)', x: 1135, y: 315 },
    { name: '오하이오 배터리/반도체 공장', x: 1150, y: 300 },
    { name: '텍사스 오스틴 반도체 Fab', x: 990, y: 440 },
    { name: '애리조나 피닉스 신규 팹', x: 940, y: 390 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div className="pixel-box bg-[#0c1322] border-2 border-cyan-400 w-full max-w-lg shadow-[0_0_25px_rgba(0,240,255,0.4)]">
        
        {/* Header */}
        <div className="bg-[#131f35] px-4 py-3 border-b border-cyan-500/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-cyan-300">시스템 환경설정 및 SPE 거점 지정</h3>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 hover:bg-[#203352] text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          
          {/* 1. SPE Location Preset Selector */}
          <div className="bg-[#101b2d] border border-cyan-800 p-3 space-y-2">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              고객 SPE 지도상 위치 설정
            </div>
            <p className="text-slate-400 text-[11px]">
              미국 내 고객사 SPE 공장의 위치를 변경하면 코코모와의 육로 운송 경로가 동적으로 재설정됩니다.
            </p>
            <div className="space-y-1.5 pt-1">
              {spePresets.map((preset) => {
                const currentX = customSpeCoords?.x ?? KEY_NODES.SPE.x;
                const isSelected = Math.abs(currentX - preset.x) < 5;
                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      sound.playClick();
                      setCustomSpeCoords({ x: preset.x, y: preset.y });
                    }}
                    className={\`w-full text-left p-2 border flex items-center justify-between transition-colors \${
                      isSelected 
                        ? 'bg-emerald-950 border-emerald-400 text-emerald-300 font-bold' 
                        : 'bg-[#09111c] border-slate-700 text-slate-300 hover:border-slate-500'
                    }\`}
                  >
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">X:{preset.x} Y:{preset.y}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Visual & Sound FX */}
          <div className="bg-[#101b2d] border border-cyan-800 p-3 space-y-2">
            <div className="font-bold text-cyan-300">디스플레이 및 사운드 FX</div>
            
            <div className="flex items-center justify-between p-2 bg-[#09111c] border border-slate-700">
              <span className="flex items-center gap-2 text-slate-300">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                8-bit 레트로 비프 및 알림 경보음
              </span>
              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  sound.toggleSound(next);
                  if (next) sound.playClick();
                }}
                className={\`px-2.5 py-1 border font-bold \${soundEnabled ? 'bg-cyan-900 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-600 text-slate-400'}\`}
              >
                {soundEnabled ? '활성화 (ON)' : '음소거 (OFF)'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#09111c] border border-slate-700">
              <span className="flex items-center gap-2 text-slate-300">
                <Monitor className="w-4 h-4 text-purple-400" />
                CRT 모니터 아케이드 스캔라인
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  setCrtEnabled(!crtEnabled);
                }}
                className={\`px-2.5 py-1 border font-bold \${crtEnabled ? 'bg-purple-900 border-purple-400 text-purple-300' : 'bg-slate-800 border-slate-600 text-slate-400'}\`}
              >
                {crtEnabled ? '스캔라인 ON' : '스캔라인 OFF'}
              </button>
            </div>
          </div>

          {/* 3. Reset Defaults */}
          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={() => {
                if (confirm('초기 목데이터 상태로 복원하시겠습니까?')) {
                  sound.playClick();
                  onResetData();
                  onClose();
                }
              }}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px] underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              초기 데모 데이터셋으로 복원
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold border border-cyan-400"
            >
              확인 완료
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.resolve('./src/components/SettingsModal.jsx'), content, 'utf8');
console.log('SettingsModal.jsx created successfully.');
