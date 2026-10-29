/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ChevronDown,
  Volume2,
  VolumeX,
  Gauge,
  Play,
  Pause,
  FastForward,
  Sparkles,
} from 'lucide-react';
import { TabId } from './Navbar.js';
import { spatialAudio } from '../utils/spatialAudio.js';

interface ActiveOpeningSceneProps {
  onEnterDashboard: (targetTab?: TabId) => void;
  onOpenReportModal?: () => void;
  reducedMotion?: boolean;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
}

export function ActiveOpeningScene({
  onEnterDashboard,
  onOpenReportModal,
  reducedMotion = false,
  audioEnabled = true,
  onToggleAudio,
}: ActiveOpeningSceneProps) {
  // Active card index in the foreground (0 to 5)
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [orbitAngle, setOrbitAngle] = useState(0);
  const targetOrbitAngleRef = useRef(0);
  const currentOrbitAngleRef = useRef(0);

  // Speed multiplier UI control: 0 (Pause), 0.5 (Slow), 1.0 (Normal), 2.0 (Fast)
  const [orbitSpeedMultiplier, setOrbitSpeedMultiplier] = useState(1.0);

  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    prevX: 0,
    prevY: 0,
    speed: 0,
    worldPos: new THREE.Vector3(),
  });
  const wheelLockRef = useRef(false);
  const prevCardIdxRef = useRef(0);
  const dragStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const pulseTriggerRef = useRef<() => void>(() => {});

  // 6 Large Full-Featured Feature Cards that orbit the planet (15-20% larger than before)
  const showcaseCards = [
    {
      id: 'heatmaps',
      tab: 'dashboard' as TabId,
      tag: '01 // DETECTION',
      badge: 'REAL-TIME DENSITY',
      client: 'TEMPORAL MATRIX',
      title: 'ANOMALY HEATMAPS',
      desc: '24-hour multi-dimensional risk density mapping across all merchant transaction vectors.',
      stats: '24h Matrix · 6 Categories · Real-time Density',
      accentColor: '#f43f5e',
      badgeStyle: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
      borderGlow: 'border-rose-500/80 shadow-rose-950/90 shadow-2xl ring-1 ring-rose-500/30',
      borderIdle: 'border-rose-900/40 hover:border-rose-500/60',
    },
    {
      id: 'predictive',
      tab: 'dashboard' as TabId,
      tag: '02 // PROACTIVE',
      badge: 'PROACTIVE FORECAST',
      client: 'ARIMA + ML FORECAST',
      title: 'PREDICTIVE TRENDS',
      desc: 'Proactive 24h & 7d attack surge forecasting with 95% confidence intervals and automated calibration.',
      stats: 'Next 6h / 24h / 7d · 95% Confidence · Auto-Thresholds',
      accentColor: '#06b6d4',
      badgeStyle: 'bg-cyan-950/80 text-cyan-300 border-cyan-600/50',
      borderGlow: 'border-cyan-500/80 shadow-cyan-950/90 shadow-2xl ring-1 ring-cyan-500/30',
      borderIdle: 'border-cyan-900/40 hover:border-cyan-500/60',
    },
    {
      id: 'ensemble',
      tab: 'monitoring' as TabId,
      tag: '03 // ENSEMBLE',
      badge: 'ROC-AUC 0.994',
      client: 'PARALLEL DUAL INFERENCE',
      title: 'LIGHTGBM vs XGBOOST',
      desc: 'Dual-engine real-time scoring with 1.4ms parallel inference and agentic cost-aware policy evaluation.',
      stats: 'LightGBM 1.6ms · XGBoost 4.2ms · ROC-AUC 0.994',
      accentColor: '#10b981',
      badgeStyle: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50',
      borderGlow: 'border-emerald-500/80 shadow-emerald-950/90 shadow-2xl ring-1 ring-emerald-500/30',
      borderIdle: 'border-emerald-900/40 hover:border-emerald-500/60',
    },
    {
      id: 'policy',
      tab: 'policy' as TabId,
      tag: '04 // ARBITRAGE',
      badge: 'LOSS MINIMIZER',
      client: 'COST-AWARE ENGINE',
      title: 'POLICY ARBITRAGE',
      desc: 'Expected loss minimization: assigns exact financial cost to false positives, false negatives, and 2FA friction.',
      stats: 'Min(E[Allow], E[StepUp], E[Block]) · $1.48M Saved',
      accentColor: '#f59e0b',
      badgeStyle: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
      borderGlow: 'border-amber-500/80 shadow-amber-950/90 shadow-2xl ring-1 ring-amber-500/30',
      borderIdle: 'border-amber-900/40 hover:border-amber-500/60',
    },
    {
      id: 'reports',
      tab: 'reports' as TabId,
      tag: '05 // GOVERNANCE',
      badge: 'PCI-DSS CERTIFIED',
      client: 'EXECUTIVE AUDIT',
      title: 'AUDIT REPORT EXPORT',
      desc: 'One-click executive compliance report download with loss avoidance scorecard and PCI-DSS certification.',
      stats: '1-Click PDF / JSON / CSV · PCI-DSS Compliant',
      accentColor: '#a855f7',
      badgeStyle: 'bg-purple-950/80 text-purple-300 border-purple-600/50',
      borderGlow: 'border-purple-500/80 shadow-purple-950/90 shadow-2xl ring-1 ring-purple-500/30',
      borderIdle: 'border-purple-900/40 hover:border-purple-500/60',
    },
    {
      id: 'friction',
      tab: 'dashboard' as TabId,
      tag: '06 // SLA BUDGET',
      badge: 'FRICTION SLA 1.24%',
      client: 'CHECKOUT PRESERVATION',
      title: 'ZERO-FRICTION BUDGET',
      desc: 'Guaranteed customer friction cap ensuring no more than 2% of legitimate transactions receive authentication challenges.',
      stats: 'Current: 1.24% · SLA Cap: <= 2.0% · Zero Dropoff',
      accentColor: '#38bdf8',
      badgeStyle: 'bg-sky-950/80 text-sky-300 border-sky-600/50',
      borderGlow: 'border-sky-500/80 shadow-sky-950/90 shadow-2xl ring-1 ring-sky-500/30',
      borderIdle: 'border-sky-900/40 hover:border-sky-500/60',
    },
  ];

  // Set target angle for index
  const rotateToCardIndex = (idx: number) => {
    const step = (Math.PI * 2) / showcaseCards.length;
    const current = currentOrbitAngleRef.current;
    const currentIdx = Math.round(-current / step);
    const diff = idx - ((currentIdx % showcaseCards.length + showcaseCards.length) % showcaseCards.length);
    let target = current - diff * step;
    targetOrbitAngleRef.current = target;
    setActiveCardIdx(idx);
    spatialAudio.playCardSlide(diff > 0 ? 'right' : 'left');
    spatialAudio.playCelestialChime(idx);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = (Math.PI * 2) / showcaseCards.length;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        targetOrbitAngleRef.current -= step;
        const nextIdx = (activeCardIdx + 1) % showcaseCards.length;
        setActiveCardIdx(nextIdx);
        spatialAudio.playCardSlide('right');
        spatialAudio.playCelestialChime(nextIdx);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        targetOrbitAngleRef.current += step;
        const prevIdx = (activeCardIdx - 1 + showcaseCards.length) % showcaseCards.length;
        setActiveCardIdx(prevIdx);
        spatialAudio.playCardSlide('left');
        spatialAudio.playCelestialChime(prevIdx);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const current = showcaseCards[activeCardIdx];
        handleCardLaunch(current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCardIdx, showcaseCards]);

  // Mouse wheel navigation
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // If user is scrolling vertically with larger delta, let page naturally scroll down to Command Center
      if (Math.abs(e.deltaY) > 60 && Math.abs(e.deltaX) < 15) {
        return; // Allow natural page scroll downward to Command Center
      }

      if (wheelLockRef.current) return;
      if (Math.abs(e.deltaY) > 18 || Math.abs(e.deltaX) > 18) {
        wheelLockRef.current = true;
        const step = (Math.PI * 2) / showcaseCards.length;
        if (e.deltaY > 0 || e.deltaX > 0) {
          targetOrbitAngleRef.current -= step;
          setActiveCardIdx((prev) => (prev + 1) % showcaseCards.length);
          spatialAudio.playCardSlide('right');
        } else {
          targetOrbitAngleRef.current += step;
          setActiveCardIdx((prev) => (prev - 1 + showcaseCards.length) % showcaseCards.length);
          spatialAudio.playCardSlide('left');
        }
        setTimeout(() => {
          wheelLockRef.current = false;
        }, 340);
      }
    },
    [showcaseCards.length]
  );

  // Mouse drag / swipe support
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartXRef.current = e.clientX;
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || dragStartXRef.current === null) return;
    const deltaX = e.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 4) {
      targetOrbitAngleRef.current += deltaX * 0.0035;
      dragStartXRef.current = e.clientX;
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    dragStartXRef.current = null;
    const step = (Math.PI * 2) / showcaseCards.length;
    const snapIdx = Math.round(-targetOrbitAngleRef.current / step);
    targetOrbitAngleRef.current = -snapIdx * step;
    const normalizedIdx = ((snapIdx % showcaseCards.length) + showcaseCards.length) % showcaseCards.length;
    setActiveCardIdx(normalizedIdx);
  };

  // Launch card module
  const handleCardLaunch = (card: typeof showcaseCards[0]) => {
    pulseTriggerRef.current();
    spatialAudio.playPlanetPulse();
    spatialAudio.playTransitionWarp();
    setTimeout(() => {
      if (card.id === 'reports' && onOpenReportModal) {
        onOpenReportModal();
      } else {
        onEnterDashboard(card.tab);
      }
    }, 280);
  };

  // Three.js Procedural 3D Planetary Universe Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020612, 0.0042);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 2000);
    camera.position.set(0, 0, 58);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // UnrealBloomPass: Calibrated for cinematic sci-fi glow on red/cyan accents
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.05,
      0.44,
      0.45
    );
    composer.addPass(bloomPass);

    // Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    scene.add(ambientLight);

    const keySunLight = new THREE.DirectionalLight(0xfff6ec, 3.4);
    keySunLight.position.set(40, 26, 48);
    scene.add(keySunLight);

    const crimsonRimLight = new THREE.PointLight(0xe11d48, 4.8, 130);
    crimsonRimLight.position.set(-36, -22, -12);
    scene.add(crimsonRimLight);

    const cyanFillLight = new THREE.PointLight(0x06b6d4, 3.6, 120);
    cyanFillLight.position.set(26, -30, 22);
    scene.add(cyanFillLight);

    // Procedural soft circular bokeh particle texture
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.28, 'rgba(255, 255, 255, 0.75)');
        gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.16)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };
    const circleTexture = createCircleTexture();

    // 1. Distant Multi-Spectral Nebula Clouds with Atmospheric Scattering
    const nebulaGroup = new THREE.Group();
    scene.add(nebulaGroup);

    const createNebulaTexture = (col1: string, col2: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        grad.addColorStop(0, col1);
        grad.addColorStop(0.5, col2);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    };

    const nebulaTex1 = createNebulaTexture('rgba(225, 29, 72, 0.22)', 'rgba(120, 20, 60, 0.08)');
    const nebulaTex2 = createNebulaTexture('rgba(6, 182, 212, 0.2)', 'rgba(14, 116, 144, 0.07)');

    for (let i = 0; i < 6; i++) {
      const planeGeo = new THREE.PlaneGeometry(95, 95);
      const planeMat = new THREE.MeshBasicMaterial({
        map: i % 2 === 0 ? nebulaTex1 : nebulaTex2,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const planeMesh = new THREE.Mesh(planeGeo, planeMat);
      planeMesh.position.set((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 90, -85 - Math.random() * 40);
      planeMesh.rotation.z = Math.random() * Math.PI;
      nebulaGroup.add(planeMesh);
    }

    // 2. Cosmic Spiral Galaxy Starfield (2,500 Stars)
    const starCount = 2500;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const cWhite = new THREE.Color(0xffffff);
    const cAmber = new THREE.Color(0xfef08a);
    const cCyan = new THREE.Color(0x38bdf8);
    const cRose = new THREE.Color(0xf43f5e);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 2.1) * 240 + 30;
      const spinAngle = r * 0.1;
      const branchAngle = ((i % 4) * (2 * Math.PI)) / 4;

      const spreadX = (Math.random() - 0.5) * 18;
      const spreadY = (Math.random() - 0.5) * 18;
      const spreadZ = (Math.random() - 0.5) * 60 - 50;

      starPositions[i3] = Math.cos(branchAngle + spinAngle) * r + spreadX;
      starPositions[i3 + 1] = Math.sin(branchAngle + spinAngle) * r * 0.5 + spreadY;
      starPositions[i3 + 2] = spreadZ;

      const rand = Math.random();
      const col = rand < 0.4 ? cWhite : rand < 0.65 ? cCyan : rand < 0.85 ? cRose : cAmber;
      starColors[i3] = col.r;
      starColors[i3 + 1] = col.g;
      starColors[i3 + 2] = col.b;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.15,
      map: circleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starMesh = new THREE.Points(starGeo, starMat);
    starMesh.rotation.x = Math.PI * 0.14;
    scene.add(starMesh);

    // 3. Central Massive 3D Realistic Planet (Dark Obsidian Surface + Magma Fissures + Cybersecurity Lines)
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    // Procedural Planet Texture
    const canvasP = document.createElement('canvas');
    canvasP.width = 1024;
    canvasP.height = 1024;
    const ctxP = canvasP.getContext('2d');
    if (ctxP) {
      // Obsidian dark crust base
      ctxP.fillStyle = '#040711';
      ctxP.fillRect(0, 0, 1024, 1024);

      // Continental digital plates
      for (let i = 0; i < 35; i++) {
        const cx = Math.random() * 1024;
        const cy = Math.random() * 1024;
        const rad = Math.random() * 130 + 45;
        const grad = ctxP.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, '#0c1326');
        grad.addColorStop(0.7, '#060a16');
        grad.addColorStop(1, 'transparent');
        ctxP.fillStyle = grad;
        ctxP.beginPath();
        ctxP.arc(cx, cy, rad, 0, Math.PI * 2);
        ctxP.fill();
      }

      // Crimson magma fissures & illuminated cybersecurity lines
      for (let i = 0; i < 60; i++) {
        ctxP.beginPath();
        const sx = Math.random() * 1024;
        const sy = Math.random() * 1024;
        ctxP.moveTo(sx, sy);
        ctxP.bezierCurveTo(
          sx + (Math.random() - 0.5) * 220,
          sy + (Math.random() - 0.5) * 220,
          sx + (Math.random() - 0.5) * 220,
          sy + (Math.random() - 0.5) * 220,
          sx + (Math.random() - 0.5) * 320,
          sy + (Math.random() - 0.5) * 320
        );
        const isCrimson = i % 2 === 0;
        ctxP.strokeStyle = isCrimson ? 'rgba(225, 29, 72, 0.7)' : 'rgba(6, 182, 212, 0.6)';
        ctxP.lineWidth = Math.random() * 3 + 1.2;
        ctxP.stroke();

        if (i % 3 === 0) {
          ctxP.fillStyle = isCrimson ? '#fda4af' : '#67e8f9';
          ctxP.beginPath();
          ctxP.arc(sx, sy, 3.8, 0, Math.PI * 2);
          ctxP.fill();
        }
      }
    }
    const planetTexture = new THREE.CanvasTexture(canvasP);
    planetTexture.wrapS = THREE.RepeatWrapping;
    planetTexture.wrapT = THREE.ClampToEdgeWrapping;
    planetTexture.needsUpdate = true;

    // Massive Planet Sphere (Radius = 12.5)
    const planetRadius = 12.5;
    const planetGeo = new THREE.SphereGeometry(planetRadius, 64, 64);
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTexture,
      roughness: 0.22,
      metalness: 0.88,
      emissive: 0x14060b,
      emissiveIntensity: 0.75,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planetMesh);

    // Atmospheric Fresnel Halo Outer Shell (Ruby Red & Cyan Rim)
    const atmoGeo = new THREE.SphereGeometry(planetRadius * 1.055, 64, 64);
    const atmoMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.95,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    planetGroup.add(atmoMesh);

    // Procedural Floating Cloud/Data-Signal Layer
    const cloudGeo = new THREE.SphereGeometry(planetRadius * 1.025, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0x0f172a,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.22,
      roughness: 0.6,
      metalness: 0.3,
      wireframe: true,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    planetGroup.add(cloudMesh);

    // Surface Financial Data Signals (50 packets moving across planet surface)
    const signalCount = 50;
    const signalGeo = new THREE.BufferGeometry();
    const signalPos = new Float32Array(signalCount * 3);
    const signalColors = new Float32Array(signalCount * 3);
    const signalAngles: Array<{ lat: number; lng: number; speed: number }> = [];

    for (let i = 0; i < signalCount; i++) {
      signalAngles.push({
        lat: (Math.random() - 0.5) * Math.PI * 0.8,
        lng: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.016,
      });
      const c = i % 2 === 0 ? cRose : cCyan;
      signalColors[i * 3] = c.r;
      signalColors[i * 3 + 1] = c.g;
      signalColors[i * 3 + 2] = c.b;
    }
    signalGeo.setAttribute('position', new THREE.BufferAttribute(signalPos, 3));
    signalGeo.setAttribute('color', new THREE.BufferAttribute(signalColors, 3));

    const signalMat = new THREE.PointsMaterial({
      size: 1.8,
      map: circleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const signalMesh = new THREE.Points(signalGeo, signalMat);
    planetGroup.add(signalMesh);

    // 4. Elegant Elliptical Orbital Trails & Rings
    const ring1Geo = new THREE.TorusGeometry(14.5, 0.08, 16, 120);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.9,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI * 0.38;
    ring1.rotation.y = Math.PI * 0.12;
    planetGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(19.0, 0.06, 16, 120);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0xe11d48,
      emissiveIntensity: 1.2,
      roughness: 0.3,
      metalness: 0.85,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI * 0.28;
    ring2.rotation.z = Math.PI * 0.22;
    planetGroup.add(ring2);

    // 5. Cursor-Reactive Particle System with Damping & Friction Factor
    const dustCount = 650;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustOriginals = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    const dustVelocities: Array<{ x: number; y: number; z: number }> = [];

    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 80;
      const y = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 35;

      dustPositions[i3] = x;
      dustPositions[i3 + 1] = y;
      dustPositions[i3 + 2] = z;

      dustOriginals[i3] = x;
      dustOriginals[i3 + 1] = y;
      dustOriginals[i3 + 2] = z;

      const r = Math.random();
      const col = r < 0.4 ? cAmber : r < 0.7 ? cCyan : r < 0.88 ? cRose : cWhite;
      dustColors[i3] = col.r;
      dustColors[i3 + 1] = col.g;
      dustColors[i3 + 2] = col.b;

      dustVelocities.push({ x: 0, y: 0.008 + Math.random() * 0.015, z: 0 });
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 1.25,
      map: circleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustMesh = new THREE.Points(dustGeo, dustMat);
    scene.add(dustMesh);

    // 6. High-Intensity Cursor "Data Nodes" Trailing System
    interface TrailNode {
      mesh: THREE.Mesh;
      light: THREE.PointLight;
      age: number;
      maxAge: number;
      vel: THREE.Vector3;
    }
    const trailNodes: TrailNode[] = [];
    const trailNodeGroup = new THREE.Group();
    scene.add(trailNodeGroup);

    const nodeGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const nodeMatCrimson = new THREE.MeshBasicMaterial({ color: 0xff4b72, transparent: true, opacity: 0.95 });
    const nodeMatCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 });

    const spawnDataNode = (pos: THREE.Vector3) => {
      if (trailNodes.length > 24) return;
      const isCrim = Math.random() > 0.5;
      const mesh = new THREE.Mesh(nodeGeo, isCrim ? nodeMatCrimson : nodeMatCyan);
      mesh.position.copy(pos);

      const light = new THREE.PointLight(isCrim ? 0xf43f5e : 0x06b6d4, 2.0, 15);
      light.position.copy(pos);

      trailNodeGroup.add(mesh);
      trailNodeGroup.add(light);

      trailNodes.push({
        mesh,
        light,
        age: 0,
        maxAge: 45 + Math.random() * 25,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08
        ),
      });
    };

    // Pulse trigger
    pulseTriggerRef.current = () => {
      crimsonRimLight.intensity = 9.0;
      cyanFillLight.intensity = 8.0;
      atmoMesh.scale.setScalar(1.22);
      setTimeout(() => {
        crimsonRimLight.intensity = 4.8;
        cyanFillLight.intensity = 3.6;
      }, 700);
    };

    // Mouse movement listener
    const raycaster = new THREE.Raycaster();
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = -(e.clientY / window.innerHeight - 0.5) * 2;

      const dx = normX - mouseRef.current.prevX;
      const dy = normY - mouseRef.current.prevY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      mouseRef.current.speed = speed;
      mouseRef.current.prevX = normX;
      mouseRef.current.prevY = normY;

      mouseRef.current.targetX = normX;
      mouseRef.current.targetY = normY;

      raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);
      raycaster.ray.intersectPlane(planeZ, mouseRef.current.worldPos);

      if (speed > 0.015) {
        spawnDataNode(mouseRef.current.worldPos);
      }

      spatialAudio.setSceneIntensity(Math.min(1, speed * 12));
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Continuous Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const motionScale = reducedMotion ? 0.15 : 1.0;

      // Continuous automatic orbital revolution driven by speed multiplier
      if (orbitSpeedMultiplier > 0 && !isDraggingRef.current) {
        targetOrbitAngleRef.current -= delta * 0.18 * orbitSpeedMultiplier;
      }

      // Smooth camera damping & easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.038;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.038;

      // Smooth orbit angle interpolation
      currentOrbitAngleRef.current += (targetOrbitAngleRef.current - currentOrbitAngleRef.current) * 0.085;
      setOrbitAngle(currentOrbitAngleRef.current);

      const targetCamX = mouseRef.current.x * 6 * motionScale;
      const targetCamY = mouseRef.current.y * 3.5 * motionScale;

      camera.position.x += (targetCamX - camera.position.x) * 0.045;
      camera.position.y += (targetCamY - camera.position.y) * 0.045;
      camera.position.z += (58 - camera.position.z) * 0.05;
      camera.lookAt(0, 0, 0);

      camera.rotation.z = -mouseRef.current.x * 0.018 * motionScale;

      if (!reducedMotion) {
        // Slow continuous planet rotation
        planetMesh.rotation.y = elapsedTime * 0.035;
        atmoMesh.rotation.y = elapsedTime * 0.04;
        cloudMesh.rotation.y = elapsedTime * 0.048;

        ring1.rotation.z += 0.005;
        ring2.rotation.z -= 0.004;

        nebulaGroup.rotation.z = elapsedTime * 0.008;

        // Surface data signals
        const posArr = signalGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < signalCount; i++) {
          const sig = signalAngles[i];
          sig.lng += sig.speed;
          const r = planetRadius * 1.012;
          posArr[i * 3] = r * Math.cos(sig.lat) * Math.sin(sig.lng);
          posArr[i * 3 + 1] = r * Math.sin(sig.lat);
          posArr[i * 3 + 2] = r * Math.cos(sig.lat) * Math.cos(sig.lng);
        }
        signalGeo.attributes.position.needsUpdate = true;

        // Damped particle physics with friction factor
        const dPosArr = dustGeo.attributes.position.array as Float32Array;
        const mouseWorld = mouseRef.current.worldPos;

        for (let i = 0; i < dustCount; i++) {
          const i3 = i * 3;
          let px = dPosArr[i3];
          let py = dPosArr[i3 + 1];
          let pz = dPosArr[i3 + 2];

          const dx = px - mouseWorld.x;
          const dy = py - mouseWorld.y;
          const distSq = dx * dx + dy * dy;

          const vel = dustVelocities[i];

          if (distSq < 130 && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / 11.4) * 0.42;
            vel.x += (dx / dist) * force * 0.35;
            vel.y += (dy / dist) * force * 0.35;
          }

          vel.x *= 0.93;
          vel.y = vel.y * 0.93 + 0.001;
          vel.z *= 0.93;

          px += vel.x;
          py += vel.y;
          pz += vel.z;

          if (py > 30) {
            py = -30;
            px = dustOriginals[i3];
          }

          dPosArr[i3] = px;
          dPosArr[i3 + 1] = py;
          dPosArr[i3 + 2] = pz;
        }
        dustGeo.attributes.position.needsUpdate = true;

        // Update trailing data nodes
        for (let i = trailNodes.length - 1; i >= 0; i--) {
          const node = trailNodes[i];
          node.age++;
          node.mesh.position.add(node.vel);
          node.light.position.add(node.vel);

          const progress = node.age / node.maxAge;
          const alpha = 1 - progress;
          (node.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
          node.light.intensity = alpha * 2.2;
          node.mesh.scale.setScalar(Math.max(0.1, 1 - progress * 0.4));

          if (node.age >= node.maxAge) {
            trailNodeGroup.remove(node.mesh);
            trailNodeGroup.remove(node.light);
            trailNodes.splice(i, 1);
          }
        }

        crimsonRimLight.intensity += (4.8 - crimsonRimLight.intensity) * 0.05;
        cyanFillLight.intensity += (3.6 - cyanFillLight.intensity) * 0.05;
        atmoMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08);
      }

      composer.render();
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      circleTexture.dispose();
      planetTexture.dispose();
      nebulaTex1.dispose();
      nebulaTex2.dispose();
      composer.dispose();
      scene.clear();
      renderer.dispose();
    };
  }, [reducedMotion, orbitSpeedMultiplier]);

  // Compute 3D Elliptical Orbit Geometry for the 6 Large Feature Cards
  const totalCards = showcaseCards.length;
  const stepAngle = (Math.PI * 2) / totalCards;

  return (
    <div
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden select-none bg-[#02050f]"
    >
      {/* 3D WebGL Canvas Layer (Massive Central Planet, Nebula, Starfield & Trailing Data Nodes) */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-30 flex items-center justify-between px-6 sm:px-12 py-5">
        <div
          onClick={() => rotateToCardIndex(0)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 via-rose-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/60 border border-rose-500/50 group-hover:border-rose-400 transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono font-bold tracking-tight text-white text-base">
              PAY<span className="text-rose-500">SHIELD</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 block tracking-widest uppercase">
              AUTONOMOUS AI FRAUD DEFENSE
            </span>
          </div>
        </div>

        {/* Top-Right Control Buttons */}
        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Spatial Audio Toggle Pill */}
          {onToggleAudio && (
            <button
              onClick={onToggleAudio}
              className={`px-3.5 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 shadow-md backdrop-blur-md ${
                audioEnabled
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                  : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:text-white'
              }`}
              title={audioEnabled ? 'Mute Continuous Galaxy Soundscape' : 'Enable Continuous Galaxy Soundscape'}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[11px] font-bold">{audioEnabled ? 'SOUND: ON' : 'SOUND: OFF'}</span>
            </button>
          )}

          <button
            onClick={() => onEnterDashboard('architecture')}
            className="px-5 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg"
          >
            PIPELINE
          </button>

          <button
            onClick={() => onEnterDashboard('playground')}
            className="px-5 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg"
          >
            PLAYGROUND
          </button>

          {/* Theme Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 shadow-md">
            <span className="text-amber-400 font-bold uppercase tracking-wider">
              &lt;&lt; 3D PLANETARY ORBIT &gt;&gt;
            </span>
          </div>
        </div>
      </header>

      {/* Main 3D Orbital Arena: The 6 Large Feature Cards Orbiting Around the Central Planet */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-4">
        <div className="relative w-full max-w-7xl h-[520px] flex items-center justify-center">
          {showcaseCards.map((card, idx) => {
            // Calculate orbital angle around the planet in 3D
            const cardAngle = orbitAngle + idx * stepAngle;
            let normAngle = ((cardAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            if (normAngle > Math.PI) normAngle -= Math.PI * 2;

            // Parametric 3D Elliptical Orbit (Reduced by 20-25% to keep planet as majestic centerpiece)
            // Radius X: 360px, Radius Z: 215px (depth)
            const sinA = Math.sin(normAngle);
            const cosA = Math.cos(normAngle);

            const posX = sinA * 360;
            const posZ = cosA * 215;
            const posY = sinA * 20;

            const isFront = cosA > 0;
            const isClosest = Math.abs(normAngle) < 0.42;

            // Scale: Reduced by 20-25% so the cards frame the central planet with elegant depth
            // Foreground active card: scale ~ 0.98 - 1.0 (crisp, readable, balanced)
            // Flank cards: scale ~ 0.74 - 0.80 (proportionate, gently receding behind)
            // Back cards: scale ~ 0.55, low opacity, passing behind planet
            const scale = Math.max(0.55, 0.68 + cosA * 0.30);
            const opacity = isClosest ? 1.0 : isFront ? 0.72 + cosA * 0.24 : 0.22;
            const rotateY = -normAngle * 24;

            const zIndex = Math.round(30 + cosA * 20);

            return (
              <motion.div
                key={card.id}
                onClick={() => {
                  if (isClosest) {
                    handleCardLaunch(card);
                  } else {
                    rotateToCardIndex(idx);
                  }
                }}
                animate={{
                  x: posX,
                  y: posY,
                  scale: scale,
                  rotateY: rotateY,
                  opacity: opacity,
                }}
                transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                style={{
                  transformStyle: 'preserve-3d',
                  zIndex: zIndex,
                }}
                className={`absolute w-[300px] sm:w-[380px] md:w-[410px] rounded-2xl p-5 sm:p-6 bg-[#070b16]/94 backdrop-blur-xl border ${
                  isClosest ? card.borderGlow : card.borderIdle
                } cursor-pointer transition-colors duration-300 group shadow-2xl`}
              >
                {/* Header Row: 01 // DETECTION & REAL-TIME DENSITY Badge */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                  <span className="font-bold tracking-wider text-slate-200">{card.tag}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide border shadow-sm ${card.badgeStyle}`}>
                    {card.badge}
                  </span>
                </div>

                {/* Subtitle & Title */}
                <div className="space-y-1.5 mb-3.5 text-left">
                  <div className="text-[10px] font-mono tracking-[0.22em] text-slate-400 uppercase font-semibold">
                    {card.client}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-mono text-white group-hover:text-rose-400 transition-colors uppercase tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs font-mono text-slate-300 leading-relaxed pt-0.5 line-clamp-2 sm:line-clamp-none">
                    {card.desc}
                  </p>
                </div>

                {/* Telemetry Stats Pill */}
                <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono text-slate-300 mb-4 truncate">
                  {card.stats}
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-mono">
                  <span className="text-slate-400 group-hover:text-white transition-colors flex items-center gap-1.5 text-[11px]">
                    <span>{isClosest ? 'Click to Launch Module' : 'Click to Bring Forward'}</span>
                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white transition-all shadow-md ${
                    isClosest ? 'group-hover:bg-rose-600 group-hover:border-rose-500' : 'group-hover:bg-cyan-600'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Left / Right Orbital Step Arrows */}
          <button
            onClick={() => {
              const step = (Math.PI * 2) / showcaseCards.length;
              targetOrbitAngleRef.current += step;
              const prevIdx = (activeCardIdx - 1 + showcaseCards.length) % showcaseCards.length;
              setActiveCardIdx(prevIdx);
              spatialAudio.playCardSlide('left');
            }}
            className="absolute left-2 sm:left-4 z-50 w-10 h-10 rounded-full bg-slate-950/85 border border-slate-700/80 hover:border-white text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all shadow-2xl backdrop-blur-md"
            aria-label="Orbit Previous Module"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              const step = (Math.PI * 2) / showcaseCards.length;
              targetOrbitAngleRef.current -= step;
              const nextIdx = (activeCardIdx + 1) % showcaseCards.length;
              setActiveCardIdx(nextIdx);
              spatialAudio.playCardSlide('right');
            }}
            className="absolute right-2 sm:right-4 z-50 w-10 h-10 rounded-full bg-slate-950/85 border border-slate-700/80 hover:border-white text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all shadow-2xl backdrop-blur-md"
            aria-label="Orbit Next Module"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Orbit Dots Indicator */}
        <div className="flex items-center gap-2 mt-2 z-30">
          {showcaseCards.map((_, i) => (
            <button
              key={i}
              onClick={() => rotateToCardIndex(i)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                activeCardIdx === i
                  ? 'bg-rose-500 w-8 h-2 shadow-lg shadow-rose-500/60'
                  : 'bg-slate-700 hover:bg-slate-500 w-2 h-2'
              }`}
              aria-label={`Orbit to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* UI Control Overlay: Adjust / Toggle Orbit Speed */}
        <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-slate-950/85 border border-slate-800/90 backdrop-blur-md shadow-xl text-xs font-mono z-30">
          <div className="flex items-center gap-1.5 text-slate-400 mr-2">
            <Gauge className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">Orbit Velocity</span>
          </div>

          <div className="flex items-center gap-1">
            {[
              { label: 'Pause (0x)', value: 0 },
              { label: '0.5x Slow', value: 0.5 },
              { label: '1.0x Normal', value: 1.0 },
              { label: '2.0x Warp', value: 2.0 },
            ].map((preset) => {
              const isSelected = orbitSpeedMultiplier === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => {
                    setOrbitSpeedMultiplier(preset.value);
                    spatialAudio.playCelestialChime(Math.round(preset.value * 2));
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/60'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scroll Cue Indicator: Scroll to Enter Command Center */}
        <div
          onClick={() => onEnterDashboard('dashboard')}
          className="mt-6 flex flex-col items-center gap-1 cursor-pointer group z-30"
        >
          <span className="text-[10px] font-mono tracking-[0.25em] text-slate-400 group-hover:text-rose-300 transition-colors uppercase font-medium">
            Scroll down to enter Command Center
          </span>
          <ChevronDown className="w-4 h-4 text-rose-400 animate-bounce group-hover:translate-y-0.5 transition-transform" />
        </div>
      </main>

      {/* Footer Status Bar with Real Telemetry Coordinates */}
      <footer className="relative z-30 flex flex-col sm:flex-row items-center justify-between px-6 sm:px-12 py-4 border-t border-slate-900/80 text-[11px] font-mono text-slate-500 gap-2">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span>LAT: 37.7749° N</span>
          <span>·</span>
          <span>LNG: -122.4194° W</span>
          <span>·</span>
          <span className="text-emerald-400 font-semibold">STATUS: SECURE_ALPHA</span>
          <span>·</span>
          <span className="text-slate-400 hidden sm:inline">SPATIAL AUDIO: {audioEnabled ? 'ACTIVE' : 'MUTED'}</span>
        </div>

        <button
          onClick={() => onEnterDashboard('dashboard')}
          className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span>Skip to Command Center</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </footer>
    </div>
  );
}
