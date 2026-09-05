import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Zap, Flame, Shield, Compass, RotateCcw, Volume2, VolumeX, Car, Moon, Sun } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface TrailPoint {
  x: number;
  y1: number; // Top tire y
  y2: number; // Bottom tire y
  rearLightY: number; // Tail light y
  alpha: number;
  color: string;
  isNitro: boolean;
}

interface Milestone {
  xPercent: number;
  label: string;
  tag: string;
  status: 'passed' | 'current' | 'upcoming';
}

export const AnimatedCarTrack: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [themeMode, setThemeMode] = useState<'neon' | 'day'>('neon');
  const [isNitro, setIsNitro] = useState(false);
  const [honkMessage, setHonkMessage] = useState<string | null>(null);
  const [carSpeedMultiplier, setCarSpeedMultiplier] = useState(1);
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  // Sound effect using Web Audio API (gentle pleasant futuristic synth tones, purely client-side without external assets)
  const [soundEnabled, setSoundEnabled] = useState(false);

  const playHonkSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.08); // C#5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.26);
    } catch {
      // AudioContext might be restricted until user interaction
    }
  };

  const playNitroSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.46);
    } catch {
      // Ignore
    }
  };

  // Car Physics & State Refs for 60fps Animation
  const stateRef = useRef({
    carX: -100, // Starts off-screen left and drives right
    carY: 100,
    carSpeed: 3.2,
    wheelAngle: 0,
    bounce: 0,
    driftAngle: 0,
    trails: [] as TrailPoint[],
    particles: [] as Particle[],
    laneDashOffset: 0,
    nitroTimer: 0,
    lastTime: performance.now(),
    width: 900,
    height: 180,
  });

  const milestones: Milestone[] = [
    { xPercent: 0.15, label: 'اعلام حادثه', tag: 'آنلاین', status: 'passed' },
    { xPercent: 0.40, label: 'استعلام سنهاب', tag: 'بیمه مرکزی', status: 'passed' },
    { xPercent: 0.65, label: 'کارشناسی هوشمند', tag: 'تایید قطعات', status: 'current' },
    { xPercent: 0.90, label: 'تسویه آنی خسارت', tag: 'شبا / پایا', status: 'upcoming' },
  ];

  // Canvas Drawing & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width || 800;
      const h = 180;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      stateRef.current.width = w;
      stateRef.current.height = h;
      stateRef.current.carY = h / 2 + 10;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial position
    stateRef.current.carX = -80;

    const render = (time: number) => {
      const state = stateRef.current;
      const dt = Math.min((time - state.lastTime) / 1000, 0.1);
      state.lastTime = time;

      const w = state.width;
      const h = state.height;

      // Clear Canvas
      ctx.clearRect(0, 0, w, h);

      const isNight = themeMode === 'neon';

      // --- 1. DRAW ROAD BACKGROUND ---
      // Road surface gradient
      const roadGrad = ctx.createLinearGradient(0, 20, 0, h - 20);
      if (isNight) {
        roadGrad.addColorStop(0, '#0f172a');
        roadGrad.addColorStop(0.5, '#1e293b');
        roadGrad.addColorStop(1, '#0f172a');
      } else {
        roadGrad.addColorStop(0, '#334155');
        roadGrad.addColorStop(0.5, '#475569');
        roadGrad.addColorStop(1, '#334155');
      }

      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.roundRect(0, 20, w, h - 40, 16);
      ctx.fill();

      // Road Borders (Glowing Neon Curbs)
      ctx.lineWidth = 3;
      if (isNight) {
        ctx.strokeStyle = '#06b6d4'; // Cyan neon top
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
      } else {
        ctx.strokeStyle = '#cbd5e1';
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.moveTo(12, 22);
      ctx.lineTo(w - 12, 22);
      ctx.stroke();

      if (isNight) {
        ctx.strokeStyle = '#f59e0b'; // Amber neon bottom
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
      } else {
        ctx.strokeStyle = '#cbd5e1';
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.moveTo(12, h - 22);
      ctx.lineTo(w - 12, h - 22);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // Moving Dashed Center Line
      state.laneDashOffset -= (state.carSpeed * 3 * carSpeedMultiplier);
      ctx.strokeStyle = isNight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([20, 16]);
      ctx.lineDashOffset = state.laneDashOffset;
      ctx.beginPath();
      ctx.moveTo(16, h / 2);
      ctx.lineTo(w - 16, h / 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Road Asphalt Subtle Texture Dots / Grid Lines
      ctx.strokeStyle = isNight ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (let x = (state.laneDashOffset % 60); x < w; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 24);
        ctx.lineTo(x, h - 24);
        ctx.stroke();
      }

      // --- 2. UPDATE CAR PHYSICS & POSITION ---
      const activeSpeed = (isNitro ? 8.5 : state.carSpeed) * carSpeedMultiplier;
      state.carX += activeSpeed;

      // Loop car around screen seamlessly
      if (state.carX > w + 160) {
        state.carX = -140;
        // Clean trails when wrapping
        state.trails = [];
      }

      // Suspension bounce
      state.bounce = Math.sin(time * 0.015) * 1.8;
      state.wheelAngle += activeSpeed * 0.12;

      // Tire coordinates
      const carCenterY = state.carY + state.bounce;
      const topTireY = carCenterY - 14;
      const bottomTireY = carCenterY + 14;
      const rearBumperX = state.carX - 44;
      const rearLightY = carCenterY;

      // --- 3. RECORD TIRE & LIGHT TRAILS ("رد حرکت ماشین") ---
      if (state.carX > -100 && state.carX < w + 100) {
        state.trails.push({
          x: rearBumperX + 8,
          y1: topTireY,
          y2: bottomTireY,
          rearLightY: rearLightY,
          alpha: 1.0,
          color: isNitro ? '#f43f5e' : isNight ? '#38bdf8' : '#1e293b',
          isNitro: isNitro,
        });
      }

      // Limit trails max length
      if (state.trails.length > 250) {
        state.trails.shift();
      }

      // --- 4. DRAW PERSISTENT TIRE TRACKS & LIGHT STREAKS ---
      if (state.trails.length > 1) {
        // Draw Tire Rubber Skid Marks (Dark Asphalt Burn + Neon Underglow)
        for (let i = 0; i < state.trails.length - 1; i++) {
          const pt1 = state.trails[i];
          const pt2 = state.trails[i + 1];

          // Fade older points gradually
          const ageAlpha = (i / state.trails.length);
          const drawAlpha = ageAlpha * (pt1.isNitro ? 0.95 : 0.75);

          // Top tire track
          ctx.lineWidth = pt1.isNitro ? 3.5 : 2.5;
          ctx.strokeStyle = isNight 
            ? (pt1.isNitro ? `rgba(244, 63, 94, ${drawAlpha})` : `rgba(56, 189, 248, ${drawAlpha * 0.85})`)
            : `rgba(15, 23, 42, ${drawAlpha * 0.6})`;
          
          if (isNight) {
            ctx.shadowColor = pt1.isNitro ? '#f43f5e' : '#38bdf8';
            ctx.shadowBlur = pt1.isNitro ? 10 : 6;
          }

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y1);
          ctx.lineTo(pt2.x, pt2.y1);
          ctx.stroke();

          // Bottom tire track
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y2);
          ctx.lineTo(pt2.x, pt2.y2);
          ctx.stroke();

          // Center Laser Taillight Trail (Long Exposure Light Streak)
          ctx.lineWidth = pt1.isNitro ? 4 : 2;
          ctx.strokeStyle = pt1.isNitro 
            ? `rgba(239, 68, 68, ${drawAlpha * 0.9})` 
            : `rgba(244, 63, 94, ${drawAlpha * 0.7})`;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.rearLightY);
          ctx.lineTo(pt2.x, pt2.rearLightY);
          ctx.stroke();
        }
        ctx.shadowBlur = 0; // Reset
      }

      // --- 5. SPAWN & DRAW NITRO / SMOKE PARTICLES ---
      if (Math.random() < (isNitro ? 0.9 : 0.35) && state.carX > 0 && state.carX < w) {
        state.particles.push({
          x: rearBumperX + (Math.random() * 6 - 3),
          y: carCenterY + (Math.random() * 20 - 10),
          vx: -(Math.random() * (isNitro ? 5 : 2.5) + 1.5),
          vy: (Math.random() - 0.5) * (isNitro ? 2.5 : 1),
          size: Math.random() * (isNitro ? 6 : 4) + 2,
          color: isNitro 
            ? (Math.random() > 0.5 ? '#f59e0b' : '#ef4444') 
            : (isNight ? (Math.random() > 0.5 ? '#38bdf8' : '#a855f7') : '#94a3b8'),
          alpha: 0.9,
          life: 0,
          maxLife: isNitro ? 35 : 25,
        });
      }

      // Update and draw particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - (p.life / p.maxLife);

        if (p.life >= p.maxLife) {
          state.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(p.alpha, 0);
        if (isNight && isNitro) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }

      // --- 6. DRAW HEADLIGHTS LIGHT CONE (FORWARD BEAM) ---
      const frontX = state.carX + 48;
      const headLightY = carCenterY;

      const beamLength = isNitro ? 160 : 120;
      const beamSpread = isNitro ? 50 : 38;

      const lightGrad = ctx.createRadialGradient(
        frontX, headLightY, 2,
        frontX + beamLength * 0.7, headLightY, beamLength
      );
      if (isNight) {
        lightGrad.addColorStop(0, isNitro ? 'rgba(254, 240, 138, 0.75)' : 'rgba(224, 242, 254, 0.7)');
        lightGrad.addColorStop(0.3, isNitro ? 'rgba(250, 204, 21, 0.35)' : 'rgba(56, 189, 248, 0.3)');
        lightGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      } else {
        lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.5)');
        lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      }

      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(frontX, headLightY - 6);
      ctx.lineTo(frontX + beamLength, headLightY - beamSpread);
      ctx.lineTo(frontX + beamLength, headLightY + beamSpread);
      ctx.lineTo(frontX, headLightY + 6);
      ctx.closePath();
      ctx.fill();

      // --- 7. DRAW THE CAR (DETAILED VECTOR VEHICLE) ---
      const carX = state.carX;
      const carY = carCenterY;

      ctx.save();
      ctx.translate(carX, carY);

      // Underglow Neon Shadow
      if (isNight) {
        ctx.shadowColor = isNitro ? '#f43f5e' : '#06b6d4';
        ctx.shadowBlur = isNitro ? 22 : 16;
        ctx.fillStyle = isNitro ? 'rgba(244, 63, 94, 0.8)' : 'rgba(6, 182, 212, 0.6)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 48, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      }

      // Wheels (Top & Bottom for Top-Side Isometric View)
      // Rear Top Wheel
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-30, -18, 18, 7, 3);
      ctx.fill();
      // Front Top Wheel
      ctx.beginPath();
      ctx.roundRect(22, -18, 18, 7, 3);
      ctx.fill();
      // Rear Bottom Wheel
      ctx.beginPath();
      ctx.roundRect(-30, 11, 18, 7, 3);
      ctx.fill();
      // Front Bottom Wheel
      ctx.beginPath();
      ctx.roundRect(22, 11, 18, 7, 3);
      ctx.fill();

      // Wheel Rims (Rays rotating with motion)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      [-30 + 9, 22 + 9].forEach((wx) => {
        [-18 + 3.5, 11 + 3.5].forEach((wy) => {
          ctx.save();
          ctx.translate(wx, wy);
          ctx.rotate(state.wheelAngle);
          ctx.beginPath();
          ctx.moveTo(-3, 0);
          ctx.lineTo(3, 0);
          ctx.stroke();
          ctx.restore();
        });
      });

      // Car Main Aerodynamic Body (Futuristic Sedan / EV)
      const bodyGrad = ctx.createLinearGradient(-45, 0, 48, 0);
      if (isNitro) {
        bodyGrad.addColorStop(0, '#be123c');
        bodyGrad.addColorStop(0.5, '#e11d48');
        bodyGrad.addColorStop(1, '#fda4af');
      } else if (isNight) {
        bodyGrad.addColorStop(0, '#1e3a8a');
        bodyGrad.addColorStop(0.4, '#2563eb');
        bodyGrad.addColorStop(0.8, '#38bdf8');
        bodyGrad.addColorStop(1, '#bae6fd');
      } else {
        bodyGrad.addColorStop(0, '#1e293b');
        bodyGrad.addColorStop(0.5, '#3b82f6');
        bodyGrad.addColorStop(1, '#60a5fa');
      }

      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = isNight ? '#93c5fd' : '#1e3a8a';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      // Aerodynamic curve from rear to nose
      ctx.moveTo(-44, -9);
      ctx.quadraticCurveTo(-46, 0, -44, 9); // Rear bumper curve
      ctx.lineTo(-26, 13);
      ctx.quadraticCurveTo(0, 14, 28, 12);
      ctx.lineTo(44, 7); // Front right fender
      ctx.quadraticCurveTo(49, 0, 44, -7); // Nose curve
      ctx.lineTo(28, -12);
      ctx.quadraticCurveTo(0, -14, -26, -13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cabin / Glass Roof (Panoramic Windshield & Windows)
      const glassGrad = ctx.createLinearGradient(-15, -7, 24, 7);
      glassGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      glassGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.85)');
      glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');

      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(-20, -7);
      ctx.lineTo(16, -7);
      ctx.quadraticCurveTo(25, 0, 16, 7);
      ctx.lineTo(-20, 7);
      ctx.quadraticCurveTo(-24, 0, -20, -7);
      ctx.closePath();
      ctx.fill();

      // Front Headlights (Glow LEDs)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(43, -5, 2.5, 0, Math.PI * 2);
      ctx.arc(43, 5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Rear Taillights (Red Laser LED Strip)
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(-45, -7, 3, 14, 1.5);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Smart Insurance AI Scanner Ring on Roof
      ctx.strokeStyle = isNight ? '#38bdf8' : '#2563eb';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isNight ? '#38bdf8' : '#2563eb';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // --- 8. DRAW MILESTONE CHECKPOINTS OVER TRACK ---
      milestones.forEach((m, idx) => {
        const mx = w * m.xPercent;
        const my = h - 14;

        const isPassed = state.carX > mx;

        // Checkpoint Marker Dot
        ctx.fillStyle = isPassed ? (isNight ? '#22c55e' : '#16a34a') : (isNight ? '#475569' : '#94a3b8');
        if (isPassed && isNight) {
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Update distance
      setDistanceTraveled((prev) => prev + Math.round(activeSpeed));

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [themeMode, isNitro, carSpeedMultiplier]);

  // Trigger Nitro Boost
  const handleTriggerNitro = () => {
    setIsNitro(true);
    playNitroSound();
    setHonkMessage('شتاب حداکثری توربو نیترو فعال شد! ');
    setTimeout(() => {
      setIsNitro(false);
      setHonkMessage(null);
    }, 2800);
  };

  // Trigger Honk / Interactive Sound
  const handleHonk = () => {
    playHonkSound();
    const msgs = ['بیپ بیپ! ', 'استعلام هوشمند در حال پردازش ', 'مسیر تسویه سبز و باز است ', 'رانندگی ایمن با بیمه هوشمند '];
    const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
    setHonkMessage(randomMsg);
    setTimeout(() => setHonkMessage(null), 2200);
  };

  return (
    <div
      ref={containerRef}
      className="w-full relative rounded-3xl overflow-hidden shadow-xl border-2 border-slate-700/30 bg-slate-900 select-none text-slate-100 transition-all"
      dir="rtl"
    >
      {/* Top Banner Control Bar */}
      <div className="px-4 py-2.5 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        {/* Left: Title & Live Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" />
          <span className="font-black text-slate-200 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            شبیه‌ساز هوشمند ارزیابی خسارت برخط
          </span>
          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
            رد حرکت نئونی &amp; تایر فعال
          </span>
        </div>

        {/* Right: Interactive Buttons */}
        <div className="flex items-center gap-2">
          {/* Turbo Nitro Boost Button */}
          <button
            type="button"
            onClick={handleTriggerNitro}
            className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
              isNitro
                ? 'bg-rose-600 text-white animate-bounce shadow-rose-500/50 shadow-md'
                : 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black'
            }`}
            title="افزایش سرعت و کشیده شدن خطوط ترمز نئونی"
          >
            <Flame className="w-3.5 h-3.5 text-slate-950" />
            <span>{isNitro ? 'نیترو فعال!' : 'نیترو بوست '}</span>
          </button>

          {/* Honk Horn Button */}
          <button
            type="button"
            onClick={handleHonk}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition flex items-center gap-1 cursor-pointer active:scale-95"
            title="بوق و پیام تعاملی"
          >
            <span className="inline-flex items-center gap-1"><Car className="w-3.5 h-3.5" />بوق</span>
          </button>

          {/* Day / Neon Mode Toggle */}
          <button
            type="button"
            onClick={() => setThemeMode(themeMode === 'neon' ? 'day' : 'neon')}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition cursor-pointer"
            title="تغییر تم نئونی شب و روز"
          >
            <span className="inline-flex items-center gap-1">{themeMode === 'neon' ? <><Moon className="w-3.5 h-3.5" />شب نئونی</> : <><Sun className="w-3.5 h-3.5" />روز</>}</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={soundEnabled ? 'صدا روشن است' : 'صدا خاموش است (کلیک برای فعال‌سازی)'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className="relative cursor-pointer w-full h-[140px] sm:h-[180px]"
        onClick={handleTriggerNitro}
        title="برای شتاب و نیترو روی جاده کلیک کنید!"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Honk Speech / Status Bubble */}
        {honkMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 text-slate-900 px-4 py-1.5 rounded-2xl shadow-xl text-xs font-black border-2 border-cyan-400 animate-in zoom-in-90 fade-in flex items-center gap-1.5 z-20">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{honkMessage}</span>
          </div>
        )}

        {/* Milestone Steps Bar (Overlaid at bottom of canvas) */}
        <div className="absolute bottom-1.5 inset-x-4 flex justify-between pointer-events-none text-[10px] text-slate-400 font-bold">
          {milestones.map((m, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-slate-300 font-black">{m.label}</span>
              <span className="text-[9px] text-cyan-400 font-normal">{m.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Interactive Prompt */}
      <div className="px-4 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-emerald-400 font-mono font-bold">● فرآیند تسویه هوشمند:</span>
          <span>حرکت پیوسته خودرو با ثبت رد لاستیک نئونی و استعلامات لحظه‌ای</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <span>برای نیترو و دود ترمز روی صفحه کلیک کنید</span>
          <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
