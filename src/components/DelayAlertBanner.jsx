import React, { useEffect, useState } from 'react';
import { AlertTriangle, BellRing, X, ArrowRight } from 'lucide-react';
import { sound } from '../utils/soundFx';

function formatBatchNo(batchNo, lang) {
  if (lang !== 'en' || !batchNo) return batchNo;
  return String(batchNo)
    .replace(/해상\s*/g, 'SEA ')
    .replace(/항공\s*/g, 'AIR ')
    .replace(/긴급\s*/g, 'URGENT ')
    .replace(/차\b/g, '')
    .replace(/\(지연\)/g, '(DELAYED)')
    .trim();
}

function formatDelayReason(reason, lang) {
  if (lang !== 'en' || !reason) return reason;
  if (reason.includes('롱비치') || reason.includes('세관') || reason.includes('통관') || reason.includes('철도') || reason.includes('환적')) {
    return 'Long Beach customs clearance & inland rail transshipment delay';
  }
  if (reason.includes('ETA') && reason.includes('지연')) {
    return 'Transit overdue (ETA elapsed)';
  }
  if (reason.includes('기상') || reason.includes('태풍')) {
    return 'Severe weather & ocean storm rerouting';
  }
  return reason;
}

export default function DelayAlertBanner({
  delayedShipments,
  onSelectShipment,
  lang = 'ko'
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (delayedShipments.length > 0 && !dismissed) {
      sound.playAlert();
    }
  }, [delayedShipments.length, dismissed]);

  if (delayedShipments.length === 0 || dismissed) {
    return null;
  }

  const primaryDelay = delayedShipments[0];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-[92%] font-mono animate-bounce">
      <div className="pixel-box-warning bg-[#20090e]/95 border-2 border-rose-500 p-3 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.5)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-rose-900/60 border border-rose-500 flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-rose-400 uppercase tracking-wide">
                {lang === 'ko' ? '[경고] 운송 ETA 지연 발생!' : '[ALERT] TRANSIT ETA DELAY DETECTED!'}
              </span>
              <span className="text-[10px] bg-rose-950 px-1.5 py-0.5 border border-rose-600 font-bold">
                {formatBatchNo(primaryDelay.batchNo, lang)}
              </span>
            </div>
            <div className="text-slate-300 text-[11px] mt-0.5">
              {lang === 'ko' ? '사유: ' : 'Reason: '}<span className="text-rose-300 font-semibold">{formatDelayReason(primaryDelay.delayReason, lang) || (lang === 'ko' ? '통관/환적 지연' : 'Customs / Rail transshipment delay')}</span> ({lang === 'ko' ? '수량' : 'Qty'}: {primaryDelay.quantity.toLocaleString()} EA)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              if (onSelectShipment) onSelectShipment(primaryDelay);
            }}
            className="px-2.5 py-1 text-xs bg-rose-900 hover:bg-rose-800 border border-rose-400 text-white font-bold flex items-center gap-1 rounded transition-colors"
          >
            <span>{lang === 'ko' ? '상세 확인' : 'View Details'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setDismissed(true);
            }}
            className="p-1 hover:bg-rose-900/50 text-rose-400 hover:text-white rounded"
            title="Close Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
