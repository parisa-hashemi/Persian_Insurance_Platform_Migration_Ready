import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  Copy,
  Check,
  X,
  MessageSquare,
  Bot,
  Send,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { INSURANCE_FAQ_LIST, FAQ_CATEGORIES, FaqItem } from '../../data/faqData';
import { notifyApp } from '../../lib/appNotify';

interface FaqAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectAnswerForChat?: (answer: string) => void;
}

export const FaqAssistantModal: React.FC<FaqAssistantModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onSelectAnswerForChat
}) => {
  const [activeTab, setActiveTab] = useState<'faq_list' | 'interactive_bot'>('faq_list');
  const [selectedCategory, setSelectedCategory] = useState<string>('همه موضوعات');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive Bot State
  const [botMessages, setBotMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string; relatedFaqs?: FaqItem[] }>>([
    {
      sender: 'bot',
      text: 'سلام! من دستیار هوشمند پاسخگویی به سوالات متداول بیمه‌گذاران هستم. می‌توانید سوال خود را درباره مدارک، سقف تعهدات، نحوه پرداخت، افت قیمت، مراحل اعتراض یا بازدید مجدد بپرسید.',
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [botInput, setBotInput] = useState('');

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return INSURANCE_FAQ_LIST.filter(item => {
      const matchCategory = selectedCategory === 'همه موضوعات' || item.category === selectedCategory;
      if (!searchQuery.trim()) return matchCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchText =
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.keywords.some(k => k.toLowerCase().includes(q));

      return matchCategory && matchText;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    notifyApp('متن پاسخ با موفقیت کپی شد.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAskBot = (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: questionText.trim(),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    // Keyword match engine
    const words = questionText.trim().toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const scoredFaqs = INSURANCE_FAQ_LIST.map(faq => {
      let score = 0;
      words.forEach(w => {
        if (faq.question.toLowerCase().includes(w)) score += 3;
        if (faq.keywords.some(k => k.toLowerCase().includes(w))) score += 2;
        if (faq.answer.toLowerCase().includes(w)) score += 1;
      });
      return { faq, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    let botReplyText = '';
    let matchedItems: FaqItem[] = [];

    if (scoredFaqs.length > 0) {
      const best = scoredFaqs[0].faq;
      matchedItems = scoredFaqs.slice(0, 3).map(s => s.faq);
      botReplyText = `بر اساس مستندات مصوب، پاسخ مرتبط با پرسش شما به شرح زیر است:\n\n«${best.answer}»`;
    } else {
      botReplyText = 'متاسفانه پاسخ مستقیمی برای این عبارت در بانک ۲۶ پرسش متداول یافت نشد. می‌توانید با پشتیبانی ۱۶۴۰ تماس گرفته یا سوال را با کلیدواژه‌هایی چون «شبا»، «افت قیمت»، «اعتراض» یا «بازدید مجدد» جستجو فرمایید.';
    }

    const botMsg = {
      sender: 'bot' as const,
      text: botReplyText,
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      relatedFaqs: matchedItems
    };

    setBotMessages(prev => [...prev, userMsg, botMsg]);
    setBotInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border-2 border-slate-200 text-slate-900 flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  موتور پاسخگویی به سوالات متداول بیمه‌گذاران (FAQ Bot)
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ۲۶ پرسش استاندارد
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                سامانه هوشمند راهنمایی بیمه‌گذاران، کارشناسان خسارت و کارشناسان CRM
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('faq_list')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'faq_list'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>بانک سوالات دسته‌بندی‌شده ({INSURANCE_FAQ_LIST.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('interactive_bot')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'interactive_bot'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>بات گفتگوی هوشمند (چت و پاسخ آنی)</span>
          </button>
        </div>

        {/* TAB 1: FAQ BROWSER */}
        {activeTab === 'faq_list' && (
          <div className="flex flex-col flex-1 overflow-hidden mt-3 space-y-3">
            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو در سوالات و کلیدواژه‌ها (مثال: شبا، افت قیمت، دمونتاژ، اعتراض، کروکی)..."
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none text-xs">
              {FAQ_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold text-[11px] transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Questions Accordion List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                  <p>موردی متناسب با جستجوی شما یافت نشد.</p>
                </div>
              ) : (
                filteredFaqs.map(item => {
                  const isExpanded = expandedFaqId === item.id;
                  const isCopied = copiedId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-2xl bg-white hover:border-indigo-300 transition-all overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaqId(isExpanded ? null : item.id)}
                        className="w-full text-right p-3.5 flex items-start justify-between gap-3 cursor-pointer bg-slate-50/70 hover:bg-indigo-50/40"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-100 text-indigo-800">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                            {item.question}
                          </h4>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-indigo-600' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-white border-t border-slate-100 space-y-3 animate-in fade-in">
                          <p className="text-xs text-slate-700 leading-relaxed font-medium bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
                            {item.answer}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex flex-wrap gap-1">
                              {item.keywords.map(kw => (
                                <span key={kw} className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                  #{kw}
                                </span>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(item.id, item.answer)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">کپی شد</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>کپی پاسخ</span>
                                  </>
                                )}
                              </button>

                              {onSelectAnswerForChat && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectAnswerForChat(item.answer);
                                    onClose();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>ارسال در چت</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE FAQ BOT */}
        {activeTab === 'interactive_bot' && (
          <div className="flex flex-col flex-1 overflow-hidden mt-3 space-y-3">
            {/* Quick suggested chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none text-xs">
              {[
                'مدارک لازم برای تشکیل پرونده',
                'خسارت افت قیمت',
                'زمان واریز به شبا',
                'شرایط بدون کروکی',
                'بازدید مجدد بعد از دمونتاژ',
                'شورای کارشناسی عالی'
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleAskBot(chip)}
                  className="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] whitespace-nowrap border border-indigo-200 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              {botMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line font-medium">{msg.text}</p>

                    {/* Related FAQs buttons */}
                    {msg.relatedFaqs && msg.relatedFaqs.length > 1 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block">سوالات مرتبط دیگر:</span>
                        {msg.relatedFaqs.slice(1).map(rf => (
                          <button
                            key={rf.id}
                            type="button"
                            onClick={() => handleAskBot(rf.question)}
                            className="w-full text-right text-[11px] p-1.5 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 font-bold block transition-colors truncate"
                          >
                            • {rf.question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex gap-2 shrink-0">
              <input
                type="text"
                value={botInput}
                onChange={e => setBotInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskBot(botInput)}
                placeholder="سوال خود را بنویسید (مثال: آیا شبا حتماً باید به نام زیان‌دیده باشد؟)..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => handleAskBot(botInput)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>ارسال</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
