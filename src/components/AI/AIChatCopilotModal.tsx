/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Interactive AI Claims Copilot
 * Context-aware AI chat assistant for both Customer and Assessor personas.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  HelpCircle,
  CheckCircle2,
  FileText,
  Clock,
  ShieldCheck,
  Zap,
  ArrowDownCircle,
  Copy,
  Check
} from 'lucide-react';
import { ClaimCase, UserSession } from '../../types';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  suggestedActions?: Array<{ label: string; actionKey: string }>;
}

interface AIChatCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: ClaimCase;
  session: UserSession;
  userRole: 'customer' | 'assessor' | 'operator';
}

export const AIChatCopilotModal: React.FC<AIChatCopilotModalProps> = ({
  isOpen,
  onClose,
  claim,
  session,
  userRole
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting based on role
  useEffect(() => {
    if (!isOpen) return;

    const expertName = claim.assignedExpert?.name || 'کارشناس ارزیاب دانا';
    const branchName = claim.assignedBranch || 'مجتمع خسارت مرکزی';
    const carModel = claim.carType || claim.culpritCarType || 'خودرو زیان‌دیده';

    if (messages.length === 0) {
      if (userRole === 'customer') {
        setMessages([
          {
            id: 'init-customer',
            sender: 'ai',
            text: `سلام جناب ${claim.victimName || session.name} عزیز! 🌸\nمن دستیار هوشمند پرونده شما (کد رهگیری: ${claim.id}) هستم.\n\nپرونده شما برای خودروی ${carModel} به ${expertName} در ${branchName} ارجاع شده و در حال ارزیابی است. در صورت وجود هرگونه ابهام درباره روند خسارت، مدارک لازم یا افت قیمت در خدمت شما هستم.`,
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            suggestedActions: [
              { label: 'پرونده الان در چه مرحله‌ایه؟', actionKey: 'status' },
              { label: 'چه مدارکی باید بارگذاری کنم؟', actionKey: 'docs' },
              { label: 'آیا به ماشین من افت قیمت تعلق می‌گیره؟', actionKey: 'depreciation' },
              { label: 'چطور به مبلغ اعتراض کنم؟', actionKey: 'dispute' }
            ]
          }
        ]);
      } else {
        setMessages([
          {
            id: 'init-assessor',
            sender: 'ai',
            text: `سلام همکار گرامی، جناب ${session.name}! 🤖\nمن دستیار هوش مصنوعی میز کار ارزیابی پرونده ${claim.id} هستم.\n\nکلیه مستندات تصویری، استعلام کروکی و قیمت‌گذاری اولیه قطعات برای خودروی ${carModel} آماده است. آماده پاسخ به سوالات فنی، آیین‌نامه‌ای یا تنظیم متن اخطاریه کسری مدارک هستم.`,
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            suggestedActions: [
              { label: 'تحلیل انطباق خسارت با کروکی', actionKey: 'croqui_analysis' },
              { label: 'استعلام نرخ قطعات و اجرت', actionKey: 'parts_pricing' },
              { label: 'محاسبه افت قیمت آیین‌نامه ۸۵', actionKey: 'deprec_rules' },
              { label: 'متن اخطار کسری مدرک', actionKey: 'draft_warning' }
            ]
          }
        ]);
      }
    }
  }, [isOpen, claim.id, userRole]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // AI Generation
    setTimeout(() => {
      let reply = '';
      const norm = text.toLowerCase();
      const car = claim.carType || claim.victimCarType || 'خودرو';
      const expert = claim.assignedExpert?.name || 'کارشناس ارزیاب';

      if (userRole === 'customer') {
        if (norm.includes('مرحله') || norm.includes('وضعیت') || norm.includes('کجاست')) {
          reply = `📌 **وضعیت پرونده شما:**\nهم‌اکنون پرونده شما در وضعیت «${claim.status}» قرار دارد.\nکارشناس مسئول: ${expert}.\nمدارک و کروکی بارگذاری شده در حال بررسی فنی هستند. پس از تایید نهایی ارزیاب، مبلغ ارزیابی در همین پنل به شما نمایش داده می‌شود و می‌توانید با تایید شماره شبا، وجه خسارت را دریافت نمایید.`;
        } else if (norm.includes('مدرک') || norm.includes('کسری') || norm.includes('بارگذاری')) {
          const filesCount = (claim.files?.length || 0) + (claim.additionalDocs?.length || 0);
          reply = `📄 **مدارک مورد نیاز:**\nشما تا کنون ${filesCount} مدرک بارگذاری کرده‌اید. جهت تسریع در فرآیند، اطمینان حاصل کنید که:\n۱. تصویر واضح پلاک و کارت خودرو\n۲. تصاویر باکیفیت از زاویه نزدیک و زاویه کامل ناحیه آسیب\n۳. فاکتور قطعات (در صورت تعویض قطعه اورجینال)\nدر بخش «مدارک و مستندات» بارگذاری شده باشد.`;
        } else if (norm.includes('افت قیمت') || norm.includes('افت')) {
          reply = `🚗 **قوانین افت قیمت خودرو:**\nبا توجه به اینکه خودروی شما ${car} است، در صورت عدم وجود سابقه تصادف قبلی در همان ناحیه و مدل خودرو کمتر از ۵ سال، افت قیمت بر اساس نظر کارشناس رسمی دادگستری یا توافق طرفین قابل مطالبه از مقصر حادثه می‌باشد. بیمه ثالث خسارت مستقیم فیزیکی را پوشش می‌دهد.`;
        } else if (norm.includes('اعتراض') || norm.includes('مخالفت') || norm.includes('کم')) {
          reply = `⚖️ **نحوه ثبت اعتراض:**\nدر صورتی که پس از ثبت مبلغ ارزیابی توسط کارشناس، با مبلغ موافق نبودید، می‌توانید از دکمه «اعتراض به ارزیابی» در صفحه پرونده استفاده کنید. پرونده مستقیماً به کمیسیون بازبینی و ارزیاب ارشد ارجاع داده خواهد شد.`;
        } else {
          reply = `پاسخ هوشمند هوش مصنوعی به سوال شما درباره خودروی ${car}:\nپرونده شما در جریان رسیدگی سریع قرار دارد. کارشناس مربوطه (${expert}) به صورت برخط در حال پیگیری است و هرگونه تغییر وضعیت یا درخواست مدرک جدید به صورت پیامک و در همین پنل به اطلاع شما خواهد رسید.`;
        }
      } else {
        // Assessor Role
        if (norm.includes('کروکی') || norm.includes('انطباق')) {
          reply = `🔍 **تحلیل انطباق با کروکی راهور:**\n• کروکی فراجا: کد پیگیری ${claim.sceneReportCode || 'الکترونیک ثبت شده'}\n• سازگاری برخورد: برخورد زاویه‌ای عقب سمت راست با زاویه گردش مقصر همخوانی ۱۰۰٪ دارد.\n• اصالت‌سنجی تصاویر: عدم وجود تناقض در رنگ خودرو و پلاک.`;
        } else if (norm.includes('نرخ') || norm.includes('قیمت') || norm.includes('قطعات')) {
          reply = `💰 **استعلام نرخ روز قطعات (${car}):**\n• پوسته سپر اصلی: ۲۸,۵۰۰,۰۰۰ ریال\n• اجرت صافکاری و نقاشی کوره: ۱۲,۵۰۰,۰۰۰ الی ۱۶,۰۰۰,۰۰۰ ریال\n• کسر داغی مصوب: ۱۰ الی ۱۵ درصد قیمت نو\n• کسر استهلاک قانونی: ۵ درصد به ازای سال دوم به بعد.`;
        } else if (norm.includes('افت قیمت') || norm.includes('آیین نامه') || norm.includes('قوانین')) {
          reply = `📜 **ضوابط و آیین‌نامه ۸۵ بیمه مرکزی:**\n• خسارت قطعات پلاستیکی و مصرفی مشمول استهلاک تا سقف ۲۰٪ است.\n• در پرونده‌های بدون کروکی تا سقف خسارت مالی بدون کروکی نیازمند رویت فیزیکی خودرو و احراز اصالت می‌باشد.`;
        } else if (norm.includes('اخطار') || norm.includes('متن') || norm.includes('پیام')) {
          reply = `📝 **متن پیشنهادی اخطار کسری مدرک:**\n«زیان‌دیده محترم، پرونده خسارت خودرو ${car} به علت عدم وضوح تصاویر ناحیه سپر و پلاک در حالت تعلیق قرار دارد. لطفاً ظرف مدت ۴۸ ساعت نسبت به بارگذاری تصاویر تکمیلی در سامانه اقدام فرمایید.»`;
        } else {
          reply = `تحلیل فنی هوش مصنوعی برای کارشناس ارزیاب:\nاطلاعات پرونده ${claim.id} با پایگاه داده قیمت‌گذاری و پرونده‌های مشابه هم‌پوشانی دارد. پیشنهاد می‌گردد پیش‌نویس خودکار را در برگه ارزیابی بازبینی و اعمال فرمایید.`;
        }
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 text-white w-full max-w-2xl h-[620px] rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 px-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white">
                  {userRole === 'customer' ? 'دستیار هوشمند زیان‌دیده (AI Copilot)' : 'دستیار هوشمند ارزیاب خسارت (AI Copilot)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  برخط و پاسخگو
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                متصل به پرونده {claim.id} • {claim.carType || 'خودرو'} • {claim.status}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/40">
          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isAi
                      ? 'bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isAi ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`space-y-2 max-w-[85%] ${isAi ? 'text-right' : 'text-right'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isAi
                        ? 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tr-none'
                        : 'bg-indigo-600 text-white rounded-tl-none font-medium'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    
                    {isAi && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-slate-400">
                        <span>{m.time}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(m.id, m.text)}
                          className="hover:text-slate-200 transition-colors flex items-center gap-1"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">کپی شد</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>کپی متن</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Suggested quick actions */}
                  {isAi && m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggestedActions.map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(act.label)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-200 hover:text-white font-bold text-[10px] transition-colors flex items-center gap-1 active:scale-95"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800 px-4 py-2 rounded-2xl text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                <span className="mr-1">هوش مصنوعی در حال تحلیل و پاسخ...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              userRole === 'customer'
                ? 'سوال خود را درباره پرونده، افت قیمت یا زمان پرداخت بپرسید...'
                : 'استعلام قیمت قطعه، تحلیل کروکی یا تنظیم اخطار...'
            }
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-md shadow-indigo-600/30"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
