import React, { useState } from 'react';

/**
 * KarinshoHero — هیرو مدرن «کاراینشو»
 * صحنه‌ی متحرک: خودروی برقی در حال حرکت با ردِ نور چراغ عقب (قرمز) و
 * رگه‌های سرعتِ آبی، آسمان‌خراش‌ها و جاده‌ی پرسپکتیوی که به‌صورت بی‌پایان اسکرول می‌شود.
 * تماماً SVG + CSS (بدون تصویر خارجی) — سبک، شارپ و ریسپانسیو.
 */
export const KarinshoHero: React.FC = () => {
  const [turbo, setTurbo] = useState(false);
  return (
    <section className={`krn-hero${turbo ? ' krn-turbo' : ''}`} dir="rtl" aria-label="کاراینشو — سامانه هوشمند پرداخت و ارزیابی خسارت">
      <style>{`
        .krn-hero {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(1200px 480px at 78% -12%, rgba(59,130,246,.16), transparent 60%),
            radial-gradient(900px 420px at 12% 8%, rgba(37,99,235,.10), transparent 55%),
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

        /* skyline continuing up behind the wordmark, so the top band isn't empty */
        .krn-skyline-top {
          position: absolute; inset-inline: 0; top: 0;
          height: clamp(150px, 16vw, 300px);
          z-index: 0; pointer-events: none;
          -webkit-mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.55) 34%, #000 58%, rgba(0,0,0,.55) 82%, transparent 100%);
          mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.55) 34%, #000 58%, rgba(0,0,0,.55) 82%, transparent 100%);
        }
        .krn-skyline-top > svg {
          position: absolute; inset: 0; width: 100%; height: 100%;
          display: block; opacity: .42;
        }

        /* ---------- Scene ---------- */
        .krn-scene {
          position: relative;
          width: 100%;
          height: clamp(230px, 29.2vw, 548px);
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


        /* ================= حالت تِربو ================= */
        .krn-turbo-btn {
          position: absolute; z-index: 7;
          top: clamp(104px, 10vw, 176px); inset-inline-start: clamp(12px, 3vw, 40px);
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 999px; cursor: pointer;
          border: 1px solid rgba(147,197,253,.7);
          background: rgba(255,255,255,.78);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          color: #1e3a8a; font-weight: 900; font-size: 12.5px;
          box-shadow: 0 14px 34px -14px rgba(37,99,235,.45);
          transition: transform .18s ease, box-shadow .25s ease, background .25s ease, color .25s ease, border-color .25s ease;
          user-select: none;
        }
        .krn-turbo-btn:hover { transform: translateY(-2px) scale(1.03); }
        .krn-turbo-btn:active { transform: scale(.96); }
        .krn-turbo .krn-turbo-btn {
          background: linear-gradient(120deg, #ff3b5c, #ff7a18);
          color: #fff; border-color: rgba(255,122,24,.65);
          box-shadow: 0 16px 40px -12px rgba(255,59,92,.65), 0 0 22px rgba(255,122,24,.45);
          animation: krn-btnpulse 1.1s ease-in-out infinite;
        }
        @keyframes krn-btnpulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
        @media (max-width: 640px) {
          .krn-turbo-btn {
            top: 10px; inset-inline-start: auto; inset-inline-end: 12px;
            padding: 8px 13px; font-size: 11px;
          }
        }

        /* سرعت بیشترِ دنیا + چرخ‌ها در حالت تربو */
        .krn-turbo .krn-far  { animation-duration: 17s; }
        .krn-turbo .krn-mid  { animation-duration: 7s; }
        .krn-turbo .krn-near { animation-duration: 2.2s; }
        .krn-turbo .krn-rim  { animation-duration: .2s; }
        .krn-turbo .krn-dust   { animation-duration: .75s; }
        .krn-turbo .krn-dust-b { animation-duration: .95s; }
        .krn-turbo .krn-dust-c { animation-duration: .85s; }
        .krn-turbo .krn-beam { opacity: .95; }
        .krn-turbo .krn-tail { animation-duration: .5s; }

        /* لرزش نامحسوس بدنه در سرعت بالا */
        @keyframes krn-shake {
          0%,100% { transform: translateY(0) }
          25%     { transform: translateY(-2.4px) }
          50%     { transform: translateY(.8px) }
          75%     { transform: translateY(-1.4px) }
        }
        .krn-turbo .krn-car { animation: krn-shake .3s linear infinite; }

        /* افکت‌های ویژه تربو: پیش‌فرض پنهان */
        .krn-turbo-fx { opacity: 0; transition: opacity .35s ease; }
        .krn-turbo .krn-turbo-fx { opacity: 1; }

        /* دود اگزوز */
        @keyframes krn-smoke {
          0%   { transform: translate(0,0) scale(.35); opacity: 0; }
          12%  { opacity: .55; }
          100% { transform: translate(165px,-40px) scale(2.3); opacity: 0; }
        }
        .krn-smoke   { animation: krn-smoke 1.15s ease-out infinite; }
        .krn-smoke-b { animation-duration: 1.5s;  animation-delay: .35s; }
        .krn-smoke-c { animation-duration: 1.3s;  animation-delay: .7s; }
        .krn-smoke-d { animation-duration: 1.7s;  animation-delay: 1s; }

        /* دونه‌های قرمز (جرقه‌های چراغ عقب) */
        @keyframes krn-redp-1 { 0% { transform: translate(0,0) scale(1); opacity: 1 } 100% { transform: translate(200px,-14px) scale(.3); opacity: 0 } }
        @keyframes krn-redp-2 { 0% { transform: translate(0,0) scale(1); opacity: 1 } 100% { transform: translate(230px, 10px) scale(.35); opacity: 0 } }
        @keyframes krn-redp-3 { 0% { transform: translate(0,0) scale(1); opacity: 1 } 100% { transform: translate(180px, 26px) scale(.3); opacity: 0 } }
        .krn-redp   { filter: drop-shadow(0 0 6px rgba(255,59,92,.95)); }
        .krn-redp-a { animation: krn-redp-1 .8s  linear infinite; }
        .krn-redp-b { animation: krn-redp-2 1.05s linear infinite; animation-delay: .2s; }
        .krn-redp-c { animation: krn-redp-3 .9s  linear infinite; animation-delay: .45s; }
        .krn-redp-d { animation: krn-redp-1 1.2s linear infinite; animation-delay: .6s; }
        .krn-redp-e { animation: krn-redp-2 .75s linear infinite; animation-delay: .85s; }

        /* شعله اگزوز */
        @keyframes krn-flame {
          0%,100% { transform: scaleX(1);   opacity: .85; }
          50%     { transform: scaleX(1.6); opacity: 1;  }
        }
        .krn-flame { transform-origin: 336px 130px; animation: krn-flame .18s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .krn-far, .krn-mid, .krn-near, .krn-car, .krn-rim, .krn-trail, .krn-trail-2,
          .krn-streak, .krn-streak-b, .krn-streak-c, .krn-dust, .krn-dust-b, .krn-dust-c,
          .krn-beam, .krn-tail, .krn-cloud-a, .krn-cloud-b,
          .krn-aurora, .krn-aurora-b, .krn-spark, .krn-spark-b, .krn-spark-c,
          .krn-spark-d, .krn-chip, .krn-smoke, .krn-smoke-b, .krn-smoke-c, .krn-smoke-d,
          .krn-redp-a, .krn-redp-b, .krn-redp-c, .krn-redp-d, .krn-redp-e,
          .krn-flame, .krn-turbo-btn { animation: none !important; }
        }
      `}</style>

      {/* ادامه‌ی خط آسمان در نوار بالایی، پشت لوگوتایپ */}
      <div className="krn-skyline-top krn-parallax" data-krn-depth="0.25" aria-hidden="true">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none">
          <g fill="#cddffa">
            {[-480, 0, 480, 960, 1440].map((ox) => (
              <g key={ox} transform={`translate(${ox},0)`}>
                <rect x="14" y="96" width="30" height="104" rx="2" />
                <rect x="56" y="58" width="38" height="142" rx="3" />
                <rect x="106" y="122" width="24" height="78" rx="2" />
                <rect x="146" y="78" width="34" height="122" rx="2" />
                <rect x="196" y="40" width="44" height="160" rx="3" />
                <rect x="254" y="110" width="26" height="90" rx="2" />
                <rect x="296" y="70" width="32" height="130" rx="2" />
                <rect x="344" y="130" width="22" height="70" rx="2" />
                <rect x="382" y="88" width="40" height="112" rx="3" />
                <rect x="436" y="116" width="28" height="84" rx="2" />
              </g>
            ))}
          </g>
          <g fill="#eaf2ff" opacity=".9">
            {[-480, 0, 480, 960, 1440].map((ox) => (
              <g key={ox} transform={`translate(${ox},0)`}>
                <rect x="64" y="72" width="22" height="3" />
                <rect x="64" y="86" width="22" height="3" />
                <rect x="204" y="54" width="28" height="3" />
                <rect x="204" y="70" width="28" height="3" />
                <rect x="304" y="84" width="18" height="3" />
              </g>
            ))}
          </g>
        </svg>
      </div>

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
          <h1 className="krn-wordmark krn-parallax" data-krn-depth="0.45">کاراینـشو</h1>
        </div>
        <p className="krn-tagline">
          سامانه هوشمند <b>پرداخت و ارزیابی خسارت</b> بیمه خودرو
        </p>
      </div>

      {/* ---------- صحنه‌ی متحرک ---------- */}
      <div className="krn-scene">
        {/* دکمه حالت تربو */}
        <button
          type="button"
          className="krn-turbo-btn"
          onClick={() => setTurbo((t) => !t)}
          aria-pressed={turbo}
          title={turbo ? 'خاموش کردن حالت تربو' : 'روشن کردن حالت تربو'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none" />
          </svg>
          <span>{turbo ? 'تربو فعال' : 'حالت تربو'}</span>
        </button>
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
            <linearGradient id="krnFlame" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#38bdf8" />
              <stop offset=".45" stopColor="#ff7a18" />
              <stop offset="1" stopColor="#ff3b5c" stopOpacity=".15" />
            </linearGradient>
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

          {/* ====== خودرو (رو به چپ) ====== */}
          <g transform="translate(300,168)">
            {/* سایه متحرک زیر ماشین */}
            <ellipse cx="180" cy="152" rx="185" ry="17" fill="url(#krnShadow)" />

            {/* ===== افکت‌های حالت تربو: دود اگزوز + شعله + دونه‌های قرمز ===== */}
            <g className="krn-turbo-fx" aria-hidden="true">
              {/* شعله اگزوز */}
              <polygon className="krn-flame" points="336,126 372,131 336,136" fill="url(#krnFlame)" />
              {/* دود */}
              <g fill="#b9c8dc">
                <circle className="krn-smoke"            cx="344" cy="128" r="11" />
                <circle className="krn-smoke krn-smoke-b" cx="352" cy="134" r="8" />
                <circle className="krn-smoke krn-smoke-c" cx="348" cy="122" r="9" />
                <circle className="krn-smoke krn-smoke-d" cx="356" cy="130" r="6.5" />
              </g>
              {/* دونه‌های قرمز از چراغ عقب */}
              <g fill="#ff3b5c">
                <circle className="krn-redp krn-redp-a" cx="342" cy="74" r="3.4" />
                <circle className="krn-redp krn-redp-b" cx="344" cy="80" r="2.6" />
                <circle className="krn-redp krn-redp-c" cx="341" cy="86" r="3" />
                <circle className="krn-redp krn-redp-d" cx="345" cy="70" r="2.2" />
                <circle className="krn-redp krn-redp-e" cx="343" cy="78" r="2.8" />
              </g>
            </g>

            {/* گرد و غبار پشت چرخ‌ها */}
            <g fill="#dbe7f6">
              <circle className="krn-dust"   cx="330" cy="140" r="13" />
              <circle className="krn-dust krn-dust-b" cx="345" cy="148" r="9" />
              <circle className="krn-dust krn-dust-c" cx="322" cy="150" r="7" />
            </g>

            <g className="krn-car">
              {/* نور جلو */}
              <path className="krn-beam" d="M-10 60 L-255 36 L-255 92 L-6 80 Z" fill="url(#krnBeamG)" />

              {/* بدنه — سدان اسپرت رو به چپ */}
              <path
                d="M-16 94
                   C -15 78, -2 68, 22 63
                   L 96 50
                   C 122 28, 154 17, 194 16
                   C 234 15, 266 25, 288 45
                   L 302 57
                   C 324 61, 337 69, 341 83
                   C 344 93, 342 103, 335 109
                   L 317 112
                   L 56 112
                   L 2 108
                   C -10 106, -17 102, -16 94 Z"
                fill="url(#krnBody)"
              />
              {/* شیشه‌ها */}
              <path
                d="M104 52 C 124 34 152 24 190 23 C 222 22 248 30 268 46 L 252 50 L 200 52 Z"
                fill="url(#krnGlass)" opacity=".95"
              />
              <path d="M196 24 L 200 52 L 252 50 C 240 36 220 27 196 24 Z" fill="#dbeafe" opacity=".55" />
              {/* خط کاراکتر بدنه */}
              <path d="M2 86 C 100 76 240 74 332 84" stroke="#3b82f6" strokeWidth="2.2" fill="none" opacity=".5" />
              {/* دستگیره */}
              <rect x="176" y="66" width="26" height="4" rx="2" fill="#3b82f6" opacity=".6" />
              {/* چراغ جلو */}
              <path d="M-12 72 L 14 66 L 16 77 L -10 83 Z" fill="#eaf2ff" />
              <path d="M-12 72 L 14 66 L 15 70 L -11 76 Z" fill="#ffffff" />
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
