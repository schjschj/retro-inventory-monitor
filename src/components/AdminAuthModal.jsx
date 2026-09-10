import React, { useState } from 'react';
import { Lock, Unlock, Key, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/soundFx';

export default function AdminAuthModal({
  isOpen,
  onClose,
  onSuccess,
  lang = 'ko'
}) {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '1001') {
      sound.playSuccess();
      setErrorMsg('');
      setPassword('');
      onSuccess('INCHEON_LEAD');
      onClose();
    } else if (password === '2002') {
      sound.playSuccess();
      setErrorMsg('');
      setPassword('');
      onSuccess('USA_LEAD');
      onClose();
    } else if (password === '31796') {
      sound.playSuccess();
      setErrorMsg('');
      setPassword('');
      onSuccess('MASTER_ADMIN');
      onClose();
    } else {
      sound.playAlert();
      setErrorMsg(
        lang === 'en'
          ? 'Invalid PIN! Access denied.'
          : '보안 PIN 번호가 일치하지 않습니다. 다시 확인해주세요.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono animate-fadeIn">
      <div className="pixel-box bg-[#0c1322] border-2 border-cyan-400 w-full max-w-sm p-5 shadow-[0_0_35px_rgba(0,240,255,0.45)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/50 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-sm font-black text-slate-100 tracking-wider">
              {lang === 'en' ? 'STATION & ADMIN AUTHENTICATION' : '담당자 권한 인증'}
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setErrorMsg('');
              setPassword('');
              onClose();
            }}
            className="p-1 hover:bg-[#203352] text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-xs text-slate-300 leading-relaxed bg-[#060b14] p-3 border border-slate-700">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
              <Key className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Security Clearance Required' : '보안 인가 등급 요구됨'}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === 'en'
                ? 'Enter Station Lead PIN (Incheon / US Kokomo) or Master Admin passcode to unlock data entry.'
                : '인천 거점 담당자, 미주법인 담당자, 또는 마스터 관리자 보안 PIN 번호를 입력하십시오.'}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              {lang === 'en' ? 'ENTER PASSCODE (PIN):' : '관리자 비밀번호 입력:'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="● ● ● ● ●"
              autoFocus
              className="w-full px-3 py-2 bg-[#09101d] border-2 border-cyan-500 text-cyan-200 text-center tracking-[0.3em] text-lg font-bold font-mono outline-none focus:border-amber-400 focus:shadow-[0_0_12px_rgba(251,191,36,0.5)] transition-all"
            />
          </div>

          {errorMsg && (
            <div className="p-2 bg-rose-950/80 border border-rose-500 text-rose-300 text-[11px] font-bold flex items-center gap-1.5 animate-bounce">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setErrorMsg('');
                setPassword('');
                onClose();
              }}
              className="flex-1 py-2 bg-[#17253b] hover:bg-[#203352] border border-slate-600 text-slate-300 text-xs font-bold rounded"
            >
              {lang === 'en' ? 'Cancel' : '취소'}
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'en' ? 'VERIFY ACCESS' : '인증 확인'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
