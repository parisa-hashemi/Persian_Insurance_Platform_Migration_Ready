import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  HelpCircle,
  Wrench,
  Trash2
} from 'lucide-react';
import { CarDamageSpot } from '../types';
import Car3DModel from './Car3DModel';
import { getExactPersianPartName } from '../lib/ai/aiDraftGenerator';

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
  // Top / Center Spine (بخش وسط)
  { key: 'front_bumper', label: 'سپر جلو', category: 'body', groupLabel: 'بخش جلو', x3d: 0, y3d: 14, z3d: 206, cx2d: 50, cy2d: 9 },
  { key: 'hood', label: 'درب موتور (کاپوت)', category: 'body', groupLabel: 'بخش جلو', x3d: 0, y3d: -28, z3d: 135, cx2d: 50, cy2d: 21.5 },
  { key: 'roof', label: 'سقف خودرو', category: 'body', groupLabel: 'بخش میانی', x3d: 0, y3d: -75, z3d: -15, cx2d: 50, cy2d: 51.5 },
  { key: 'trunk', label: 'درب صندوق عقب', category: 'body', groupLabel: 'بخش عقب', x3d: 0, y3d: -28, z3d: -150, cx2d: 50, cy2d: 79 },
  { key: 'rear_bumper', label: 'سپر عقب', category: 'body', groupLabel: 'بخش عقب', x3d: 0, y3d: 14, z3d: -206, cx2d: 50, cy2d: 92.5 },

  // Left Side (سمت راننده - سمت چپ نقشه)
  { key: 'fender_fl', label: 'گلگیر جلو چپ', category: 'body', groupLabel: 'سمت چپ (راننده)', x3d: -88, y3d: -4, z3d: 112, cx2d: 18.5, cy2d: 21.5 },
  { key: 'door_fl', label: 'درب جلو چپ', category: 'body', groupLabel: 'سمت چپ (راننده)', x3d: -88, y3d: 10, z3d: 40, cx2d: 18.5, cy2d: 40 },
  { key: 'door_rl', label: 'درب عقب چپ', category: 'body', groupLabel: 'سمت چپ (راننده)', x3d: -88, y3d: 10, z3d: -65, cx2d: 18.5, cy2d: 59 },
  { key: 'fender_rl', label: 'گلگیر عقب چپ', category: 'body', groupLabel: 'سمت چپ (راننده)', x3d: -88, y3d: -4, z3d: -140, cx2d: 18.5, cy2d: 77 },
  { key: 'rocker_l', label: 'رکاب چپ', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -75, y3d: 25, z3d: -15, cx2d: 6.5, cy2d: 50 },

  // Right Side (سمت شاگرد - سمت راست نقشه)
  { key: 'fender_fr', label: 'گلگیر جلو راست', category: 'body', groupLabel: 'سمت راست (شاگرد)', x3d: 88, y3d: -4, z3d: 112, cx2d: 81.5, cy2d: 21.5 },
  { key: 'door_fr', label: 'درب جلو راست', category: 'body', groupLabel: 'سمت راست (شاگرد)', x3d: 88, y3d: 10, z3d: 40, cx2d: 81.5, cy2d: 40 },
  { key: 'door_rr', label: 'درب عقب راست', category: 'body', groupLabel: 'سمت راست (شاگرد)', x3d: 88, y3d: 10, z3d: -65, cx2d: 81.5, cy2d: 59 },
  { key: 'fender_rr', label: 'گلگیر عقب راست', category: 'body', groupLabel: 'سمت راست (شاگرد)', x3d: 88, y3d: -4, z3d: -140, cx2d: 81.5, cy2d: 77 },
  { key: 'rocker_r', label: 'رکاب راست', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 75, y3d: 25, z3d: -15, cx2d: 93.5, cy2d: 50 },

  // Structural Chassis & Inner Apron (سرشاسی‌ها و سینی‌ها)
  { key: 'chassis_front_l', label: 'سرشاسی و سینی جلو چپ', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -40, y3d: 20, z3d: 180, cx2d: 36.5, cy2d: 15.5 },
  { key: 'chassis_front_r', label: 'سرشاسی و سینی جلو راست', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 40, y3d: 20, z3d: 180, cx2d: 63.5, cy2d: 15.5 },
  { key: 'chassis_rear_l', label: 'سرشاسی و سینی عقب چپ', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -40, y3d: 20, z3d: -180, cx2d: 36.5, cy2d: 85.5 },
  { key: 'chassis_rear_r', label: 'سرشاسی و سینی عقب راست', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 40, y3d: 20, z3d: -180, cx2d: 63.5, cy2d: 85.5 },

  // Pillars (ستون‌های A, B, C)
  { key: 'pillar_a_l', label: 'ستون جلو چپ (ستون A)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -55, y3d: -30, z3d: 60, cx2d: 31.5, cy2d: 35 },
  { key: 'pillar_b_l', label: 'ستون وسط چپ (ستون B)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -55, y3d: -30, z3d: -15, cx2d: 31.5, cy2d: 51.5 },
  { key: 'pillar_c_l', label: 'ستون عقب چپ (ستون C)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: -55, y3d: -30, z3d: -90, cx2d: 31.5, cy2d: 68 },
  { key: 'pillar_a_r', label: 'ستون جلو راست (ستون A)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 55, y3d: -30, z3d: 60, cx2d: 68.5, cy2d: 35 },
  { key: 'pillar_b_r', label: 'ستون وسط راست (ستون B)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 55, y3d: -30, z3d: -15, cx2d: 68.5, cy2d: 51.5 },
  { key: 'pillar_c_r', label: 'ستون عقب راست (ستون C)', category: 'chassis_pillar', groupLabel: 'شاسی و ستون', x3d: 55, y3d: -30, z3d: -90, cx2d: 68.5, cy2d: 68 }
];

export const mapPartKeyToEstimateName = (key: string): string => {
  return getExactPersianPartName(key);
};

const PART_LABELS: Record<string, string> = ALL_INSPECTION_PARTS.reduce(
  (acc, p) => {
    acc[p.key] = p.label;
    return acc;
  },
  {} as Record<string, string>
);

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

  // Edit form state for dedicated modal
  const [formSeverity, setFormSeverity] = useState<'none' | 'minor' | 'moderate' | 'major'>('minor');
  const [formType, setFormType] = useState<string>('فرورفتگی و قری بدنه');
  const [formOperation, setFormOperation] = useState<string>('صافکاری و نقاشی');
  const [formNote, setFormNote] = useState<string>('');
  const [formPercentage, setFormPercentage] = useState<number>(35);

  const openEditModalForPart = (partKey: string) => {
    setActivePartKey(partKey);
    const spot = damageData[partKey];
    const initialSeverity = spot?.severity || 'minor';
    setFormSeverity(initialSeverity);
    setFormType(spot?.type || 'فرورفتگی و قری بدنه');
    setFormOperation(spot?.operation || (initialSeverity === 'major' ? 'تعویض کامل قطعه' : 'صافکاری و نقاشی'));
    setFormNote(spot?.note || '');
    setFormPercentage(initialSeverity === 'major' ? 100 : initialSeverity === 'moderate' ? 45 : initialSeverity === 'minor' ? 20 : 0);
    setEditingPartKey(partKey);
  };

  const handleSelectPart = (partKey: string) => {
    setActivePartKey(partKey);
    const partDef = ALL_INSPECTION_PARTS.find((p) => p.key === partKey);
    if (onSpotClick && partDef) {
      onSpotClick(partKey, partDef.label);
    }
    if (editable) {
      openEditModalForPart(partKey);
    }
  };

  const handleModalPartChange = (newKey: string) => {
    setEditingPartKey(newKey);
    setActivePartKey(newKey);
    const spot = damageData[newKey];
    const initialSeverity = spot?.severity || 'minor';
    setFormSeverity(initialSeverity);
    setFormType(spot?.type || 'فرورفتگی و قری بدنه');
    setFormOperation(spot?.operation || (initialSeverity === 'major' ? 'تعویض کامل قطعه' : 'صافکاری و نقاشی'));
    setFormNote(spot?.note || '');
    setFormPercentage(initialSeverity === 'major' ? 100 : initialSeverity === 'moderate' ? 45 : initialSeverity === 'minor' ? 20 : 0);
  };

  const handleRemoveDamage = () => {
    if (!editingPartKey) return;
    const updated = { ...damageData };
    delete updated[editingPartKey];
    if (onChangeDamageData) {
      onChangeDamageData(updated);
    }
    setEditingPartKey(null);
  };

  const handleQuickSetStatus = (partKey: string, severity: 'none' | 'moderate' | 'major') => {
    setActivePartKey(partKey);
    const updated = { ...damageData };
    const estimateName = mapPartKeyToEstimateName(partKey);

    if (severity === 'none') {
      delete updated[partKey];
    } else if (severity === 'moderate') {
      updated[partKey] = {
        type: 'صافکاری و نقاشی',
        severity: 'moderate',
        operation: 'صافکاری و نقاشی',
        color: 'orange',
        note: 'ثبت سریع ارزیابی — نیاز به صافکاری و نقاشی',
        updatedAt: new Date().toLocaleDateString('fa-IR')
      };
      if (onAddPartToEstimate) {
        onAddPartToEstimate(estimateName, 'repair', 'نیاز به صافکاری و نقاشی');
      }
    } else if (severity === 'major') {
      updated[partKey] = {
        type: 'تعویض کامل قطعه',
        severity: 'major',
        operation: 'تعویض کامل قطعه',
        color: 'red',
        note: 'ثبت سریع ارزیابی — آسیب شدید و نیاز به تعویض',
        updatedAt: new Date().toLocaleDateString('fa-IR')
      };
      if (onAddPartToEstimate) {
        onAddPartToEstimate(estimateName, 'replace', 'تعویض قطعه');
      }
    }

    if (onChangeDamageData) {
      onChangeDamageData(updated);
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
      const partName = mapPartKeyToEstimateName(editingPartKey);
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

  const getPanelVisual = (partKey: string) => {
    const spot = damageData[partKey];
    const isSelected = activePartKey === partKey;

    let fill = '#F8FAFC';
    let stroke = '#94A3B8';
    let strokeWidth = 1.75;
    let filter = '';

    if (spot && spot.severity !== 'none') {
      if (spot.severity === 'major' || spot.color === 'red') {
        fill = '#FFE4E6'; // rose-100
        stroke = '#E11D48'; // rose-600
        strokeWidth = 2.5;
      } else if (spot.severity === 'moderate' || spot.color === 'orange') {
        fill = '#FEF3C7'; // amber-100
        stroke = '#D97706'; // amber-600
        strokeWidth = 2.5;
      } else {
        fill = '#FEF9C3'; // yellow-100
        stroke = '#CA8A04'; // yellow-600
        strokeWidth = 2;
      }
    }

    if (isSelected) {
      stroke = '#9333EA';
      strokeWidth = 3.5;
      filter = 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.45))';
    }

    return { fill, stroke, strokeWidth, filter, isSelected, spot };
  };

  const renderPartBadge = (
    partKey: string,
    cx: number,
    cy: number,
    shortLabel: string,
    badgeW = 100,
    badgeH = 24
  ) => {
    const { isSelected, spot } = getPanelVisual(partKey);
    const isDamaged = spot && spot.severity !== 'none';
    const isMajor = spot?.severity === 'major' || spot?.color === 'red';
    const isModerate = spot?.severity === 'moderate' || spot?.color === 'orange';
    const isMinor = spot?.severity === 'minor' || spot?.color === 'yellow';

    let badgeBg = '#FFFFFF';
    let badgeBorder = '#64748B';
    let textColor = '#0F172A';
    let statusDot = '#10B981';

    if (isMajor) {
      badgeBg = '#E11D48';
      badgeBorder = '#9F1239';
      textColor = '#FFFFFF';
      statusDot = '#FFFFFF';
    } else if (isModerate) {
      badgeBg = '#D97706';
      badgeBorder = '#92400E';
      textColor = '#FFFFFF';
      statusDot = '#FFFFFF';
    } else if (isMinor) {
      badgeBg = '#EAB308';
      badgeBorder = '#A16207';
      textColor = '#422006';
      statusDot = '#422006';
    }

    if (isSelected && !isDamaged) {
      badgeBg = '#FAF5FF';
      badgeBorder = '#9333EA';
      textColor = '#581C87';
      statusDot = '#9333EA';
    }

    const rx = badgeH / 2;

    return (
      <g
        key={`badge-${partKey}`}
        className="cursor-pointer select-none transition-all duration-150 group"
        onClick={(e) => {
          e.stopPropagation();
          handleSelectPart(partKey);
        }}
      >
        {/* Animated Highlight ring when selected */}
        {isSelected && (
          <rect
            x={cx - badgeW / 2 - 3}
            y={cy - badgeH / 2 - 3}
            width={badgeW + 6}
            height={badgeH + 6}
            rx={rx + 3}
            fill="none"
            stroke="#9333EA"
            strokeWidth="3"
            strokeDasharray="4 2"
            className="animate-spin"
            style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: '8s' }}
          />
        )}

        {/* Badge Background Button */}
        <rect
          x={cx - badgeW / 2}
          y={cy - badgeH / 2}
          width={badgeW}
          height={badgeH}
          rx={rx}
          fill={badgeBg}
          stroke={isSelected ? '#9333EA' : badgeBorder}
          strokeWidth={isSelected ? 2.5 : 1.5}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.18))"
          className="transition-transform group-hover:scale-105"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Status Dot */}
        <circle
          cx={cx - badgeW / 2 + 10}
          cy={cy}
          r={isDamaged ? 4 : 3}
          fill={statusDot}
        />

        {/* Part Label Text */}
        <text
          x={cx + 5}
          y={cy + 3.5}
          textAnchor="middle"
          fill={textColor}
          fontSize={badgeH >= 24 ? '10' : '9'}
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          className="pointer-events-none"
        >
          {shortLabel}
        </text>
      </g>
    );
  };

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

      {/* Active Part Overview Bar - Clean and uncluttered */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-300 font-bold">قطعه انتخاب‌شده:</span>
              <strong className="text-sm font-black text-white">{activePartDef.label}</strong>
              <span className="text-[11px] text-slate-400 font-normal">({activePartDef.groupLabel})</span>
            </div>
          </div>
          <div>{getSpotBadge(activeSpot)}</div>
        </div>

        {editable && (
          <button
            type="button"
            onClick={() => openEditModalForPart(activePartDef.key)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all flex items-center gap-2 shadow-md cursor-pointer border border-purple-400/40"
            title="باز کردن پنجره تعیین نوع قطعه، نوع خسارت و وضعیت تعمیر یا تعویض"
          >
            <Edit3 className="w-4 h-4" />
            <span>ثبت و ویرایش وضعیت در پنجره ارزیابی</span>
          </button>
        )}
      </div>

      {/* Main Grid: Blueprint/3D Canvas + Side Checklist & Assessor Notes Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left / Main Column: Visual Blueprint or 3D Canvas */}
        <div className="lg:col-span-7 space-y-4">
          
          {viewMode === '2d_sheet' ? (
            /* 2D UNFOLDED CAR BLUEPRINT (برگه کارشناسی استاندارد با دکمه‌های واضح روی قطعات بدنه) */
            <div className="relative bg-gradient-to-b from-slate-50 via-white to-slate-100 border-2 border-slate-200 rounded-3xl p-4 sm:p-6 shadow-inner select-none">
              
              {/* Header inside Sheet */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-700">
                <span className="flex items-center gap-1.5 text-purple-900 font-black">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  نقشه گسترده و باز شده قطعات خودرو (انتخاب مستقیم با کلیک روی هر قطعه)
                </span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-lg text-[10px]">
                  پرونده: {caseId}
                </span>
              </div>

              {/* Blueprint SVG Diagram Container - کاملاً تمیز و یکپارچه بدون دکمه‌های مزاحم */}
              <div className="relative w-full max-w-[500px] mx-auto bg-white rounded-2xl border-2 border-slate-300 p-2 sm:p-4 shadow-sm flex items-center justify-center">
                <svg
                  viewBox="0 0 400 520"
                  className="w-full h-auto max-h-[620px] drop-shadow-sm select-none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* BASE LAYER 1: WHEELS & CHASSIS GUIDES */}
                  {/* Front Wheels */}
                  <rect x="18" y="90" width="24" height="42" rx="6" className="fill-slate-300 stroke-slate-500" strokeWidth="1.5" />
                  <rect x="358" y="90" width="24" height="42" rx="6" className="fill-slate-300 stroke-slate-500" strokeWidth="1.5" />
                  {/* Rear Wheels */}
                  <rect x="18" y="380" width="24" height="42" rx="6" className="fill-slate-300 stroke-slate-500" strokeWidth="1.5" />
                  <rect x="358" y="380" width="24" height="42" rx="6" className="fill-slate-300 stroke-slate-500" strokeWidth="1.5" />

                  {/* Front Chassis Guide Lines */}
                  <line x1="140" y1="65" x2="160" y2="105" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="260" y1="65" x2="240" y2="105" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Rear Chassis Guide Lines */}
                  <line x1="140" y1="445" x2="160" y2="405" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="260" y1="445" x2="240" y2="405" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Windshield & Rear Window (Non-clickable glass) */}
                  <path d="M 115 155 L 285 155 L 275 205 L 125 205 Z" className="fill-sky-50/50 stroke-slate-300" strokeWidth="1.5" strokeDasharray="3 2" />
                  <path d="M 125 335 L 275 335 L 285 375 L 115 375 Z" className="fill-sky-50/50 stroke-slate-300" strokeWidth="1.5" strokeDasharray="3 2" />

                  {/* LAYER 2: CAR BODY PANELS (کلیک مستقیم روی بدنه) */}
                  {/* سپر جلو */}
                  <path
                    d="M 130 50 C 160 30, 240 30, 270 50 L 275 65 L 125 65 Z"
                    fill={getPanelVisual('front_bumper').fill}
                    stroke={getPanelVisual('front_bumper').stroke}
                    strokeWidth={getPanelVisual('front_bumper').strokeWidth}
                    filter={getPanelVisual('front_bumper').filter}
                    onClick={() => handleSelectPart('front_bumper')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />

                  {/* کاپوت / درب موتور */}
                  <path
                    d="M 125 65 L 275 65 L 285 155 L 115 155 Z"
                    fill={getPanelVisual('hood').fill}
                    stroke={getPanelVisual('hood').stroke}
                    strokeWidth={getPanelVisual('hood').strokeWidth}
                    filter={getPanelVisual('hood').filter}
                    onClick={() => handleSelectPart('hood')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />

                  {/* سقف خودرو */}
                  <rect
                    x="125"
                    y="205"
                    width="150"
                    height="130"
                    rx="8"
                    fill={getPanelVisual('roof').fill}
                    stroke={getPanelVisual('roof').stroke}
                    strokeWidth={getPanelVisual('roof').strokeWidth}
                    filter={getPanelVisual('roof').filter}
                    onClick={() => handleSelectPart('roof')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />

                  {/* درب صندوق عقب */}
                  <path
                    d="M 115 375 L 285 375 L 275 445 L 125 445 Z"
                    fill={getPanelVisual('trunk').fill}
                    stroke={getPanelVisual('trunk').stroke}
                    strokeWidth={getPanelVisual('trunk').strokeWidth}
                    filter={getPanelVisual('trunk').filter}
                    onClick={() => handleSelectPart('trunk')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />

                  {/* سپر عقب */}
                  <path
                    d="M 125 445 C 160 465, 240 465, 275 445 L 270 475 C 240 495, 160 495, 130 475 Z"
                    fill={getPanelVisual('rear_bumper').fill}
                    stroke={getPanelVisual('rear_bumper').stroke}
                    strokeWidth={getPanelVisual('rear_bumper').strokeWidth}
                    filter={getPanelVisual('rear_bumper').filter}
                    onClick={() => handleSelectPart('rear_bumper')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />

                  {/* سمت چپ (سمت راننده) */}
                  {/* گلگیر جلو چپ */}
                  <path
                    d="M 115 65 L 75 75 L 60 145 L 115 155 Z"
                    fill={getPanelVisual('fender_fl').fill}
                    stroke={getPanelVisual('fender_fl').stroke}
                    strokeWidth={getPanelVisual('fender_fl').strokeWidth}
                    filter={getPanelVisual('fender_fl').filter}
                    onClick={() => handleSelectPart('fender_fl')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />
                  {/* درب جلو چپ */}
                  <path
                    d="M 115 155 L 55 160 L 50 260 L 125 260 Z"
                    fill={getPanelVisual('door_fl').fill}
                    stroke={getPanelVisual('door_fl').stroke}
                    strokeWidth={getPanelVisual('door_fl').strokeWidth}
                    filter={getPanelVisual('door_fl').filter}
                    onClick={() => handleSelectPart('door_fl')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />
                  {/* درب عقب چپ */}
                  <path
                    d="M 125 260 L 50 260 L 55 355 L 115 355 Z"
                    fill={getPanelVisual('door_rl').fill}
                    stroke={getPanelVisual('door_rl').stroke}
                    strokeWidth={getPanelVisual('door_rl').strokeWidth}
                    filter={getPanelVisual('door_rl').filter}
                    onClick={() => handleSelectPart('door_rl')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />
                  {/* گلگیر عقب چپ */}
                  <path
                    d="M 115 355 L 60 365 L 75 435 L 115 445 Z"
                    fill={getPanelVisual('fender_rl').fill}
                    stroke={getPanelVisual('fender_rl').stroke}
                    strokeWidth={getPanelVisual('fender_rl').strokeWidth}
                    filter={getPanelVisual('fender_rl').filter}
                    onClick={() => handleSelectPart('fender_rl')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />
                  {/* رکاب چپ */}
                  <rect
                    x="25"
                    y="165"
                    width="20"
                    height="185"
                    rx="5"
                    fill={getPanelVisual('rocker_l').fill}
                    stroke={getPanelVisual('rocker_l').stroke}
                    strokeWidth={getPanelVisual('rocker_l').strokeWidth}
                    filter={getPanelVisual('rocker_l').filter}
                    onClick={() => handleSelectPart('rocker_l')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />

                  {/* سمت راست (سمت شاگرد) */}
                  {/* گلگیر جلو راست */}
                  <path
                    d="M 285 65 L 325 75 L 340 145 L 285 155 Z"
                    fill={getPanelVisual('fender_fr').fill}
                    stroke={getPanelVisual('fender_fr').stroke}
                    strokeWidth={getPanelVisual('fender_fr').strokeWidth}
                    filter={getPanelVisual('fender_fr').filter}
                    onClick={() => handleSelectPart('fender_fr')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />
                  {/* درب جلو راست */}
                  <path
                    d="M 285 155 L 345 160 L 350 260 L 275 260 Z"
                    fill={getPanelVisual('door_fr').fill}
                    stroke={getPanelVisual('door_fr').stroke}
                    strokeWidth={getPanelVisual('door_fr').strokeWidth}
                    filter={getPanelVisual('door_fr').filter}
                    onClick={() => handleSelectPart('door_fr')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />
                  {/* درب عقب راست */}
                  <path
                    d="M 275 260 L 350 260 L 345 355 L 285 355 Z"
                    fill={getPanelVisual('door_rr').fill}
                    stroke={getPanelVisual('door_rr').stroke}
                    strokeWidth={getPanelVisual('door_rr').strokeWidth}
                    filter={getPanelVisual('door_rr').filter}
                    onClick={() => handleSelectPart('door_rr')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />
                  {/* گلگیر عقب راست */}
                  <path
                    d="M 285 355 L 340 365 L 325 435 L 285 445 Z"
                    fill={getPanelVisual('fender_rr').fill}
                    stroke={getPanelVisual('fender_rr').stroke}
                    strokeWidth={getPanelVisual('fender_rr').strokeWidth}
                    filter={getPanelVisual('fender_rr').filter}
                    onClick={() => handleSelectPart('fender_rr')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />
                  {/* رکاب راست */}
                  <rect
                    x="355"
                    y="165"
                    width="20"
                    height="185"
                    rx="5"
                    fill={getPanelVisual('rocker_r').fill}
                    stroke={getPanelVisual('rocker_r').stroke}
                    strokeWidth={getPanelVisual('rocker_r').strokeWidth}
                    filter={getPanelVisual('rocker_r').filter}
                    onClick={() => handleSelectPart('rocker_r')}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                  />

                  {/* LAYER 3: INTERACTIVE BADGES / BUTTONS (کاملاً روی شکل، خوانا، بدون هم‌پوشانی) */}
                  {/* بخش ستون وسط (بخش‌های اصلی) */}
                  {renderPartBadge('front_bumper', 200, 48, 'سپر جلو', 85, 23)}
                  {renderPartBadge('hood', 200, 110, 'درب موتور (کاپوت)', 125, 26)}
                  {renderPartBadge('roof', 200, 270, 'سقف خودرو', 105, 26)}
                  {renderPartBadge('trunk', 200, 410, 'درب صندوق عقب', 115, 26)}
                  {renderPartBadge('rear_bumper', 200, 465, 'سپر عقب', 85, 23)}

                  {/* بخش‌های سمت چپ */}
                  {renderPartBadge('fender_fl', 86, 110, 'گلگیر ج.چ', 76, 22)}
                  {renderPartBadge('door_fl', 86, 207, 'درب جلو چپ', 76, 22)}
                  {renderPartBadge('door_rl', 86, 307, 'درب عقب چپ', 76, 22)}
                  {renderPartBadge('fender_rl', 86, 400, 'گلگیر ع.چ', 76, 22)}
                  {renderPartBadge('rocker_l', 35, 257, 'رکاب چپ', 60, 20)}

                  {/* بخش‌های سمت راست */}
                  {renderPartBadge('fender_fr', 314, 110, 'گلگیر ج.ر', 76, 22)}
                  {renderPartBadge('door_fr', 314, 207, 'درب جلو راست', 76, 22)}
                  {renderPartBadge('door_rr', 314, 307, 'درب عقب راست', 76, 22)}
                  {renderPartBadge('fender_rr', 314, 400, 'گلگیر ع.ر', 76, 22)}
                  {renderPartBadge('rocker_r', 365, 257, 'رکاب راست', 60, 20)}

                  {/* سرشاسی‌ها */}
                  {renderPartBadge('chassis_front_l', 148, 78, 'شاسی ج.چ', 66, 19)}
                  {renderPartBadge('chassis_front_r', 252, 78, 'شاسی ج.ر', 66, 19)}
                  {renderPartBadge('chassis_rear_l', 148, 432, 'شاسی ع.چ', 66, 19)}
                  {renderPartBadge('chassis_rear_r', 252, 432, 'شاسی ع.ر', 66, 19)}

                  {/* ستون‌ها */}
                  {renderPartBadge('pillar_a_l', 124, 175, 'ستون A (چ)', 62, 19)}
                  {renderPartBadge('pillar_a_r', 276, 175, 'ستون A (ر)', 62, 19)}
                  {renderPartBadge('pillar_b_l', 124, 258, 'ستون B (چ)', 62, 19)}
                  {renderPartBadge('pillar_b_r', 276, 258, 'ستون B (ر)', 62, 19)}
                  {renderPartBadge('pillar_c_l', 124, 345, 'ستون C (چ)', 62, 19)}
                  {renderPartBadge('pillar_c_r', 276, 345, 'ستون C (ر)', 62, 19)}
                </svg>
              </div>

              {/* Color Code Legend */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-center flex-wrap gap-3 sm:gap-6 text-[11px] font-bold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-700 inline-block" />
                  <span>سالم / بی‌رنگ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-700 inline-block" />
                  <span>تعمیری / صافکاری و نقاشی (نارنجی)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-rose-800 inline-block animate-pulse" />
                  <span>تعویضی / آسیب شدید (قرمز)</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-700">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-purple-600 ring-2 ring-purple-300 inline-block" />
                  <span>قطعه انتخاب‌شده</span>
                </div>
              </div>
            </div>
          ) : (
            /* 3D ORBIT VIEW MODE — مدل واقعی three.js */
            <Car3DModel
              damageData={damageData}
              activePartKey={activePartKey}
              onSelectPart={handleSelectPart}
              partLabels={PART_LABELS}
            />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/10 p-3 rounded-2xl border border-white/10">
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

            {/* Action Button to open the dedicated modal */}
            {editable && (
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => openEditModalForPart(activePartDef.key)}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 border border-purple-400/40 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>ثبت و ویرایش جزئیات این قطعه در صفحه کارشناسی</span>
                </button>
              </div>
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

      {/* DEDICATED MODAL: انتخاب نوع قطعه، نوع خسارت، نیازمند تعمیر یا تعویض و توضیحات */}
      {editable && editingPartKey && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99999] flex justify-center items-start overflow-y-auto pt-24 sm:pt-28 pb-12 px-3 sm:px-6">
          <div className="bg-white rounded-3xl border-2 border-purple-400 shadow-2xl max-w-2xl w-full max-h-[calc(100vh-8.5rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 shadow-purple-950/25">
            
            {/* Modal Header - Fixed at Top, Brought Lower and Never Cut Off */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4.5 bg-gradient-to-r from-purple-50/90 via-white to-slate-50 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20 shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-normal">
                      صفحه کارشناسی و تعیین وضعیت قطعه
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                      {ALL_INSPECTION_PARTS.find((p) => p.key === editingPartKey)?.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                    تعیین نوع قطعه، نوع خسارت، نیازمندی به تعمیر یا تعویض و گزارش تکمیلی ارزیابی
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartKey(null)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
                title="بستن پنجره"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable Container */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
              {/* بخش ۱: انتخاب یا تغییر نوع قطعه خودرو */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-black text-slate-800">
                  نوع و نام قطعه خودرو:
                </label>
                <select
                  value={editingPartKey}
                  onChange={(e) => handleModalPartChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-xs font-black focus:outline-none focus:border-purple-600 shadow-2xs"
                >
                  <optgroup label="قطعات اصلی بدنه (درب‌ها، کاپوت، سقف، صندوق، گلگیرها و سپرها)">
                    {ALL_INSPECTION_PARTS.filter((p) => p.category === 'body').map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label} {p.groupLabel ? `(${p.groupLabel})` : ''}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="شاسی، سرشاسی‌ها، ستون‌ها و رکاب‌ها">
                    {ALL_INSPECTION_PARTS.filter((p) => p.category === 'chassis_pillar').map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label} {p.groupLabel ? `(${p.groupLabel})` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* بخش ۲: وضعیت قطعه — نیازمند تعمیر یا تعویض یا سالم */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800">
                  وضعیت قطعه و نیازمندی به اقدام فنی (سالم / تعمیر / تعویض):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* 1: سالم */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormSeverity('none');
                      setFormPercentage(0);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 cursor-pointer ${
                      formSeverity === 'none'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-300 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      formSeverity === 'none' ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300'
                    }`}>
                      {formSeverity === 'none' && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <span className="font-black text-slate-900 block text-xs">
                        سالم / فاقد آسیب و رنگ
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        قطعه فابریک کارخانه، بدون هرگونه ضربه، خط و خش یا تغییر وضعیت
                      </span>
                    </div>
                  </button>

                  {/* 2: آسیب جزئی / تعمیر سبک */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormSeverity('minor');
                      if (formPercentage === 0) setFormPercentage(20);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 cursor-pointer ${
                      formSeverity === 'minor'
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-950 ring-2 ring-yellow-300 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-yellow-50/40'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      formSeverity === 'minor' ? 'bg-yellow-500 text-white' : 'border-2 border-slate-300'
                    }`}>
                      {formSeverity === 'minor' && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <span className="font-black text-slate-900 block text-xs">
                        آسیب جزئی (تعمیر سبک / PDR)
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        خط و خش سطحی، لیسه‌گیری یا صافکاری بدون رنگ بدون افت قیمت شدید
                      </span>
                    </div>
                  </button>

                  {/* 3: نیازمند تعمیر */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormSeverity('moderate');
                      if (formPercentage === 0 || formPercentage === 100) setFormPercentage(45);
                      if (formOperation.includes('تعویض')) setFormOperation('صافکاری و نقاشی');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 cursor-pointer ${
                      formSeverity === 'moderate'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-300 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50/40'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      formSeverity === 'moderate' ? 'bg-amber-500 text-white' : 'border-2 border-slate-300'
                    }`}>
                      {formSeverity === 'moderate' && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <span className="font-black text-slate-900 block text-xs">
                        نیازمند تعمیر (صافکاری و نقاشی)
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        فرورفتگی، دفرمگی و آسیب نیازمند صافکاری با قالب و رنگ‌آمیزی کوره‌ای
                      </span>
                    </div>
                  </button>

                  {/* 4: نیازمند تعویض */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormSeverity('major');
                      setFormPercentage(100);
                      setFormOperation('تعویض کامل قطعه (فابریک شرکتی)');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 cursor-pointer ${
                      formSeverity === 'major'
                        ? 'bg-rose-50 border-rose-600 text-rose-950 ring-2 ring-rose-300 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-rose-50/40'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      formSeverity === 'major' ? 'bg-rose-600 text-white' : 'border-2 border-slate-300'
                    }`}>
                      {formSeverity === 'major' && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <span className="font-black text-rose-900 block text-xs">
                        نیازمند تعویض (آسیب شدید)
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        شکستگی، پارگی یا دفرمگی غیرقابل‌ترمیم و نیاز به تعویض کامل پوسته یا شاسی
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* بخش‌های جزئیات خسارت فقط در صورت وجود آسیب */}
              {formSeverity !== 'none' && (
                <div className="space-y-4 pt-1 border-t border-slate-100 animate-in fade-in">
                  
                  {/* بخش ۳: نوع دقیق خسارت */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-800">
                      نوع دقیق خسارت واردشده:
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold focus:outline-none focus:border-purple-600"
                    >
                      <option value="فرورفتگی و قری بدنه">فرورفتگی و قری بدنه</option>
                      <option value="خط و خش عمیق و سایش رنگ">خط و خش عمیق و سایش رنگ</option>
                      <option value="دفرمگی و لهیدگی شدید">دفرمگی و لهیدگی شدید</option>
                      <option value="شکستگی، پارگی یا سوراخ‌شدگی">شکستگی، پارگی یا سوراخ‌شدگی</option>
                      <option value="رنگ‌پریدگی، سوختگی یا بتونه قبلی">رنگ‌پریدگی، سوختگی یا بتونه قبلی</option>
                      <option value="دفرمگی و کشیدگی شاسی خودرو">دفرمگی و کشیدگی شاسی خودرو</option>
                      <option value="شکستگی موم یا بازشدگی درز فابریک">شکستگی موم یا بازشدگی درز فابریک</option>
                      <option value="سایر آسیب‌ها و عیوب ظاهری">سایر آسیب‌ها و عیوب ظاهری</option>
                    </select>

                    {/* کلیدهای سریع انتخاب نوع خسارت */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {[
                        'فرورفتگی و قری بدنه',
                        'خط و خش عمیق',
                        'لهیدگی و دفرمگی',
                        'شکستگی و پارگی',
                        'دفرمگی شاسی'
                      ].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormType(t)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            formType.includes(t)
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* بخش ۴: عملیات فنی پیشنهادی (تعمیر یا تعویض یا PDR) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-800">
                      عملیات فنی پیشنهادی کارشناس:
                    </label>
                    <select
                      value={formOperation}
                      onChange={(e) => setFormOperation(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold focus:outline-none focus:border-purple-600"
                    >
                      <option value="صافکاری بی‌رنگ (PDR)">صافکاری بی‌رنگ (PDR)</option>
                      <option value="صافکاری و نقاشی کامل کوره‌ای">صافکاری و نقاشی کامل کوره‌ای</option>
                      <option value="تعویض کامل قطعه (فابریک شرکتی)">تعویض کامل قطعه (فابریک شرکتی)</option>
                      <option value="تعویض کامل قطعه (استوک اصلی)">تعویض کامل قطعه (استوک اصلی)</option>
                      <option value="لیسه‌گیری و پولیش واکس">لیسه‌گیری و پولیش واکس</option>
                      <option value="شاسی‌کشی، تنظیم زاویه و میزان فرمان">شاسی‌کشی، تنظیم زاویه و میزان فرمان</option>
                      <option value="جوشکاری، تقویت و موم‌کشی مجدد">جوشکاری، تقویت و موم‌کشی مجدد</option>
                    </select>

                    {/* کلیدهای سریع انتخاب عملیات */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {[
                        'صافکاری بی‌رنگ (PDR)',
                        'صافکاری و نقاشی',
                        'تعویض کامل قطعه (فابریک شرکتی)',
                        'لیسه‌گیری و پولیش',
                        'شاسی‌کشی و تنظیم'
                      ].map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setFormOperation(op)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            formOperation.includes(op)
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* بخش ۵: برآورد درصد تخریب قطعه */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-black text-slate-800">
                        برآورد درصد تخریب قطعه:
                      </label>
                      <span className="font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                        {formPercentage} ٪
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={formPercentage}
                      onChange={(e) => setFormPercentage(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <button type="button" onClick={() => setFormPercentage(15)} className="hover:text-purple-600">۱۵٪ (خفیف)</button>
                      <button type="button" onClick={() => setFormPercentage(35)} className="hover:text-purple-600">۳۵٪ (متوسط)</button>
                      <button type="button" onClick={() => setFormPercentage(60)} className="hover:text-purple-600">۶۰٪ (شدید)</button>
                      <button type="button" onClick={() => setFormPercentage(100)} className="hover:text-purple-600">۱۰۰٪ (تعویض کامل)</button>
                    </div>
                  </div>

                  {/* بخش ۶: توضیحات و گزارش متنی کارشناس */}
                  <div className="space-y-1.5 text-xs">
                    <label className="block text-slate-800 font-black">
                      توضیحات و گزارش کارشناس ارزیاب:
                    </label>
                    <textarea
                      rows={3}
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      placeholder="مثال: درب جلو سمت راننده به طول ۴۰ سانتی‌متر دچار دفرمگی شده و نیاز به صافکاری با قالب و نقاشی دارد..."
                      className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                    />

                    {/* نمونه‌های آماده برای راحتی کارشناس */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">متن‌های پیشنهادی کارشناسی:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          'فرورفتگی به ابعاد ۳۰ سانتی‌متر بدون پارگی',
                          'نیاز به تعویض با قطعه فابریک شرکتی',
                          'صافکاری بی‌رنگ PDR بدون افت قیمت',
                          'شاسی خودرو دچار دفرمگی شده و نیاز به کشش دارد'
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setFormNote((prev) => prev ? `${prev} - ${preset}` : preset)}
                            className="text-[10px] bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-600 px-2 py-0.5 rounded-md transition-colors"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - Fixed at Bottom, Never Scrolls Away */}
            <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0 flex-wrap">
              <div>
                {damageData[editingPartKey] && (
                  <button
                    type="button"
                    onClick={handleRemoveDamage}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                    title="پاک کردن سابقه آسیب و علامت‌گذاری به عنوان سالم"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف آسیب (ثبت به عنوان سالم)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPartKey(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSavePartDamage}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>ثبت و اعمال در نقشه و گزارش</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
