import React, { useState, useRef } from 'react';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Car,
  Layers,
  Edit3,
  X,
  Check,
  Eye,
  ShieldAlert,
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';
import { CarDamageSpot } from '../types';

export interface CarPartDefinition {
  key: string;
  label: string;
  category: 'body' | 'chassis_pillar';
  groupLabel?: string;
  // 3D coordinates
  x3d: number;
  y3d: number;
  z3d: number;
  // 2D diagram coordinate percentages (cx%, cy%)
  cx2d: number;
  cy2d: number;
  shapeType?: 'rect' | 'circle' | 'polygon';
}

export const ALL_INSPECTION_PARTS: CarPartDefinition[] = [
  // Top / Center Spine
  { key: 'front_bumper', label: 'سپر جلو', category: 'body', groupLabel: 'بخش جلو', x3d: 0, y3d: 14, z3d: 206, cx2d: 50, cy2d: 8 },
  { key: 'hood', label: 'درب موتور (کاپوت)', category: 'body', groupLabel: 'بخش جلو', x3d: 0, y3d: -28, z3d: 135, cx2d: 50, cy2d: 24 },
  { key: 'roof', label: 'سقف خودرو', category: 'body', groupLabel: 'بخش میانی', x3d: 0, y3d: -75, z3d: -15, cx2d: 50, cy2d: 49 },
  { key: 'trunk', label: 'درب صندوق عقب', category: 'body', groupLabel: 'بخش عقب', x3d: 0, y3d: -28, z3d: -150, cx2d: 50, cy2d: 74 },
  { key: 'rear_bumper', label: 'سپر عقب', category: 'body', groupLabel: 'بخش عقب', x3d: 0, y3d: 14, z3d: -206, cx2d: 50, cy2d: 91 },

  // Left Side (Driver Side - Unfolded Left)
  { key: 'fender_fl', label: 'گلگیر جلو چپ', category: 'body', groupLabel: 'سمت چپ (راننده)', x3d: -88, y3d: -4, z3d: 112, cx2d: 23, cy2d: 23 },
  { key: 'door_fl', label: 'درب جلو چپ', category: 'body', groupLabel: 'سمت چپ (راننده)', x3d: -88, y3d: 10, z3d: 40, cx2d: 21, cy2d: 42 },
  { key: 'door_rl', label: 'درب عقب چپ', category: 'body', groupLabel: 'سمت چپ (راننده)', x3d: -88, y3d: 10, z3d: -65, cx2d: 21, cy2d: 58 },
  { key: 'fender_rl', label: 'گلگیر عقب چپ', category: 'body', groupLabel: 'سمت چپ (راننده)', x3d: -88, y3d: -4, z3d: -140, cx2d: 23, cy2d: 75 },

  // Right Side (Passenger Side - Unfolded Right)
  { key: 'fender_fr', label: 'گلگیر جلو راست', category: 'body', groupLabel: 'سمت راست (شاگرد)', x3d: 88, y3d: -4, z3d: 112, cx2d: 77, cy2d: 23 },
  { key: 'door_fr', label: 'درب جلو راست', category: 'body', groupLabel: 'سمت راست (شاگرد)', x3d: 88, y3d: 10, z3d: 40, cx2d: 79, cy2d: 42 },
  { key: 'door_rr', label: 'درب عقب راست', category: 'body', groupLabel: 'سمت راست (شاگرد)', x3d: 88, y3d: 10, z3d: -65, cx2d: 79, cy2d: 58 },
  { key: 'fender_rr', label: 'گلگیر عقب راست', category: 'body', groupLabel: 'سمت راست (شاگرد)', x3d: 88, y3d: -4, z3d: -140, cx2d: 77, cy2d: 75 },

  // Chassis & Structural Parts
  { key: 'chassis_front_l', label: 'سرشاسی و سینی جلو چپ', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -40, y3d: 20, z3d: 180, cx2d: 38, cy2d: 14 },
  { key: 'chassis_front_r', label: 'سرشاسی و سینی جلو راست', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 40, y3d: 20, z3d: 180, cx2d: 62, cy2d: 14 },
  { key: 'chassis_rear_l', label: 'سرشاسی و سینی عقب چپ', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -40, y3d: 20, z3d: -180, cx2d: 38, cy2d: 85 },
  { key: 'chassis_rear_r', label: 'سرشاسی و سینی عقب راست', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 40, y3d: 20, z3d: -180, cx2d: 62, cy2d: 85 },

  // Pillars & Rockers
  { key: 'pillar_a_l', label: 'ستون جلو چپ (ستون A)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -55, y3d: -30, z3d: 60, cx2d: 33, cy2d: 35 },
  { key: 'pillar_b_l', label: 'ستون وسط چپ (ستون B)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -55, y3d: -30, z3d: -15, cx2d: 33, cy2d: 50 },
  { key: 'pillar_c_l', label: 'ستون عقب چپ (ستون C)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -55, y3d: -30, z3d: -90, cx2d: 33, cy2d: 65 },
  { key: 'pillar_a_r', label: 'ستون جلو راست (ستون A)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 55, y3d: -30, z3d: 60, cx2d: 67, cy2d: 35 },
  { key: 'pillar_b_r', label: 'ستون وسط راست (ستون B)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 55, y3d: -30, z3d: -15, cx2d: 67, cy2d: 50 },
  { key: 'pillar_c_r', label: 'ستون عقب راست (ستون C)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 55, y3d: -30, z3d: -90, cx2d: 67, cy2d: 65 },
  { key: 'rocker_l', label: 'رکاب چپ', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -75, y3d: 25, z3d: -15, cx2d: 11, cy2d: 50 },
  { key: 'rocker_r', label: 'رکاب راست', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 75, y3d: 25, z3d: -15, cx2d: 89, cy2d: 50 }
];

export interface Car3DViewerProps {
  caseId: string;
  damageData?: Record<string, CarDamageSpot>;
  editable?: boolean;
  onSpotClick?: (partKey: string, partLabel: string) => void;
  onChangeDamageData?: (newDamageData: Record<string, CarDamageSpot>) => void;
  onAddPartToEstimate?: (partName: string, operationType: 'replace' | 'repair', note?: string) => void;
}

export const Car3DViewer: React.FC<Car3DViewerProps> = ({
  caseId,
  damageData = {},
  editable = false,
  onSpotClick,
  onChangeDamageData,
  onAddPartToEstimate
}) => {
  const [viewMode, setViewMode] = useState<'2d_sheet' | '3d_orbit'>('2d_sheet');
  const [activePartKey, setActivePartKey] = useState<string | null>('front_bumper');
  const [editingPartKey, setEditingPartKey] = useState<string | null>(null);

  // Edit form state
  const [formSeverity, setFormSeverity] = useState<'none' | 'minor' | 'moderate' | 'major'>('minor');
  const [formType, setFormType] = useState<string>('خط و خش و دفرمگی');
  const [formOperation, setFormOperation] = useState<string>('صافکاری و نقاشی');
  const [formNote, setFormNote] = useState<string>('');

  // 3D Controls
  const [rotY, setRotY] = useState(-32);
  const [rotX, setRotX] = useState(-16);
  const [zoom, setZoom] = useState(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setRotY((prev) => prev + dx * 0.6);
    setRotX((prev) => Math.max(-45, Math.min(45, prev - dy * 0.4)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset3D = () => {
    setRotY(-32);
    setRotX(-16);
    setZoom(0.85);
  };

  const handleSelectPart = (partKey: string) => {
    setActivePartKey(partKey);
    const spot = damageData[partKey];
    if (editable) {
      setEditingPartKey(partKey);
      setFormSeverity(spot?.severity || 'minor');
      setFormType(spot?.type || 'آسیب‌دیده');
      setFormOperation(spot?.operation || 'صافکاری و نقاشی');
      setFormNote(spot?.note || '');
    }
    const partDef = ALL_INSPECTION_PARTS.find((p) => p.key === partKey);
    if (onSpotClick && partDef) {
      onSpotClick(partKey, partDef.label);
    }
  };

  const handleSavePartDamage = () => {
    if (!editingPartKey) return;
    const updated = { ...damageData };

    if (formSeverity === 'none') {
      delete updated[editingPartKey];
    } else {
      let color: 'yellow' | 'orange' | 'red' | 'gray' = 'yellow';
      if (formSeverity === 'major') color = 'red';
      else if (formSeverity === 'moderate') color = 'orange';
      else if (formSeverity === 'minor') color = 'yellow';

      updated[editingPartKey] = {
        type: formType,
        severity: formSeverity,
        operation: formOperation,
        color: color,
        note: formNote.trim(),
        updatedAt: new Date().toLocaleDateString('fa-IR')
      };
    }

    if (onChangeDamageData) {
      onChangeDamageData(updated);
    }

    // Automatically synchronize/add to parts estimate list if damaged
    if (formSeverity !== 'none' && onAddPartToEstimate) {
      const partDef = ALL_INSPECTION_PARTS.find((p) => p.key === editingPartKey);
      const partName = partDef?.label || editingPartKey;
      const opType = formSeverity === 'major' || formOperation.includes('تعویض') ? 'replace' : 'repair';
      onAddPartToEstimate(partName, opType, formNote.trim());
    }

    setEditingPartKey(null);
  };

  const getSpotColorClass = (spot?: CarDamageSpot, isSelected?: boolean) => {
    if (!spot || spot.severity === 'none') {
      return isSelected
        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-md ring-2 ring-indigo-300'
        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-50';
    }
    if (spot.severity === 'major' || spot.color === 'red') {
      return isSelected
        ? 'bg-rose-600 border-rose-950 text-white ring-4 ring-rose-300 shadow-lg scale-110'
        : 'bg-rose-500 border-rose-700 text-white shadow-md hover:bg-rose-600';
    }
    if (spot.severity === 'moderate' || spot.color === 'orange') {
      return isSelected
        ? 'bg-amber-500 border-amber-900 text-white ring-4 ring-amber-300 shadow-lg scale-110'
        : 'bg-amber-500 border-amber-700 text-white shadow-md hover:bg-amber-600';
    }
    // Minor / Yellow
    return isSelected
      ? 'bg-yellow-400 border-yellow-800 text-yellow-950 ring-4 ring-yellow-200 shadow-lg scale-110'
      : 'bg-yellow-300 border-yellow-600 text-yellow-950 shadow-md hover:bg-yellow-400';
  };

  const getSpotBadge = (spot?: CarDamageSpot) => {
    if (!spot || spot.severity === 'none') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          سالم / فاقد آسیب
        </span>
      );
    }
    if (spot.severity === 'major' || spot.color === 'red') {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-pulse" />
          آسیب شدید / تعویضی (قرمز)
        </span>
      );
    }
    if (spot.severity === 'moderate' || spot.color === 'orange') {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          صافکاری و رنگ / متوسط (نارنجی)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-yellow-100 text-yellow-900 border border-yellow-300 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
        آسیب جزئی / لیسه‌گیری (زرد)
      </span>
    );
  };

  const activePartDef = ALL_INSPECTION_PARTS.find((p) => p.key === activePartKey) || ALL_INSPECTION_PARTS[0];
  const activeSpot = activePartKey ? damageData[activePartKey] : undefined;

  const damagedPartsList = ALL_INSPECTION_PARTS.filter((p) => damageData[p.key] && damageData[p.key]?.severity !== 'none');

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
      {/* Header & View Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-sm">
              <Car className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base">
              نقشه استاندارد کارشناسی و جانمایی آسیب‌های بدنه و شاسی
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium pr-10">
            {editable
              ? 'روی هر قطعه در نقشه یا جدول کلیک کنید تا وضعیت آسیب، نوع عملیات و توضیحات تخصصی را ثبت یا ویرایش فرمایید.'
              : 'برای مشاهده توضیحات کارشناس و جزئیات ارزیابی، روی قطعات دارای آسیب یا نام قطعه کلیک نمایید.'}
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('2d_sheet')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              viewMode === '2d_sheet'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>نقشه بازشده کارشناسی (۲ بعدی)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('3d_orbit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              viewMode === '3d_orbit'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>مدل سه‌بعدی تعاملی (3D)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Blueprint/3D Canvas + Side Checklist & Assessor Notes Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left / Main Column: Visual Blueprint or 3D Canvas */}
        <div className="lg:col-span-7 space-y-4">
          
          {viewMode === '2d_sheet' ? (
            /* 2D UNFOLDED CAR BLUEPRINT (برگه کارشناسی استاندارد مطابق عکس) */
            <div className="relative bg-gradient-to-b from-slate-50 via-white to-slate-100 border-2 border-slate-200 rounded-3xl p-4 sm:p-6 overflow-hidden shadow-inner select-none">
              
              {/* Header inside Sheet */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-700">
                <span className="flex items-center gap-1.5 text-purple-900 font-black">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  نقشه گسترده و باز شده قطعات خودرو
                </span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-lg text-[10px]">
                  پرونده: {caseId}
                </span>
              </div>

              {/* Blueprint SVG Diagram */}
              <div className="relative w-full max-w-[480px] mx-auto aspect-[3/4] bg-white rounded-2xl border border-slate-300 p-2 shadow-sm">
                
                {/* SVG Unfolded Car Outline Background */}
                <svg
                  viewBox="0 0 400 520"
                  className="w-full h-full text-slate-300 stroke-current fill-none pointer-events-none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Center Main Car Body Outline (Top View) */}
                  {/* Front Bumper Top View */}
                  <path d="M 130 50 C 160 30, 240 30, 270 50 L 275 65 L 125 65 Z" className="fill-slate-50/70 stroke-slate-400" />
                  {/* Hood */}
                  <path d="M 125 65 L 275 65 L 285 155 L 115 155 Z" className="fill-slate-50/70 stroke-slate-400" />
                  {/* Windshield */}
                  <path d="M 115 155 L 285 155 L 275 205 L 125 205 Z" className="fill-slate-100/80 stroke-slate-300 stroke-dashed" />
                  {/* Roof */}
                  <rect x="125" y="205" width="150" height="130" rx="8" className="fill-slate-50/70 stroke-slate-400" />
                  {/* Rear Glass */}
                  <path d="M 125 335 L 275 335 L 285 375 L 115 375 Z" className="fill-slate-100/80 stroke-slate-300 stroke-dashed" />
                  {/* Trunk */}
                  <path d="M 115 375 L 285 375 L 275 445 L 125 445 Z" className="fill-slate-50/70 stroke-slate-400" />
                  {/* Rear Bumper */}
                  <path d="M 125 445 C 160 465, 240 465, 275 445 L 270 475 C 240 495, 160 495, 130 475 Z" className="fill-slate-50/70 stroke-slate-400" />

                  {/* Left Unfolded Side Panel */}
                  {/* Left Front Fender */}
                  <path d="M 115 65 L 75 75 L 60 145 L 115 155 Z" className="fill-slate-50/50 stroke-slate-300" />
                  {/* Left Front Door */}
                  <path d="M 115 155 L 55 160 L 50 260 L 125 260 Z" className="fill-slate-50/50 stroke-slate-300" />
                  {/* Left Rear Door */}
                  <path d="M 125 260 L 50 260 L 55 355 L 115 355 Z" className="fill-slate-50/50 stroke-slate-300" />
                  {/* Left Rear Fender */}
                  <path d="M 115 355 L 60 365 L 75 435 L 115 445 Z" className="fill-slate-50/50 stroke-slate-300" />
                  {/* Left Rocker (رکاب) */}
                  <line x1="45" y1="165" x2="45" y2="350" strokeWidth="4" className="stroke-slate-300" />

                  {/* Right Unfolded Side Panel */}
                  {/* Right Front Fender */}
                  <path d="M 285 65 L 325 75 L 340 145 L 285 155 Z" className="fill-slate-50/50 stroke-slate-300" />
                  {/* Right Front Door */}
                  <path d="M 285 155 L 345 160 L 350 260 L 275 260 Z" className="fill-slate-50/50 stroke-slate-300" />
                  {/* Right Rear Door */}
                  <path d="M 275 260 L 350 260 L 345 355 L 285 355 Z" className="fill-slate-50/50 stroke-slate-300" />
                  {/* Right Rear Fender */}
                  <path d="M 285 355 L 340 365 L 325 435 L 285 445 Z" className="fill-slate-50/50 stroke-slate-300" />
                  {/* Right Rocker (رکاب) */}
                  <line x1="355" y1="165" x2="355" y2="350" strokeWidth="4" className="stroke-slate-300" />

                  {/* Unfolded Wheels Graphic */}
                  {/* Front Wheels */}
                  <rect x="25" y="90" width="22" height="42" rx="6" className="fill-slate-200 stroke-slate-400" />
                  <rect x="353" y="90" width="22" height="42" rx="6" className="fill-slate-200 stroke-slate-400" />
                  {/* Rear Wheels */}
                  <rect x="25" y="380" width="22" height="42" rx="6" className="fill-slate-200 stroke-slate-400" />
                  <rect x="353" y="380" width="22" height="42" rx="6" className="fill-slate-200 stroke-slate-400" />

                  {/* Front Chassis Indicators */}
                  <line x1="140" y1="65" x2="160" y2="105" className="stroke-slate-400 stroke-dashed" />
                  <line x1="260" y1="65" x2="240" y2="105" className="stroke-slate-400 stroke-dashed" />

                  {/* Rear Chassis Indicators */}
                  <line x1="140" y1="445" x2="160" y2="405" className="stroke-slate-400 stroke-dashed" />
                  <line x1="260" y1="445" x2="240" y2="405" className="stroke-slate-400 stroke-dashed" />
                </svg>

                {/* Hotspot Interactive Markers on Blueprint */}
                {ALL_INSPECTION_PARTS.map((part) => {
                  const spot = damageData[part.key];
                  const isSelected = activePartKey === part.key;
                  const colorClass = getSpotColorClass(spot, isSelected);

                  return (
                    <button
                      key={part.key}
                      type="button"
                      onClick={() => handleSelectPart(part.key)}
                      style={{
                        left: `${part.cx2d}%`,
                        top: `${part.cy2d}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className={`absolute px-2 py-1 rounded-xl text-[10px] font-black border-2 transition-all cursor-pointer z-20 flex items-center gap-1 ${colorClass}`}
                      title={`${part.label}${spot ? ` - ${spot.type}` : ' (بدون آسیب)'}`}
                    >
                      {spot && spot.severity !== 'none' ? (
                        <span className="w-2 h-2 rounded-full bg-current inline-block" />
                      ) : null}
                      <span className="truncate max-w-[70px] sm:max-w-none">{part.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Color Code Legend */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-center flex-wrap gap-3 sm:gap-6 text-[11px] font-bold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-white border-2 border-slate-400 inline-block" />
                  <span>سالم / بی‌رنگ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600 inline-block" />
                  <span>آسیب جزئی / خط و خش (زرد)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-700 inline-block" />
                  <span>صافکاری و نقاشی (نارنجی)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600 border border-rose-800 inline-block" />
                  <span>تعویض / آسیب شدید (قرمز)</span>
                </div>
              </div>
            </div>
          ) : (
            /* 3D ORBIT VIEW MODE */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <span>برای چرخش زاویه دید، ماوس را روی خودرو درگ نمایید.</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRotY((prev) => prev - 30)}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-700 font-bold"
                    title="چرخش چپ"
                  >
                    <RotateCw className="w-3.5 h-3.5 transform -scale-x-100" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotY((prev) => prev + 30)}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-700 font-bold"
                    title="چرخش راست"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(1.4, prev + 0.15))}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-700 font-bold"
                    title="بزرگ‌نمایی"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.15))}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-700 font-bold"
                    title="کوچک‌نمایی"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset3D}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-700 font-bold"
                    title="ریست"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div
                className="relative w-full h-[360px] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing select-none flex items-center justify-center border-2 border-slate-200"
                style={{ perspective: '1100px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div
                  className="absolute transform-gpu transition-transform duration-75"
                  style={{
                    transform: `scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Main Chassis Box */}
                  <div
                    className="absolute bg-slate-300 border border-slate-400/80 shadow-inner"
                    style={{
                      width: '180px',
                      height: '50px',
                      marginLeft: '-90px',
                      marginTop: '-25px',
                      transform: 'translate3d(0, 10px, 0)',
                    }}
                  />

                  {/* Cabin Top */}
                  <div
                    className="absolute bg-slate-800 border border-slate-700/80 shadow-md"
                    style={{
                      width: '144px',
                      height: '52px',
                      marginLeft: '-72px',
                      marginTop: '-26px',
                      transform: 'translate3d(0, -42px, -10px)',
                    }}
                  />

                  {/* Hood */}
                  <div
                    className="absolute bg-slate-200 border border-slate-300"
                    style={{
                      width: '170px',
                      height: '18px',
                      marginLeft: '-85px',
                      marginTop: '-9px',
                      transform: 'translate3d(0, -26px, 125px)',
                    }}
                  />

                  {/* Trunk */}
                  <div
                    className="absolute bg-slate-200 border border-slate-300"
                    style={{
                      width: '170px',
                      height: '18px',
                      marginLeft: '-85px',
                      marginTop: '-9px',
                      transform: 'translate3d(0, -26px, -140px)',
                    }}
                  />

                  {/* Wheels */}
                  {[-80, 80].map((x) =>
                    [100, -100].map((z) => (
                      <div
                        key={`${x}-${z}`}
                        className="absolute w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600 shadow-md flex items-center justify-center"
                        style={{
                          transform: `translate3d(${x}px, 30px, ${z}px) rotateY(90deg)`,
                        }}
                      >
                        <div className="w-5 h-5 rounded-full bg-slate-400" />
                      </div>
                    ))
                  )}

                  {/* 3D Clickable Hotspots */}
                  {ALL_INSPECTION_PARTS.map((part) => {
                    const spot = damageData[part.key];
                    const isSelected = activePartKey === part.key;
                    const isMajor = spot?.severity === 'major' || spot?.color === 'red';
                    const isMod = spot?.severity === 'moderate' || spot?.color === 'orange';
                    const isMinor = spot?.severity === 'minor' || spot?.color === 'yellow';

                    return (
                      <button
                        key={part.key}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPart(part.key);
                        }}
                        className={`absolute w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-[11px] shadow-lg transition-transform hover:scale-125 z-30 ${
                          isMajor
                            ? 'bg-rose-600 border-rose-950 text-white animate-pulse ring-4 ring-rose-200'
                            : isMod
                            ? 'bg-amber-500 border-amber-900 text-white ring-4 ring-amber-200'
                            : isMinor
                            ? 'bg-yellow-400 border-yellow-800 text-yellow-950 ring-4 ring-yellow-200'
                            : isSelected
                            ? 'bg-indigo-600 border-indigo-950 text-white ring-4 ring-indigo-200'
                            : 'bg-white border-slate-400 text-slate-700 hover:border-indigo-600'
                        }`}
                        style={{
                          transform: `translate3d(${part.x3d}px, ${part.y3d}px, ${part.z3d}px) rotateY(${-rotY}deg) rotateX(${-rotX}deg) translate(-50%, -50%)`,
                        }}
                        title={`${part.label}${spot ? ` (${spot.type})` : ''}`}
                      >
                        {spot && spot.severity !== 'none' ? '!' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Part Inspector & Explanations Card + Categorized Parts List */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Active Part Detail / Assessor Note Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-5 rounded-3xl shadow-md border-2 border-indigo-400/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-2.5">
              <div>
                <span className="text-[10px] text-purple-300 font-bold block">قطعه انتخاب‌شده در نقشه:</span>
                <h4 className="font-black text-white text-base">
                  {activePartDef.label}
                </h4>
              </div>
              <div>{getSpotBadge(activeSpot)}</div>
            </div>

            {/* Damage Details & Explanations Display */}
            {activeSpot && activeSpot.severity !== 'none' ? (
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-white/10 p-3 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-slate-300 text-[10px] block">نوع آسیب‌دیدگی:</span>
                    <strong className="text-white font-bold">{activeSpot.type || 'ثبت شده'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-300 text-[10px] block">عملیات کارشناسی:</span>
                    <strong className="text-amber-300 font-bold">{activeSpot.operation || 'اقدام فنی'}</strong>
                  </div>
                </div>

                {/* Assessor Written Explanation / Note */}
                <div className="bg-white/15 p-3 rounded-2xl border border-white/20 space-y-1">
                  <span className="text-[11px] font-black text-purple-200 flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                    توضیحات و گزارش کارشناس ارزیاب:
                  </span>
                  <p className="text-xs text-white leading-relaxed font-medium bg-black/20 p-2 rounded-xl">
                    {activeSpot.note || 'کارشناس برای این قطعه توضیح متنی ثبت نکرده است.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  این قطعه فاقد هرگونه آسیب یا رنگ‌شدگی ثبت‌شده است.
                </p>
                <p className="text-[11px] text-slate-400">
                  وضعیت فابریک و بدون ایراد گزارش شده است.
                </p>
              </div>
            )}

            {/* Editable Action Button for Assessor */}
            {editable && (
              <button
                type="button"
                onClick={() => handleSelectPart(activePartDef.key)}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>ویرایش وضعیت و توضیحات «{activePartDef.label}»</span>
              </button>
            )}
          </div>

          {/* Categorized Parts List (Side Checklist) */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-700" />
                <span>فهرست تفکیکی قطعات بدنه و شاسی</span>
              </h5>
              <span className="text-[10px] font-extrabold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full">
                {damagedPartsList.length} آسیب ثبت‌شده
              </span>
            </div>

            {/* Categorized Tabs or Scrollable List */}
            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 text-xs">
              
              {/* Group 1: Body Parts */}
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 px-1 block">
                  قطعات اصلی بدنه (درب‌ها، کاپوت، سقف، گلگیرها و سپرها):
                </span>
                {ALL_INSPECTION_PARTS.filter((p) => p.category === 'body').map((part) => {
                  const spot = damageData[part.key];
                  const isSelected = activePartKey === part.key;
                  return (
                    <button
                      key={part.key}
                      type="button"
                      onClick={() => handleSelectPart(part.key)}
                      className={`w-full text-right p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-50 border-purple-400 text-purple-950 font-black shadow-xs ring-1 ring-purple-300'
                          : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-800 font-bold'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            spot?.severity === 'major'
                              ? 'bg-rose-600'
                              : spot?.severity === 'moderate'
                              ? 'bg-amber-500'
                              : spot?.severity === 'minor'
                              ? 'bg-yellow-400'
                              : 'bg-slate-300'
                          }`}
                        />
                        <span>{part.label}</span>
                      </span>
                      <span className="text-[10px]">
                        {spot && spot.severity !== 'none' ? (
                          <span
                            className={`px-2 py-0.5 rounded-md font-extrabold ${
                              spot.severity === 'major'
                                ? 'bg-rose-100 text-rose-800'
                                : spot.severity === 'moderate'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-yellow-100 text-yellow-900'
                            }`}
                          >
                            {spot.type || 'آسیب‌دیده'}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">سالم</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Group 2: Chassis & Pillars */}
              <div className="space-y-1 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-black text-slate-500 px-1 block">
                  وضعیت شاسی، سینی، ستون‌ها و رکاب‌ها:
                </span>
                {ALL_INSPECTION_PARTS.filter((p) => p.category === 'chassis_pillar').map((part) => {
                  const spot = damageData[part.key];
                  const isSelected = activePartKey === part.key;
                  return (
                    <button
                      key={part.key}
                      type="button"
                      onClick={() => handleSelectPart(part.key)}
                      className={`w-full text-right p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-50 border-purple-400 text-purple-950 font-black shadow-xs ring-1 ring-purple-300'
                          : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-800 font-bold'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            spot?.severity === 'major'
                              ? 'bg-rose-600'
                              : spot?.severity === 'moderate'
                              ? 'bg-amber-500'
                              : spot?.severity === 'minor'
                              ? 'bg-yellow-400'
                              : 'bg-slate-300'
                          }`}
                        />
                        <span>{part.label}</span>
                      </span>
                      <span className="text-[10px]">
                        {spot && spot.severity !== 'none' ? (
                          <span
                            className={`px-2 py-0.5 rounded-md font-extrabold ${
                              spot.severity === 'major'
                                ? 'bg-rose-100 text-rose-800'
                                : spot.severity === 'moderate'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-yellow-100 text-yellow-900'
                            }`}
                          >
                            {spot.type || 'آسیب‌دیده'}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">سالم</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL / DRAWER (ONLY FOR ASSESSOR WHEN EDITING) */}
      {editable && editingPartKey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-purple-300 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">
                    ثبت آسیب و توضیحات برای: {ALL_INSPECTION_PARTS.find((p) => p.key === editingPartKey)?.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    تعیین شدت آسیب، نوع عملیات و ثبت گزارش متنی کارشناسی
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartKey(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Severity Selection (Color selection) */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                وضعیت آسیب‌دیدگی و شدت (رنگ روی نقشه):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormSeverity('none')}
                  className={`p-3 rounded-2xl border-2 font-bold text-center transition-all flex flex-col items-center gap-1.5 ${
                    formSeverity === 'none'
                      ? 'bg-slate-100 border-slate-600 text-slate-950 ring-2 ring-slate-300 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white border-2 border-slate-400" />
                  <span className="text-[11px]">سالم / بی‌رنگ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormSeverity('minor')}
                  className={`p-3 rounded-2xl border-2 font-bold text-center transition-all flex flex-col items-center gap-1.5 ${
                    formSeverity === 'minor'
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-950 ring-2 ring-yellow-300 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-yellow-50/50'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-yellow-400 border border-yellow-600" />
                  <span className="text-[11px]">آسیب جزئی (زرد)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormSeverity('moderate')}
                  className={`p-3 rounded-2xl border-2 font-bold text-center transition-all flex flex-col items-center gap-1.5 ${
                    formSeverity === 'moderate'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-300 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50/50'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-amber-500 border border-amber-700" />
                  <span className="text-[11px]">صافکاری/رنگ (نارنجی)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormSeverity('major')}
                  className={`p-3 rounded-2xl border-2 font-bold text-center transition-all flex flex-col items-center gap-1.5 ${
                    formSeverity === 'major'
                      ? 'bg-rose-50 border-rose-600 text-rose-950 ring-2 ring-rose-300 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-rose-50/50'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-rose-600 border border-rose-800" />
                  <span className="text-[11px]">تعویض/شدید (قرمز)</span>
                </button>
              </div>
            </div>

            {formSeverity !== 'none' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">نوع دقیق آسیب:</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:border-purple-500"
                    >
                      <option value="خط و خش عمیق">خط و خش عمیق</option>
                      <option value="فرورفتگی و دفرمگی">فرورفتگی و دفرمگی</option>
                      <option value="شکستگی و پارگی">شکستگی و پارگی</option>
                      <option value="رنگ‌پریدگی و سایش">رنگ‌پریدگی و سایش</option>
                      <option value="دفرمگی شدید شاسی">دفرمگی شدید شاسی</option>
                      <option value="آسیب کلی و نیاز به برش">آسیب کلی و نیاز به برش</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">عملیات پیشنهادی کارشناس:</label>
                    <select
                      value={formOperation}
                      onChange={(e) => setFormOperation(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:border-purple-500"
                    >
                      <option value="صافکاری بی‌رنگ (PDR)">صافکاری بی‌رنگ (PDR)</option>
                      <option value="صافکاری و نقاشی">صافکاری و نقاشی</option>
                      <option value="تعویض کامل قطعه">تعویض کامل قطعه</option>
                      <option value="لیسه‌گیری و پولیش">لیسه‌گیری و پولیش</option>
                      <option value="شاسی‌کشی و تنظیم">شاسی‌کشی و تنظیم</option>
                      <option value="تعمیر و جوشکاری">تعمیر و جوشکاری</option>
                    </select>
                  </div>
                </div>

                {/* Assessor Notes Textarea */}
                <div className="space-y-1 text-xs">
                  <label className="block text-slate-800 font-black">
                    توضیحات و گزارش کارشناس (جهت نمایش به بیمه‌گر و مشتری):
                  </label>
                  <textarea
                    rows={3}
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="مثال: درب جلو سمت راننده به طول ۴۰ سانتی‌متر دچار دفرمگی شده و نیاز به صافکاری با قالب و رنگ‌آمیزی کوره‌ای دارد..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPartKey(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSavePartDamage}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ثبت و اعمال در نقشه</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
