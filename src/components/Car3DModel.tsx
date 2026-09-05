import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RotateCw, ZoomIn, ZoomOut, RefreshCw, Play, Pause } from 'lucide-react';
import { CarDamageSpot } from '../types';

/**
 * Car3DModel — مدل سه‌بعدی خودرو (سدان) با three.js
 * بدنه از پروفیل نمای جانبی اکسترود و سپس در عرض باریک می‌شود تا فرم واقعی
 * خودرو را بگیرد. هر ۲۵ قطعه کارشناسی یک مش مستقل و یک نقطه انتخاب دارد؛
 * رنگ بدنه ثابت می‌ماند و شدت آسیب فقط با رنگ نقطه نمایش داده می‌شود.
 */

export interface Car3DModelProps {
  damageData: Record<string, CarDamageSpot>;
  activePartKey: string | null;
  onSelectPart: (partKey: string) => void;
  partLabels: Record<string, string>;
}

type Severity = 'none' | 'minor' | 'moderate' | 'major';

const COLORS = {
  body: 0x7c3aed,
  panel: 0x7c3aed,
  roof: 0x0d1220,
  glass: 0x0b1020,
  chrome: 0x8fa3bf,
  dark: 0x0b1220,
  rubber: 0x111827,
  skirt: 0x1e2b45,
  seam: 0x1a1033,
  tail: 0xff3b5c,
  head: 0xdbeafe,
  chassis: 0x94a3b8,
  select: 0x2563eb
};

type PanelSpec = {
  key: string;
  size: [number, number, number];
  pos: [number, number, number];
  rot?: [number, number, number];
  color?: number;
};

const PANELS: PanelSpec[] = [
  { key: 'front_bumper', size: [1.34, 0.34, 0.24], pos: [0, 0.6, 2.06] },
  { key: 'rear_bumper', size: [1.34, 0.34, 0.24], pos: [0, 0.6, -2.0] },
  { key: 'hood', size: [1.18, 0.05, 0.72], pos: [0, 1.13, 1.48], rot: [-0.2, 0, 0] },
  { key: 'trunk', size: [1.2, 0.05, 0.6], pos: [0, 1.12, -1.52], rot: [0.11, 0, 0] },
  { key: 'roof', size: [1.24, 0.05, 1.1], pos: [0, 1.53, -0.18], color: COLORS.roof },

  { key: 'door_fl', size: [0.06, 0.44, 1.0], pos: [-0.9, 0.8, 0.15] },
  { key: 'door_rl', size: [0.06, 0.44, 0.9], pos: [-0.9, 0.8, -0.82] },
  { key: 'door_fr', size: [0.06, 0.44, 1.0], pos: [0.9, 0.8, 0.15] },
  { key: 'door_rr', size: [0.06, 0.44, 0.9], pos: [0.9, 0.8, -0.82] },

  { key: 'fender_fl', size: [0.07, 0.42, 0.9], pos: [-0.9, 0.78, 1.35] },
  { key: 'fender_rl', size: [0.07, 0.42, 0.85], pos: [-0.9, 0.78, -1.5] },
  { key: 'fender_fr', size: [0.07, 0.42, 0.9], pos: [0.9, 0.78, 1.35] },
  { key: 'fender_rr', size: [0.07, 0.42, 0.85], pos: [0.9, 0.78, -1.5] },

  { key: 'rocker_l', size: [0.07, 0.13, 2.3], pos: [-0.9, 0.5, -0.3] },
  { key: 'rocker_r', size: [0.07, 0.13, 2.3], pos: [0.9, 0.5, -0.3] },

  { key: 'pillar_a_l', size: [0.06, 0.09, 0.86], pos: [-0.9, 1.36, 0.8], rot: [-0.5, 0, 0] },
  { key: 'pillar_a_r', size: [0.06, 0.09, 0.86], pos: [0.9, 1.36, 0.8], rot: [-0.5, 0, 0] },
  { key: 'pillar_b_l', size: [0.06, 0.28, 0.08], pos: [-0.9, 1.34, -0.3] },
  { key: 'pillar_b_r', size: [0.06, 0.28, 0.08], pos: [0.9, 1.34, -0.3] },
  { key: 'pillar_c_l', size: [0.06, 0.09, 0.8], pos: [-0.9, 1.34, -0.98], rot: [0.52, 0, 0] },
  { key: 'pillar_c_r', size: [0.06, 0.09, 0.8], pos: [0.9, 1.34, -0.98], rot: [0.52, 0, 0] },

  { key: 'chassis_front_l', size: [0.28, 0.14, 0.55], pos: [-0.42, 0.36, 1.8], color: COLORS.chassis },
  { key: 'chassis_front_r', size: [0.28, 0.14, 0.55], pos: [0.42, 0.36, 1.8], color: COLORS.chassis },
  { key: 'chassis_rear_l', size: [0.28, 0.14, 0.55], pos: [-0.42, 0.36, -1.78], color: COLORS.chassis },
  { key: 'chassis_rear_r', size: [0.28, 0.14, 0.55], pos: [0.42, 0.36, -1.78], color: COLORS.chassis }
];

const VIEWS: Record<string, { az: number; pol: number }> = {
  right: { az: Math.PI / 2, pol: Math.PI / 2.15 },
  left: { az: -Math.PI / 2, pol: Math.PI / 2.15 },
  front: { az: 0, pol: Math.PI / 2.15 },
  rear: { az: Math.PI, pol: Math.PI / 2.15 },
  top: { az: Math.PI / 2.4, pol: 0.22 },
  iso: { az: Math.PI / 3.4, pol: Math.PI / 2.75 }
};

const START_DIST = 8.6;

const taperZ = (z: number) => 1 - 0.26 * Math.pow(Math.min(1, Math.abs(z) / 2.26), 2.2);
const tuckY = (y: number) => (y > 1.12 ? 1 - 0.2 * Math.min(1, (y - 1.12) / 0.42) : y < 0.6 ? 0.965 : 1);
const halfW = (y: number, z: number) => 0.88 * taperZ(z) * tuckY(y);

export const Car3DModel: React.FC<Car3DModelProps> = ({
  damageData,
  activePartKey,
  onSelectPart,
  partLabels
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<any>({});
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoverLabel, setHoverLabel] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // ---------- نورپردازی نمایشگاهی ----------
    scene.add(new THREE.HemisphereLight(0xe0e7ff, 0x1e293b, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(4.5, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    scene.add(key);
    const rimLight = new THREE.DirectionalLight(0xbfdbfe, 0.55);
    rimLight.position.set(-3, 2.5, -5);
    scene.add(rimLight);
    const spotA = new THREE.SpotLight(0xffffff, 13, 20, 0.75, 0.65, 1.4);
    spotA.position.set(3.5, 7.5, 4.5);
    spotA.castShadow = true;
    scene.add(spotA);
    const spotB = new THREE.SpotLight(0xc4b5fd, 12, 20, 0.8, 0.7, 1.6);
    spotB.position.set(-4.5, 6, -4);
    scene.add(spotB);

    // ---------- سکوی نمایشگاهی ----------
    const platform = new THREE.Mesh(
      new THREE.CircleGeometry(5, 64),
      new THREE.MeshStandardMaterial({ color: 0x121a2b, metalness: 0.35, roughness: 0.42 })
    );
    platform.rotation.x = -Math.PI / 2;
    platform.receiveShadow = true;
    scene.add(platform);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(5, 5.18, 64),
      new THREE.MeshBasicMaterial({ color: 0x334155, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    scene.add(ring);

    const car = new THREE.Group();
    scene.add(car);

    // سایه تماس نرم زیر خودرو
    const contactCanvas = document.createElement('canvas');
    contactCanvas.width = contactCanvas.height = 256;
    const cctx = contactCanvas.getContext('2d')!;
    const cgrad = cctx.createRadialGradient(128, 128, 10, 128, 128, 124);
    cgrad.addColorStop(0, 'rgba(2,6,23,0.55)');
    cgrad.addColorStop(1, 'rgba(2,6,23,0)');
    cctx.fillStyle = cgrad;
    cctx.fillRect(0, 0, 256, 256);
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 2.7),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(contactCanvas),
        transparent: true,
        depthWrite: false
      })
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.012;
    car.add(contact);

    // ---------- بدنه: پروفیل جانبی + اکسترود + باریک‌شدن ----------
    const paint = (color: number) =>
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.65,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.5
      });

    const shape = new THREE.Shape();
    shape.moveTo(-2.16, 0.44);
    shape.lineTo(-2.2, 0.62);
    shape.quadraticCurveTo(-2.22, 0.95, -1.86, 1.04);
    shape.quadraticCurveTo(-1.5, 1.1, -1.24, 1.12);
    shape.quadraticCurveTo(-1.0, 1.2, -0.72, 1.45);
    shape.quadraticCurveTo(-0.2, 1.54, 0.42, 1.52);
    shape.quadraticCurveTo(0.85, 1.5, 1.12, 1.24);
    shape.quadraticCurveTo(1.42, 1.1, 1.9, 1.04);
    shape.quadraticCurveTo(2.16, 1.0, 2.22, 0.78);
    shape.quadraticCurveTo(2.26, 0.56, 2.1, 0.44);
    shape.lineTo(-2.16, 0.44);

    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 1.76,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
      curveSegments: 6
    });
    bodyGeo.rotateY(Math.PI / 2);
    bodyGeo.translate(-0.88, 0, 0);
    {
      const pa = bodyGeo.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i);
        const y = pa.getY(i);
        const z = pa.getZ(i);
        pa.setX(i, x * taperZ(z) * tuckY(y));
      }
      pa.needsUpdate = true;
      bodyGeo.computeVertexNormals();
    }
    const shell = new THREE.Mesh(bodyGeo, paint(COLORS.body));
    shell.castShadow = true;
    shell.receiveShadow = true;
    car.add(shell);

    const underbody = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.16, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.8 })
    );
    underbody.position.set(0, 0.4, 0);
    car.add(underbody);

    // ---------- قطعات قابل کلیک ----------
    const panelMeshes: Record<string, THREE.Mesh> = {};
    const panelPositions: Record<string, [number, number, number]> = {};
    PANELS.forEach((p) => {
      const mat = p.color
        ? new THREE.MeshStandardMaterial({ color: p.color, metalness: 0.45, roughness: 0.4 })
        : paint(COLORS.panel);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...p.size), mat);
      let pos = p.pos;
      if (Math.abs(pos[0]) > 0.5) {
        pos = [Math.sign(pos[0]) * (halfW(pos[1], pos[2]) + 0.02), pos[1], pos[2]];
      }
      mesh.position.set(...pos);
      if (p.rot) mesh.rotation.set(...p.rot);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.partKey = p.key;
      mesh.userData.baseColor = p.color ?? COLORS.panel;
      car.add(mesh);
      panelMeshes[p.key] = mesh;
      panelPositions[p.key] = pos;
    });

    // ---------- شیشه‌ها ----------
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.glass,
      metalness: 0.15,
      roughness: 0.14,
      transparent: true,
      opacity: 0.85
    });
    const addGlass = (
      size: [number, number, number],
      pos: [number, number, number],
      rot: [number, number, number] = [0, 0, 0]
    ) => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(...size), glassMat);
      g.position.set(...pos);
      g.rotation.set(...rot);
      car.add(g);
    };
    addGlass([1.14, 0.05, 0.8], [0, 1.3, 0.86], [-0.56, 0, 0]);
    addGlass([1.12, 0.05, 0.74], [0, 1.28, -0.96], [0.56, 0, 0]);
    addGlass([0.05, 0.24, 0.78], [-0.73, 1.34, 0.12]);
    addGlass([0.05, 0.24, 0.7], [-0.73, 1.34, -0.72]);
    addGlass([0.05, 0.24, 0.78], [0.73, 1.34, 0.12]);
    addGlass([0.05, 0.24, 0.7], [0.73, 1.34, -0.72]);

    // ---------- جزئیات: جلوپنجره، LED، درز، دستگیره، اگزوز ----------
    const emissive = (color: number, intensity: number) =>
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.3 });
    const addBox = (
      size: [number, number, number],
      pos: [number, number, number],
      mat: THREE.Material
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
      m.position.set(...pos);
      car.add(m);
      return m;
    };
    const darkMat = new THREE.MeshStandardMaterial({ color: COLORS.dark, metalness: 0.5, roughness: 0.45 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: COLORS.chrome, metalness: 0.98, roughness: 0.15 });
    const seamMat = new THREE.MeshStandardMaterial({ color: COLORS.seam, roughness: 0.8 });

    [-0.44, 0.44].forEach((x) => addBox([0.4, 0.11, 0.08], [x, 0.92, 2.16], emissive(0xfffdf5, 0.9)));
    [-0.45, 0.45].forEach((x) => addBox([0.42, 0.12, 0.08], [x, 0.95, -2.08], emissive(COLORS.tail, 0.75)));
    addBox([1.06, 0.34, 0.05], [0, 0.76, 2.18], darkMat);
    for (let i = -5; i <= 5; i++) addBox([0.035, 0.3, 0.05], [i * 0.092, 0.76, 2.21], chromeMat);
    addBox([1.1, 0.035, 0.06], [0, 0.94, 2.19], chromeMat);
    addBox([1.1, 0.035, 0.06], [0, 0.58, 2.19], chromeMat);
    [-0.52, 0.52].forEach((x) => addBox([0.26, 0.09, 0.05], [x, 0.55, 2.12], darkMat));
    [-0.44, 0.44].forEach((x) => addBox([0.36, 0.035, 0.05], [x, 1.0, 2.12], emissive(COLORS.head, 1.6)));
    addBox([1.16, 0.05, 0.04], [0, 0.98, -2.04], emissive(COLORS.tail, 1.1));
    [-0.84, 0.84].forEach((x) => addBox([0.15, 0.07, 0.07], [x, 1.2, 0.72], paint(COLORS.body)));
    [-0.86, 0.86].forEach((x) => addBox([0.03, 0.04, 2.1], [x, 1.08, -0.3], chromeMat));
    const skirtMat = new THREE.MeshStandardMaterial({ color: COLORS.skirt, metalness: 0.35, roughness: 0.55 });
    [-0.87, 0.87].forEach((x) => addBox([0.05, 0.12, 2.2], [x, 0.48, -0.3], skirtMat));
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    addBox([0.4, 0.12, 0.03], [0, 0.68, 2.24], plateMat);
    addBox([0.4, 0.12, 0.03], [0, 0.7, -2.18], plateMat);
    [-0.9, 0.9].forEach((x) =>
      [0.42, -0.62].forEach((z) => addBox([0.05, 0.05, 0.2], [x, 0.95, z], chromeMat))
    );
    [-0.42, 0.42].forEach((x) => {
      const e = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 14), chromeMat);
      e.rotation.x = Math.PI / 2;
      e.position.set(x, 0.44, -2.06);
      car.add(e);
    });
    [-0.905, 0.905].forEach((x) =>
      [0.68, -0.34, -1.3].forEach((z) => addBox([0.012, 0.42, 0.02], [x, 0.8, z], seamMat))
    );
    [1.9, -1.86].forEach((z) => addBox([1.2, 0.02, 0.014], [0, 1.09, z], seamMat));

    // ---------- چرخ‌ها با رینگ ۵ پره ----------
    const rimCanvas = document.createElement('canvas');
    rimCanvas.width = rimCanvas.height = 256;
    {
      const g = rimCanvas.getContext('2d')!;
      g.fillStyle = '#111827';
      g.beginPath();
      g.arc(128, 128, 128, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#c9d4e6';
      g.beginPath();
      g.arc(128, 128, 96, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#0f172a';
      g.beginPath();
      g.arc(128, 128, 88, 0, Math.PI * 2);
      g.fill();
      g.save();
      g.translate(128, 128);
      g.fillStyle = '#dbe3ef';
      for (let i = 0; i < 5; i++) {
        g.rotate((Math.PI * 2) / 5);
        g.beginPath();
        g.moveTo(-13, 0);
        g.lineTo(13, 0);
        g.lineTo(22, -84);
        g.lineTo(-22, -84);
        g.closePath();
        g.fill();
      }
      g.fillStyle = '#94a3b8';
      g.beginPath();
      g.arc(0, 0, 26, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#475569';
      g.beginPath();
      g.arc(0, 0, 13, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    const rimMap = new THREE.CanvasTexture(rimCanvas);
    rimMap.anisotropy = 4;
    const tyreGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.26, 36);
    const tyreMat = new THREE.MeshStandardMaterial({ color: COLORS.rubber, roughness: 0.95 });
    const rimFaceMat = new THREE.MeshStandardMaterial({ map: rimMap, metalness: 0.75, roughness: 0.3 });
    const archGeo = new THREE.TorusGeometry(0.44, 0.045, 8, 26, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({ color: COLORS.skirt, metalness: 0.3, roughness: 0.6 });
    [-0.88, 0.88].forEach((x) =>
      [1.4, -1.45].forEach((z) => {
        const w = new THREE.Group();
        const t = new THREE.Mesh(tyreGeo, [tyreMat, rimFaceMat, rimFaceMat]);
        t.castShadow = true;
        w.add(t);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.37, z);
        car.add(w);
        const a = new THREE.Mesh(archGeo, archMat);
        a.rotation.y = Math.PI / 2;
        a.position.set(x * 0.97, 0.4, z);
        car.add(a);
      })
    );

    // ---------- نقاط انتخاب قطعه ----------
    const markerTex = (fill: string, stroke: string, glyph: string, glyphColor: string) => {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const x = c.getContext('2d')!;
      x.beginPath();
      x.arc(64, 64, 52, 0, Math.PI * 2);
      x.fillStyle = fill;
      x.fill();
      x.lineWidth = 9;
      x.strokeStyle = stroke;
      x.stroke();
      x.fillStyle = glyphColor;
      x.font = '900 74px Vazirmatn, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(glyph, 64, 70);
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 4;
      return t;
    };
    const MARK: Record<string, THREE.SpriteMaterial> = {
      none: new THREE.SpriteMaterial({ map: markerTex('#ffffff', '#94a3b8', '+', '#334155') }),
      minor: new THREE.SpriteMaterial({ map: markerTex('#facc15', '#a16207', '!', '#422006') }),
      moderate: new THREE.SpriteMaterial({ map: markerTex('#f59e0b', '#92400e', '!', '#ffffff') }),
      major: new THREE.SpriteMaterial({ map: markerTex('#e11d48', '#831843', '!', '#ffffff') }),
      selected: new THREE.SpriteMaterial({ map: markerTex('#2563eb', '#1e3a8a', '\u25c6', '#ffffff') })
    };
    const markers: Record<string, THREE.Sprite> = {};
    PANELS.forEach((p) => {
      const [x, y, z] = panelPositions[p.key];
      const sp = new THREE.Sprite(MARK.none);
      sp.position.set(x * 1.12, y + 0.14, z * 1.03);
      sp.scale.setScalar(0.22);
      sp.userData.partKey = p.key;
      car.add(sp);
      markers[p.key] = sp;
    });

    // ---------- کنترل دوربین ----------
    const ctrl = { az: VIEWS.iso.az, pol: VIEWS.iso.pol, dist: START_DIST, target: new THREE.Vector3(0, 0.85, 0) };
    const applyCamera = () => {
      const { az, pol, dist, target } = ctrl;
      camera.position.set(
        target.x + dist * Math.sin(pol) * Math.sin(az),
        target.y + dist * Math.cos(pol),
        target.z + dist * Math.sin(pol) * Math.cos(az)
      );
      camera.lookAt(target);
    };

    let dragging = false;
    let last = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      stateRef.current.pointer = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
        cx: e.clientX - rect.left,
        cy: e.clientY - rect.top
      };
      if (!dragging) return;
      ctrl.az -= (e.clientX - last.x) * 0.008;
      ctrl.pol = Math.min(Math.PI / 2.02, Math.max(0.12, ctrl.pol - (e.clientY - last.y) * 0.006));
      last = { x: e.clientX, y: e.clientY };
      applyCamera();
    };
    const onUp = () => {
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      ctrl.dist = Math.min(16, Math.max(5.2, ctrl.dist + e.deltaY * 0.006));
      applyCamera();
    };

    const raycaster = new THREE.Raycaster();
    const pickables = () => [...Object.values(markers), ...Object.values(panelMeshes)];
    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        ),
        camera
      );
      const hits = raycaster.intersectObjects(pickables(), false);
      if (hits.length) {
        const partKey = hits[0].object.userData.partKey as string;
        if (partKey) stateRef.current.onSelect?.(partKey);
      }
    };

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('click', onClick);

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    applyCamera();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    let t = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.016;
      if (stateRef.current.autoRotate && !dragging) {
        ctrl.az += 0.0032;
        applyCamera();
      }
      const pulse = 1 + Math.sin(t * 3) * 0.09;
      Object.keys(markers).forEach((k) => {
        const base = stateRef.current.markerScale?.[k];
        if (base) markers[k].scale.setScalar(base * pulse);
      });
      const ptr = stateRef.current.pointer;
      if (ptr && !dragging) {
        raycaster.setFromCamera(new THREE.Vector2(ptr.x, ptr.y), camera);
        const hits = raycaster.intersectObjects(pickables(), false);
        const partKey = hits.length ? (hits[0].object.userData.partKey as string) : null;
        if (partKey !== stateRef.current.hoverKey) {
          stateRef.current.hoverKey = partKey;
          stateRef.current.setHover?.(
            partKey
              ? { text: stateRef.current.labels?.[partKey] || partKey, x: ptr.cx, y: ptr.cy }
              : null
          );
          el.style.cursor = partKey ? 'pointer' : 'grab';
        }
      }
      renderer.render(scene, camera);
    };
    tick();

    stateRef.current = { ...stateRef.current, panelMeshes, markers, MARK, ctrl, applyCamera };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('click', onClick);
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  useEffect(() => {
    stateRef.current.onSelect = onSelectPart;
    stateRef.current.labels = partLabels;
    stateRef.current.setHover = setHoverLabel;
    stateRef.current.autoRotate = autoRotate;
  }, [onSelectPart, partLabels, autoRotate]);

  // نقطه‌ها وضعیت آسیب را نشان می‌دهند؛ رنگ بدنه ثابت می‌ماند
  useEffect(() => {
    const { panelMeshes, markers, MARK } = stateRef.current;
    if (!panelMeshes || !markers || !MARK) return;
    if (!stateRef.current.markerScale) stateRef.current.markerScale = {};
    Object.keys(panelMeshes).forEach((k) => {
      const mesh = panelMeshes[k] as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const sev = ((damageData[k]?.severity as Severity) || 'none') as Severity;
      const isActive = activePartKey === k;

      mat.emissive.setHex(COLORS.select);
      mat.emissiveIntensity = isActive ? 0.16 : 0;

      const sp = markers[k] as THREE.Sprite;
      sp.material = isActive ? MARK.selected : sev !== 'none' ? MARK[sev] : MARK.none;
      const scale = isActive ? 0.32 : sev !== 'none' ? 0.28 : 0.22;
      sp.scale.setScalar(scale);
      stateRef.current.markerScale[k] = isActive || sev !== 'none' ? scale : 0;
    });
  }, [damageData, activePartKey]);

  const goView = (name: keyof typeof VIEWS) => {
    const { ctrl, applyCamera } = stateRef.current;
    if (!ctrl) return;
    setAutoRotate(false);
    ctrl.az = VIEWS[name].az;
    ctrl.pol = VIEWS[name].pol;
    applyCamera();
  };

  const nudge = (dir: -1 | 1) => {
    const { ctrl, applyCamera } = stateRef.current;
    if (!ctrl) return;
    setAutoRotate(false);
    ctrl.az += dir * (Math.PI / 8);
    applyCamera();
  };

  const zoomBy = (d: number) => {
    const { ctrl, applyCamera } = stateRef.current;
    if (!ctrl) return;
    ctrl.dist = Math.min(16, Math.max(5.2, ctrl.dist + d));
    applyCamera();
  };

  const reset = () => {
    const { ctrl, applyCamera } = stateRef.current;
    if (!ctrl) return;
    ctrl.az = VIEWS.iso.az;
    ctrl.pol = VIEWS.iso.pol;
    ctrl.dist = START_DIST;
    applyCamera();
    setAutoRotate(true);
  };

  const viewBtn =
    'px-3 py-1.5 rounded-xl text-[11px] font-black border transition-colors cursor-pointer bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-800';
  const iconBtn =
    'p-1.5 rounded-lg text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer';

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button type="button" className={viewBtn} onClick={() => goView('right')}>بغل راست</button>
          <button type="button" className={viewBtn} onClick={() => goView('left')}>بغل چپ</button>
          <button type="button" className={viewBtn} onClick={() => goView('front')}>جلو</button>
          <button type="button" className={viewBtn} onClick={() => goView('rear')}>عقب</button>
          <button type="button" className={viewBtn} onClick={() => goView('top')}>بالا (پلان)</button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" className={iconBtn} title="چرخش چپ" onClick={() => nudge(-1)}>
            <RotateCw className="w-3.5 h-3.5 transform -scale-x-100" />
          </button>
          <button type="button" className={iconBtn} title="چرخش راست" onClick={() => nudge(1)}>
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button type="button" className={iconBtn} title="بزرگ‌نمایی" onClick={() => zoomBy(-1.2)}>
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button type="button" className={iconBtn} title="کوچک‌نمایی" onClick={() => zoomBy(1.2)}>
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className={iconBtn}
            title={autoRotate ? 'توقف چرخش خودکار' : 'چرخش خودکار آرام'}
            onClick={() => setAutoRotate((v) => !v)}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button type="button" className={iconBtn} title="ریست نما" onClick={reset}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[280px] sm:h-[420px] rounded-3xl overflow-hidden border-2 border-slate-800 bg-[radial-gradient(120%_95%_at_50%_12%,#35405c_0%,#1b2436_45%,#0b0f1a_100%)]">
        <div ref={mountRef} className="absolute inset-0" />
        {hoverLabel && (
          <div
            className="absolute pointer-events-none px-2.5 py-1 rounded-lg bg-white text-slate-900 text-[11px] font-bold shadow-lg"
            style={{ left: hoverLabel.x + 12, top: hoverLabel.y + 12 }}
          >
            {hoverLabel.text}
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-bold text-slate-400 pointer-events-none">
          <span>درگ = چرخش · اسکرول = بزرگ‌نمایی · کلیک روی نقطه یا قطعه = انتخاب و ثبت اطلاعات</span>
        </div>
      </div>
    </div>
  );
};

export default Car3DModel;
