import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Lock,
  Radio,
  Clock,
  User,
  CheckCircle2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { CustomerCallLog } from '../../types';
import { saveCrmCallLogsToStorage, loadCrmCallLogsFromStorage } from '../../lib/storage';
import { notifyApp } from '../../lib/appNotify';

interface MaskedCloudCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callerName: string;
  callerRole: string;
  callerPhoneMasked?: string;
  calleeName: string;
  calleeRole: string;
  calleePhoneMasked?: string;
  caseId?: string;
  onCallLogged?: (callLog: CustomerCallLog) => void;
}

export const MaskedCloudCallModal: React.FC<MaskedCloudCallModalProps> = ({
  isOpen,
  onClose,
  callerName,
  callerRole,
  callerPhoneMasked = '۰۹۱۲***۸۷۶۵',
  calleeName,
  calleeRole,
  calleePhoneMasked = '۰۹۳۵***۲۳۴۱',
  caseId,
  onCallLogged
}) => {
  const [callState, setCallState] = useState<'RINGING' | 'CONNECTED' | 'ENDED'>('RINGING');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callTopic, setCallTopic] = useState('هماهنگی و مشاوره ارزیابی پرونده');
  const timerRef = useRef<any>(null);

  // Generate a random proxy session code once
  const proxyLine = '۰۲۱-۹۱۰۹۸۸۰۰';
  const proxyPin = useRef(Math.floor(1000 + Math.random() * 9000).toString()).current;

  // Lifecycle: Simulated ringing to connected after 3.5s
  useEffect(() => {
    if (!isOpen) {
      setCallState('RINGING');
      setDurationSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const ringTimeout = setTimeout(() => {
      setCallState('CONNECTED');
    }, 3200);

    return () => clearTimeout(ringTimeout);
  }, [isOpen]);

  // Duration Timer when connected
  useEffect(() => {
    if (callState === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setDurationSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallState('ENDED');
    const finalDurationMin = Math.max(1, Math.ceil(durationSeconds / 60));

    // Auto record into CRM call logs
    const newLog: CustomerCallLog = {
      id: `CALL-CLOUD-${Date.now().toString().slice(-6)}`,
      caseId: caseId || undefined,
      contactName: calleeName,
      contactPhone: `${calleePhoneMasked} (تماس ابری واسط)`,
      contactRole: (calleeRole.includes('زیان') ? 'زیان‌دیده' : calleeRole.includes('مقصر') ? 'مقصر' : 'زیان‌دیده') as any,
      // باید دقیقاً یکی از مقادیر اتحادیه‌ی CustomerCallLog باشد (types.ts:1233)
      callDirection: 'خروجی (تماس کارشناس)',
      topic: 'هماهنگی کارشناس میدانی',
      sentiment: 'آرام و راضی',
      durationMinutes: finalDurationMin,
      notes: `تماس امن ابری ضدتبانی توسط ${callerName} (${callerRole}) با ${calleeName} (${calleeRole}). مدت مکالمه: ${durationSeconds} ثانیه. سرور واسط: ${proxyLine}#${proxyPin}. صوت تماس در سرور آرشیو گردید.`,
      agentName: callerName,
      agentId: 'cloud-voip-proxy',
      callDate: new Date().toLocaleDateString('fa-IR'),
      callTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      followUpRequired: false,
      resolvedInCall: true
    };

    const existingLogs = loadCrmCallLogsFromStorage();
    saveCrmCallLogsToStorage([newLog, ...existingLogs]);
    if (onCallLogged) onCallLogged(newLog);

    notifyApp(`تماس امن ابری پایان یافت و گزارش آن در پرونده CRM ذخیره شد (${formatTimer(durationSeconds)}).`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in" dir="rtl">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-indigo-500/30 flex flex-col items-center text-center space-y-5 relative overflow-hidden">
        
        {/* Top Anti-Collusion Badge */}
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-400">
            <Lock className="w-3.5 h-3.5" />
            <span>تماس ابری واسط امن (ضد تبانی)</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-400/30">
            VoIP Proxy Mask
          </span>
        </div>

        {/* Security Warning Notice */}
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-300 leading-relaxed space-y-1">
          <div className="flex items-center justify-center gap-1 font-bold text-amber-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>پنهان‌سازی شماره طرفین و نظارت صوتی</span>
          </div>
          <p>
            شماره مستقیم طرفین مخفی بوده و تماس از طریق درگاه واسط ({proxyLine}) برقرار و توسط واحد حراست و بازرسی ضبط می‌گردد.
          </p>
        </div>

        {/* Callee Avatar & Info */}
        <div className="space-y-2">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center mx-auto shadow-xl border-2 border-indigo-400">
              <User className="w-10 h-10 text-white" />
            </div>
            {callState === 'CONNECTED' && (
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <Radio className="w-3 h-3 text-white animate-pulse" />
              </span>
            )}
          </div>

          <div>
            <h3 className="font-black text-lg text-white">{calleeName}</h3>
            <p className="text-xs text-indigo-300 font-bold">{calleeRole}</p>
            <div className="mt-1 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
              <span>شماره ماسک:</span>
              <span className="text-amber-400 font-bold" dir="ltr">{calleePhoneMasked}</span>
            </div>
          </div>
        </div>

        {/* Call State & Live Timer */}
        <div className="space-y-1 py-1">
          {callState === 'RINGING' && (
            <div className="flex items-center justify-center gap-2 text-indigo-300 font-bold text-xs animate-pulse">
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>در حال برقراری تماس از سرور ابری...</span>
            </div>
          )}

          {callState === 'CONNECTED' && (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono font-black text-lg">
                <Clock className="w-4 h-4" />
                <span>{formatTimer(durationSeconds)}</span>
              </div>
              <p className="text-[10px] text-emerald-300/80 font-bold flex items-center justify-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
                <span>مکالمه فعال و ضبط صوتی در بستر امن ابری</span>
              </p>
            </div>
          )}

          {callState === 'ENDED' && (
            <div className="text-rose-400 font-bold text-xs">
              تماس خاتمه یافت و لاگ در پرونده ثبت شد.
            </div>
          )}
        </div>

        {/* Audio Waveform Simulator when connected */}
        {callState === 'CONNECTED' && (
          <div className="flex items-center justify-center gap-1 h-8 w-full px-8">
            {[40, 70, 30, 85, 60, 95, 45, 80, 50, 65, 35].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.6 + (i % 4) * 0.2}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Controls Bar */}
        <div className="w-full pt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isMuted ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isMuted ? 'میکروفون بسته است' : 'بستن میکروفون'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={handleEndCall}
            className="w-16 h-16 rounded-3xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-all cursor-pointer"
            title="قطع تماس"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          <button
            type="button"
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isSpeaker ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isSpeaker ? 'اسپیکر فعال است' : 'فعال‌سازی اسپیکر'}
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Sub-info: Proxy Session Details */}
        <div className="text-[10px] text-slate-400 font-mono border-t border-white/10 pt-2 w-full flex justify-between">
          <span>کد موقت تماس: #{proxyPin}</span>
          <span>درگاه: {proxyLine}</span>
        </div>

      </div>
    </div>
  );
};
