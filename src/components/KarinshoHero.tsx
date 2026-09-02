import React from 'react';

/**
 * KarinshoHero — هیرو مدرن «کاراینشو»
 * صحنه‌ی متحرک: خودروی برقی در حال حرکت با ردِ نور چراغ عقب (قرمز) و
 * رگه‌های سرعتِ آبی، آسمان‌خراش‌ها و جاده‌ی پرسپکتیوی که به‌صورت بی‌پایان اسکرول می‌شود.
 * تماماً SVG + CSS (بدون تصویر خارجی) — سبک، شارپ و ریسپانسیو.
 */
export const KarinshoHero: React.FC = () => {
  return (
    <section className="krn-hero" dir="rtl" aria-label="کاراینشو — سامانه هوشمند پرداخت و ارزیابی خسارت">
      <style>{`
        .krn-hero {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(1200px 480px at 78% -12%, rgba(59,130,246,.16), transparent 60%),
            radial-gradient(900px 420px at 12% 8%, rgba(99,102,241,.12), transparent 55%),
            linear-gradient(180deg, #f6f9ff 0%, #eef4fd 42%, #ffffff 100%);
        }
        .krn-hero * { box-sizing: border-box; }

        /* ---------- Wordmark ---------- */
        .krn-brand {
          position: relative; z-index: 5;
          display: flex; flex-direction: column; align-items: center;
          padding-top: clamp(28px, 5vw, 52px);
          text-align: center;
        }
        .krn-brand-row { display: flex; align-items: center; gap: 14px; }
        .krn-wordmark {
          font-weight: 900;
          font-size: clamp(40px, 6.5vw, 72px);
          line-height: 1;
          letter-spacing: -0.01em;
          background: linear-gradient(105deg, #0b1e3f 18%, #1d4ed8 42%, #7db4ff 50%, #1d4ed8 58%, #3b82f6 88%);
          background-size: 240% 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
          animation: krn-wordshine 5.5s ease-in-out infinite;
          filter: drop-shadow(0 2px 14px rgba(29,78,216,.14));
        }
        .krn-tagline {
          margin-top: 12px;
          font-size: clamp(12px, 1.6vw, 15px);
          font-weight: 700;
          color: #47587a;
        }
        .krn-tagline b { color: #1d4ed8; }

        /* dotted texture, top corners */
        .krn-dots {
          position: absolute; inset-inline-start: 4%; top: 34px; width: 120px; height: 72px; opacity: .5;
          background-image: radial-gradient(rgba(29,78,216,.35) 1.2px, transparent 1.3px);
          background-size: 14px 14px;
          mask-image: linear-gradient(200deg, #000, transparent 85%);
          pointer-events: none;
        }
        .krn-dots.krn-dots-b { inset-inline-start: auto; inset-inline-end: 4%; }

        /* ---------- Scene ---------- */
        .krn-scene {
          position: relative;
          width: 100%;
          height: clamp(230px, 34vw, 420px);
          margin-top: clamp(4px, 1vw, 14px);
        }
        .krn-scene > svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

        /* infinite scrolling groups (world moves RIGHT because car drives LEFT) */
        @keyframes krn-scroll-far  { from { transform: translateX(0) } to { transform: translateX(600px) } }
        @keyframes krn-scroll-mid  { from { transform: translateX(0) } to { transform: translateX(600px) } }
        @keyframes krn-scroll-near { from { transform: translateX(0) } to { transform: translateX(600px) } }
        .krn-far  { animation: krn-scroll-far  38s linear infinite; }
        .krn-mid  { animation: krn-scroll-mid  16s linear infinite; }
        .krn-near { animation: krn-scroll-near  5.5s linear infinite; }

        /* car body float + wheels */
        @keyframes krn-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3.5px) } }
        .krn-car { animation: krn-float 2.6s ease-in-out infinite; }
        @keyframes krn-spin { to { transform: rotate(-360deg) } }
        .krn-rim { transform-origin: center; transform-box: fill-box; animation: krn-spin .55s linear infinite; }

        /* light trails */
        @keyframes krn-trail {
          0%   { opacity: .0; transform: scaleX(.86); }
          35%  { opacity: 1;  }
          100% { opacity: .25; transform: scaleX(1.06); }
        }
        .krn-trail { transform-origin: left center; transform-box: fill-box; animation: krn-trail 1.5s ease-in-out infinite alternate; }
        .krn-trail-2 { animation-duration: 2.1s; animation-delay: .4s; }

        @keyframes krn-streak {
          from { transform: translateX(0);      opacity: 0; }
          12%  { opacity: .9; }
          70%  { opacity: .55; }
          to   { transform: translateX(760px);  opacity: 0; }
        }
        .krn-streak   { animation: krn-streak 1.6s linear infinite; }
        .krn-streak-b { animation-duration: 2.3s; animation-delay: .7s; }
        .krn-streak-c { animation-duration: 1.9s; animation-delay: 1.2s; }

        /* dust puffs behind wheels */
        @keyframes krn-dust {
          0%   { transform: translate(0,0) scale(.5);   opacity: .55; }
          100% { transform: translate(120px,-16px) scale(1.7); opacity: 0; }
        }
        .krn-dust   { animation: krn-dust 1.4s ease-out infinite; }
        .krn-dust-b { animation-duration: 1.9s; animation-delay: .5s; }
        .krn-dust-c { animation-duration: 1.6s; animation-delay: .95s; }

        /* headlight beam flicker */
        @keyframes krn-beam { 0%,100% { opacity: .5 } 50% { opacity: .85 } }
        .krn-beam { animation: krn-beam 2.2s ease-in-out infinite; }

        /* taillight pulse */
        @keyframes krn-tail { 0%,100% { opacity: .9 } 50% { opacity: 1; filter: drop-shadow(0 0 10px rgba(255,59,92,.9)); } }
        .krn-tail { animation: krn-tail 1.3s ease-in-out infinite; }

        /* clouds drifting */
        @keyframes krn-cloud { from { transform: translateX(0) } to { transform: translateX(760px) } }
        .krn-cloud-a { animation: krn-cloud 46s linear infinite; }
        .krn-cloud-b { animation: krn-cloud 64s linear infinite; animation-delay: -20s; }

        /* درخشش داخل خودِ حروف لوگوتایپ */
        @keyframes krn-wordshine {
          0%, 55% { background-position: 120% 0 }
          100%    { background-position: -60% 0 }
        }

        /* aurora blobs in sky */
        @keyframes krn-aurora {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-40px, 14px) scale(1.12); }
        }
        .krn-aurora   { animation: krn-aurora 11s ease-in-out infinite; }
        .krn-aurora-b { animation-duration: 15s; animation-delay: 3s; }

        /* sparkles rising from the light trail */
        @keyframes krn-spark {
          0%   { transform: translate(0,0) scale(1);        opacity: 0; }
          15%  { opacity: .95; }
          100% { transform: translate(90px,-56px) scale(.2); opacity: 0; }
        }
        .krn-spark   { animation: krn-spark 2.2s ease-out infinite; }
        .krn-spark-b { animation-duration: 2.9s; animation-delay: .8s; }
        .krn-spark-c { animation-duration: 2.5s; animation-delay: 1.5s; }
        .krn-spark-d { animation-duration: 3.2s; animation-delay: .3s; }

        /* floating glass chips over the scene */
        .krn-chip {
          position: absolute; z-index: 6;
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 14px;
          background: rgba(255,255,255,.72);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(147,197,253,.6);
          border-radius: 16px;
          box-shadow: 0 12px 30px -12px rgba(37,99,235,.35);
          font-size: 11.5px; font-weight: 800; color: #1e3a8a;
          white-space: nowrap;
          animation: krn-chip-float 4.2s ease-in-out infinite;
        }
        .krn-chip svg { flex: none; }
        .krn-chip-2 { animation-delay: 1.2s; animation-duration: 5s; }
        .krn-chip-3 { animation-delay: 2.2s; animation-duration: 4.6s; }
        @keyframes krn-chip-float {
          0%,100% { transform: translateY(0) }
          50%     { transform: translateY(-9px) }
        }
        @media (max-width: 900px) { .krn-chip-3 { display: none } }
        @media (max-width: 640px) { .krn-chip-2 { display: none } .krn-chip { font-size: 10.5px; padding: 7px 11px } }

        @media (prefers-reduced-motion: reduce) {
          .krn-far, .krn-mid, .krn-near, .krn-car, .krn-rim, .krn-trail, .krn-trail-2,
          .krn-streak, .krn-streak-b, .krn-streak-c, .krn-dust, .krn-dust-b, .krn-dust-c,
          .krn-beam, .krn-tail, .krn-cloud-a, .krn-cloud-b,
          .krn-aurora, .krn-aurora-b, .krn-spark, .krn-spark-b, .krn-spark-c,
          .krn-spark-d, .krn-chip { animation: none !important; }
        }
      `}</style>

      {/* بافت نقطه‌ای گوشه‌ها */}
      <div className="krn-dots" aria-hidden="true" />
      <div className="krn-dots krn-dots-b" aria-hidden="true" />

      {/* ---------- لوگوتایپ ---------- */}
      <div className="krn-brand">
        <div className="krn-brand-row">
          {/* آیکن ماشین در حال حرکت */}
          <svg width="72" height="44" viewBox="0 0 72 44" fill="none" aria-hidden="true" style={{ overflow: 'visible' }}>
            <g>
              {/* speed dashes (behind, i.e. to the right of a left-facing car) */}
              <rect x="46" y="14" width="22" height="3.4" rx="1.7" fill="#3b82f6" opacity=".85" />
              <rect x="52" y="21" width="16" height="3.4" rx="1.7" fill="#60a5fa" opacity=".7" />
              <rect x="48" y="28" width="20" height="3.4" rx="1.7" fill="#93c5fd" opacity=".6" />
              {/* car glyph, facing left */}
              <path
                d="M4 27c0-2 1-3.4 3-4l4.4-1.2 5-6.2c1-1.2 2.4-1.9 4-1.9h11c1.7 0 3.2.8 4.2 2.1l4.2 6h3.7c2 0 3.5 1.6 3.5 3.6v3.2c0 1.4-1.1 2.4-2.5 2.4h-2.1a5.6 5.6 0 0 1-11 0H18.6a5.6 5.6 0 0 1-11 0H6.5C5.1 31 4 30 4 28.6V27Z"
                fill="none" stroke="#1d4ed8" strokeWidth="2.6" strokeLinejoin="round"
              />
              <path d="M18 15.5 14.6 20h8.2v-4.5H18Zm7.8 0V20h8.6l-3.1-4.5h-5.5Z" fill="#1d4ed8" opacity=".9" />
              <circle cx="13.2" cy="31.6" r="3.4" fill="none" stroke="#1d4ed8" strokeWidth="2.6" />
              <circle cx="35.9" cy="31.6" r="3.4" fill="none" stroke="#1d4ed8" strokeWidth="2.6" />
            </g>
          </svg>
          <h1 className="krn-wordmark">کاراینـشو</h1>
        </div>
        <p className="krn-tagline">
          سامانه هوشمند <b>پرداخت و ارزیابی خسارت</b> بیمه خودرو
        </p>
      </div>

      {/* ---------- صحنه‌ی متحرک ---------- */}
      <div className="krn-scene">
        {/* چیپ‌های شیشه‌ای شناور */}
        <div className="krn-chip" style={{ top: '12%', insetInlineStart: '7%' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1z"/></svg>
          <span>ارزیابی هوشمند با هوش مصنوعی</span>
        </div>
        <div className="krn-chip krn-chip-2" style={{ top: '18%', insetInlineEnd: '8%' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          <span>تسویه خسارت در ۲۴ ساعت</span>
        </div>
        <div className="krn-chip krn-chip-3" style={{ bottom: '34%', insetInlineEnd: '16%' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          <span>۹۸٪ رضایت مشتریان</span>
        </div>
        <svg viewBox="0 0 1440 420" preserveAspectRatio="xMinYMax slice">
          <defs>
            {/* sky glow */}
            <radialGradient id="krnSun" cx="72%" cy="8%" r="42%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity=".95" />
              <stop offset="60%" stopColor="#dbeafe" stopOpacity=".5" />
              <stop offset="100%" stopColor="#dbeafe" stopOpacity="0" />
            </radialGradient>
            {/* road */}
            <linearGradient id="krnRoad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dfe9f6" />
              <stop offset="100%" stopColor="#f3f7fd" />
            </linearGradient>
            {/* red taillight trail (car faces LEFT → trail extends to the RIGHT) */}
            <linearGradient id="krnTrailR" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff3b5c" stopOpacity=".95" />
              <stop offset="45%" stopColor="#ff4d6d" stopOpacity=".45" />
              <stop offset="100%" stopColor="#ff8fa3" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="krnTrailB" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563eb" stopOpacity=".8" />
              <stop offset="55%" stopColor="#3b82f6" stopOpacity=".3" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="krnStreak" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity=".65" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
            </linearGradient>
            {/* car body */}
            <linearGradient id="krnBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="55%" stopColor="#0b1e3f" />
              <stop offset="100%" stopColor="#060f24" />
            </linearGradient>
            <linearGradient id="krnGlass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bfdbfe" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="krnBeamG" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#fff7d6" stopOpacity=".9" />
              <stop offset="100%" stopColor="#fff7d6" stopOpacity="0" />
            </linearGradient>
            <filter id="krnSoft" x="-40%" y="-120%" width="180%" height="340%">
              <feGaussianBlur stdDeviation="26" />
            </filter>
            <radialGradient id="krnShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0b1e3f" stopOpacity=".28" />
              <stop offset="100%" stopColor="#0b1e3f" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* آسمان و هاله‌ی نور */}
          <rect x="0" y="0" width="1440" height="420" fill="url(#krnSun)" />

          {/* هاله‌های آرورا در آسمان */}
          <g aria-hidden="true" filter="url(#krnSoft)">
            <ellipse className="krn-aurora"   cx="380"  cy="60" rx="250" ry="58" fill="#93c5fd" opacity=".16" />
            <ellipse className="krn-aurora krn-aurora-b" cx="1080" cy="46" rx="290" ry="64" fill="#c7d2fe" opacity=".18" />
          </g>

          {/* ابرهای شناور */}
          <g fill="#ffffff" aria-hidden="true">
            <g className="krn-cloud-a" opacity=".85">
              {[-760, 0].map((ox) => (
                <g key={ox} transform={`translate(${ox},0)`}>
                  <ellipse cx="180" cy="86"  rx="64" ry="17" />
                  <ellipse cx="222" cy="76"  rx="40" ry="14" />
                  <ellipse cx="560" cy="120" rx="52" ry="14" />
                </g>
              ))}
            </g>
            <g className="krn-cloud-b" opacity=".6">
              {[-760, 0].map((ox) => (
                <g key={ox} transform={`translate(${ox},0)`}>
                  <ellipse cx="360" cy="140" rx="70" ry="15" />
                  <ellipse cx="410" cy="130" rx="42" ry="12" />
                  <ellipse cx="700" cy="92"  rx="58" ry="14" />
                </g>
              ))}
            </g>
          </g>

          {/* کوه‌های محو دوردست */}
          <path d="M0 258 L150 196 L295 250 L430 205 L560 258 Z" fill="#e2ecf9" opacity=".8" />
          <path d="M820 258 L980 208 L1120 252 L1265 200 L1440 258 L1440 262 L820 262 Z" fill="#e2ecf9" opacity=".7" />

          {/* اسکای‌لاین — لایه‌ی دور (اسکرول آهسته) */}
          <g className="krn-far" opacity=".55">
            <g fill="#c7d9f2">
              {/* one 600px tile, repeated 4x to cover 1440px viewport plus scroll offset */}
              {[-600, 0, 600, 1200].map((ox) => (
                <g key={ox} transform={`translate(${ox},0)`}>
                  <rect x="40" y="150" width="26" height="112" rx="2" />
                  <rect x="78" y="120" width="34" height="142" rx="2" />
                  <rect x="126" y="170" width="22" height="92" rx="2" />
                  <rect x="210" y="98" width="40" height="164" rx="3" />
                  <rect x="262" y="142" width="26" height="120" rx="2" />
                  <rect x="330" y="118" width="30" height="144" rx="2" />
                  <rect x="378" y="160" width="20" height="102" rx="2" />
                  <rect x="452" y="88" width="44" height="174" rx="3" />
                  <rect x="510" y="136" width="28" height="126" rx="2" />
                </g>
              ))}
            </g>
            {/* پنجره‌های ریز */}
            <g fill="#9db9e0" opacity=".55">
              {[-600, 0, 600, 1200].map((ox) => (
                <g key={ox} transform={`translate(${ox},0)`}>
                  <rect x="218" y="112" width="24" height="3" /><rect x="218" y="126" width="24" height="3" />
                  <rect x="460" y="102" width="28" height="3" /><rect x="460" y="118" width="28" height="3" />
                  <rect x="336" y="132" width="18" height="3" />
                </g>
              ))}
            </g>
          </g>

          {/* جاده */}
          <rect x="0" y="262" width="1440" height="158" fill="url(#krnRoad)" />
          {/* افق جاده */}
          <rect x="0" y="260" width="1440" height="3" fill="#b9cdea" opacity=".9" />
          {/* گاردریل نوری کنار جاده (مثل رفرنس) */}
          <rect x="0" y="292" width="1440" height="4" rx="2" fill="#3b82f6" opacity=".25" />

          {/* خط‌چین‌های وسط جاده — اسکرول سریع */}
          <g className="krn-near">
            {[-600, 0, 600, 1200].map((ox) => (
              <g key={ox} transform={`translate(${ox},0)`} fill="#93b6e6">
                <rect x="30"  y="332" width="86" height="9" rx="4.5" opacity=".9" />
                <rect x="180" y="332" width="86" height="9" rx="4.5" opacity=".9" />
                <rect x="330" y="332" width="86" height="9" rx="4.5" opacity=".9" />
                <rect x="480" y="332" width="86" height="9" rx="4.5" opacity=".9" />
              </g>
            ))}
          </g>
          {/* خطوط سرعت روی آسفالت */}
          <g className="krn-mid" opacity=".5">
            {[-600, 0, 600, 1200].map((ox) => (
              <g key={ox} transform={`translate(${ox},0)`} fill="#c3d6f0">
                <rect x="60"  y="386" width="150" height="5" rx="2.5" />
                <rect x="300" y="398" width="110" height="5" rx="2.5" />
                <rect x="470" y="378" width="90"  height="5" rx="2.5" />
              </g>
            ))}
          </g>

          {/* تیرهای چراغ برق کنار جاده — لایه‌ی نزدیک */}
          <g className="krn-near" aria-hidden="true">
            {[-600, 0, 600, 1200].map((ox) => (
              <g key={ox} transform={`translate(${ox},0)`}>
                <rect x="118" y="196" width="5" height="66" rx="2.5" fill="#b6c9e8" />
                <rect x="98" y="192" width="34" height="6" rx="3" fill="#b6c9e8" />
                <circle cx="98" cy="200" r="6" fill="#fde68a" />
                <circle cx="98" cy="200" r="13" fill="#fde68a" opacity=".28" />
              </g>
            ))}
          </g>

          {/* رگه‌های نور سرعت که از پشت ماشین رد می‌شوند */}
          <g>
            <rect className="krn-streak"   x="620" y="238" width="230" height="5" rx="2.5" fill="url(#krnStreak)" />
            <rect className="krn-streak krn-streak-b" x="560" y="210" width="180" height="4" rx="2" fill="url(#krnStreak)" />
            <rect className="krn-streak krn-streak-c" x="680" y="300" width="260" height="5" rx="2.5" fill="url(#krnStreak)" />
          </g>

          {/* ====== خودرو (رو به چپ) + ردِ نور ====== */}
          <g transform="translate(300,168)">
            {/* ردِ قرمز چراغ عقب — از عقب ماشین به سمت راست کشیده می‌شود */}
            <g>
              <rect className="krn-trail"          x="326" y="54"  width="660" height="14" rx="6.5" fill="url(#krnTrailR)" />
              <rect className="krn-trail krn-trail-2" x="328" y="74" width="500" height="7" rx="3.5" fill="url(#krnTrailR)" opacity=".7" />
              {/* ردِ آبی نئونی زیر بدنه */}
              <rect className="krn-trail krn-trail-2" x="310" y="118" width="560" height="9" rx="4.5" fill="url(#krnTrailB)" />
            </g>

            {/* جرقه‌های ریز بلندشونده از ردِ نور */}
            <g aria-hidden="true">
              <circle className="krn-spark"   cx="420" cy="60" r="3.2" fill="#ff8fa3" />
              <circle className="krn-spark krn-spark-b" cx="560" cy="66" r="2.6" fill="#fda4af" />
              <circle className="krn-spark krn-spark-c" cx="500" cy="120" r="2.8" fill="#93c5fd" />
              <circle className="krn-spark krn-spark-d" cx="680" cy="58" r="2.2" fill="#fecdd3" />
            </g>

            {/* سایه متحرک زیر ماشین */}
            <ellipse cx="180" cy="152" rx="185" ry="17" fill="url(#krnShadow)" />

            {/* گرد و غبار پشت چرخ‌ها */}
            <g fill="#dbe7f6">
              <circle className="krn-dust"   cx="330" cy="140" r="13" />
              <circle className="krn-dust krn-dust-b" cx="345" cy="148" r="9" />
              <circle className="krn-dust krn-dust-c" cx="322" cy="150" r="7" />
            </g>

            <g className="krn-car">
              {/* نور جلو */}
              <path className="krn-beam" d="M16 60 L-230 38 L-230 92 L20 78 Z" fill="url(#krnBeamG)" />

              {/* بدنه — سدان اسپرت رو به چپ */}
              <path
                d="M8 96
                   C 10 78, 26 64, 52 58
                   L 96 50
                   C 118 30, 150 18, 192 16
                   C 232 14, 264 24, 286 44
                   L 300 56
                   C 322 60, 336 68, 340 82
                   C 343 92, 341 102, 334 108
                   L 316 112
                   L 60 112
                   L 26 110
                   C 13 108, 7 104, 8 96 Z"
                fill="url(#krnBody)"
              />
              {/* شیشه‌ها */}
              <path
                d="M104 52 C 124 34 152 24 190 23 C 222 22 248 30 268 46 L 252 50 L 200 52 Z"
                fill="url(#krnGlass)" opacity=".95"
              />
              <path d="M196 24 L 200 52 L 252 50 C 240 36 220 27 196 24 Z" fill="#dbeafe" opacity=".55" />
              {/* خط کاراکتر بدنه */}
              <path d="M30 84 C 110 76 240 74 330 84" stroke="#3b82f6" strokeWidth="2.2" fill="none" opacity=".5" />
              {/* دستگیره */}
              <rect x="176" y="66" width="26" height="4" rx="2" fill="#3b82f6" opacity=".6" />
              {/* چراغ جلو */}
              <path d="M12 74 L 34 68 L 36 78 L 14 84 Z" fill="#eaf2ff" />
              <path d="M12 74 L 34 68 L 35 72 L 13 78 Z" fill="#ffffff" />
              {/* چراغ عقب LED */}
              <g className="krn-tail">
                <path d="M318 58 L 340 64 L 338 76 L 316 72 Z" fill="#ff3b5c" />
                <rect x="322" y="60" width="16" height="3.4" rx="1.7" fill="#ffd7de" opacity=".9" />
              </g>

              {/* چرخ جلو */}
              <g transform="translate(84,112)">
                <circle r="30" fill="#0a1530" />
                <circle r="29" fill="none" stroke="#1e3a8a" strokeWidth="2" opacity=".8" />
                <g className="krn-rim">
                  <circle r="17" fill="#101d3d" />
                  {[0, 72, 144, 216, 288].map((a) => (
                    <rect key={a} x="-1.9" y="-16" width="3.8" height="12" rx="1.9" fill="#33508f" transform={`rotate(${a})`} />
                  ))}
                  <circle r="4.2" fill="#7fb0f7" />
                </g>
              </g>
              {/* چرخ عقب */}
              <g transform="translate(276,112)">
                <circle r="30" fill="#0a1530" />
                <circle r="29" fill="none" stroke="#1e3a8a" strokeWidth="2" opacity=".8" />
                <g className="krn-rim">
                  <circle r="17" fill="#101d3d" />
                  {[0, 72, 144, 216, 288].map((a) => (
                    <rect key={a} x="-1.9" y="-16" width="3.8" height="12" rx="1.9" fill="#33508f" transform={`rotate(${a})`} />
                  ))}
                  <circle r="4.2" fill="#7fb0f7" />
                </g>
              </g>
            </g>
          </g>

          {/* محو شدن پایین صحنه به سفید تا کارت ورود تمیز بنشیند */}
          <rect x="0" y="330" width="1440" height="90" fill="url(#krnFadeBottom)" />
          <defs>
            <linearGradient id="krnFadeBottom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};
