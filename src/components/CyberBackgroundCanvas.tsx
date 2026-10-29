/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

interface CyberBackgroundCanvasProps {
  reducedMotion?: boolean;
}

export function CyberBackgroundCanvas({ reducedMotion = false }: CyberBackgroundCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef({ y: 0, targetY: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Three.js Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.0065);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    camera.position.set(0, 0, 68);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35; // Bright, luminous cinematic rendering
    container.appendChild(renderer.domElement);

    // 2. High-Fidelity UnrealBloomPass Post-Processing Pipeline
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.65, // Luminous bloom strength
      0.52, // Soft bloom spread radius
      0.18  // Sensitive threshold for glowing neon streams and bokeh particles
    );
    composer.addPass(bloomPass);

    // 3. Dynamic Specular Lighting (Inspired by Active Theory chromatic lighting)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.2);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(0xf59e0b, 4.2, 140);
    goldLight.position.set(28, 22, 35);
    scene.add(goldLight);

    const crimsonLight = new THREE.PointLight(0xe11d48, 3.6, 140);
    crimsonLight.position.set(-32, -18, 30);
    scene.add(crimsonLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 3.2, 120);
    cyanLight.position.set(0, 35, -15);
    scene.add(cyanLight);

    const emeraldLight = new THREE.PointLight(0x10b981, 2.5, 110);
    emeraldLight.position.set(-25, 25, -10);
    scene.add(emeraldLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(15, 45, 55);
    scene.add(dirLight);

    // 4. Central Molten Iridescent Liquid Sphere (Metaball Fluid Mesh)
    const liquidGroup = new THREE.Group();
    scene.add(liquidGroup);

    const baseRadius = 16.5;
    const sphereGeo = new THREE.IcosahedronGeometry(baseRadius, 5);
    const posAttr = sphereGeo.attributes.position;
    const vertexCount = posAttr.count;

    const basePositions = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      basePositions[i * 3] = posAttr.getX(i);
      basePositions[i * 3 + 1] = posAttr.getY(i);
      basePositions[i * 3 + 2] = posAttr.getZ(i);
    }

    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x181512,
      emissive: 0x221105,
      roughness: 0.12,
      metalness: 0.94,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      iridescence: 0.9,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [140, 560],
      reflectivity: 0.98,
    });

    const liquidMesh = new THREE.Mesh(sphereGeo, liquidMaterial);
    liquidGroup.add(liquidMesh);

    // 5. Active Theory Teardrop Ribbon Curves (Suspended iridescent curves)
    const ribbonCurve1 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 26, -5),
      new THREE.Vector3(14, 8, 4),
      new THREE.Vector3(-14, -14, -4),
      new THREE.Vector3(0, -32, -5)
    );
    const ribbonCurve2 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 26, -5),
      new THREE.Vector3(-14, 8, -4),
      new THREE.Vector3(14, -14, 4),
      new THREE.Vector3(0, -32, -5)
    );

    const ribbonGeo1 = new THREE.TubeGeometry(ribbonCurve1, 80, 0.28, 16, false);
    const ribbonGeo2 = new THREE.TubeGeometry(ribbonCurve2, 80, 0.28, 16, false);
    const ribbonMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.95,
      clearcoat: 1.0,
      iridescence: 0.95,
    });

    const ribbonMesh1 = new THREE.Mesh(ribbonGeo1, ribbonMat);
    const ribbonMesh2 = new THREE.Mesh(ribbonGeo2, ribbonMat);
    liquidGroup.add(ribbonMesh1);
    liquidGroup.add(ribbonMesh2);

    // 6. Glowing Orbital Rings
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const ring1Geo = new THREE.TorusGeometry(25, 0.14, 16, 128);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.0,
      roughness: 0.2,
      metalness: 0.9,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI * 0.35;
    ring1.rotation.y = Math.PI * 0.15;
    ringGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(30, 0.1, 16, 128);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0xe11d48,
      emissiveIntensity: 1.8,
      roughness: 0.3,
      metalness: 0.85,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI * 0.25;
    ring2.rotation.z = Math.PI * 0.3;
    ringGroup.add(ring2);

    // 7. Constellation Gateway Nodes
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const nodePositions: [number, number, number][] = [
      [-42, 16, -8],
      [-32, -12, 10],
      [-18, 22, -12],
      [-12, -22, -6],
      [14, 24, -14],
      [22, -16, 8],
      [36, 18, -4],
      [42, -10, 12],
      [-48, -20, -22],
      [46, -24, -18],
      [-4, 28, 4],
      [2, -26, 6],
    ];

    const nodesData: Array<{ mesh: THREE.Mesh; ring: THREE.Mesh; speed: number }> = [];
    const colors = [0xf59e0b, 0xe11d48, 0x10b981, 0x06b6d4, 0x8b5cf6];

    nodePositions.forEach((posArr, idx) => {
      const pos = new THREE.Vector3(...posArr);
      const color = colors[idx % colors.length];

      const nGeo = new THREE.OctahedronGeometry(1.6);
      const nMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.2, // Glowing neon core
        roughness: 0.15,
        metalness: 0.85,
      });
      const nMesh = new THREE.Mesh(nGeo, nMat);
      nMesh.position.copy(pos);
      nodeGroup.add(nMesh);

      const rGeo = new THREE.TorusGeometry(2.4, 0.07, 8, 32);
      const rMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.position.copy(pos);
      nodeGroup.add(rMesh);

      nodesData.push({
        mesh: nMesh,
        ring: rMesh,
        speed: 0.008 + (idx % 4) * 0.004,
      });
    });

    // 8. Interconnecting Neon Data Segments
    const lineCoords: number[] = [];
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        const p1 = new THREE.Vector3(...nodePositions[i]);
        const p2 = new THREE.Vector3(...nodePositions[j]);
        if (p1.distanceTo(p2) < 36) {
          lineCoords.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
      }
    }

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineCoords, 3));
    const linesMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const networkLines = new THREE.LineSegments(linesGeo, linesMat);
    scene.add(networkLines);

    // 9. Flowing Transaction Data Packets (Streaking neon pulses)
    const transactionSplines = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-48, -20, -22),
        new THREE.Vector3(-32, -12, 10),
        new THREE.Vector3(-4, 28, 4),
        new THREE.Vector3(22, -16, 8),
        new THREE.Vector3(46, -24, -18),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-42, 16, -8),
        new THREE.Vector3(-18, 22, -12),
        new THREE.Vector3(14, 24, -14),
        new THREE.Vector3(36, 18, -4),
        new THREE.Vector3(42, -10, 12),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-32, -12, 10),
        new THREE.Vector3(-12, -22, -6),
        new THREE.Vector3(2, -26, 6),
        new THREE.Vector3(22, -16, 8),
      ]),
    ];

    interface TransactionPacket {
      curveIdx: number;
      progress: number;
      speed: number;
      mesh: THREE.Mesh;
    }

    const packetGroup = new THREE.Group();
    scene.add(packetGroup);

    const packetGeo = new THREE.SphereGeometry(0.8, 12, 12);
    const packetColors = [0x10b981, 0x06b6d4, 0xf59e0b, 0xe11d48];
    const packets: TransactionPacket[] = [];

    const totalPackets = 24;
    for (let i = 0; i < totalPackets; i++) {
      const curveIdx = i % transactionSplines.length;
      const progress = (i / totalPackets) + Math.random() * 0.1;
      const speed = 0.0026 + (i % 3) * 0.0014;
      const col = packetColors[i % packetColors.length];

      const pMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 3.2, // Ultra bright neon laser pulse
        roughness: 0.1,
      });

      const pMesh = new THREE.Mesh(packetGeo, pMat);
      const initialPos = transactionSplines[curveIdx].getPointAt(progress % 1.0);
      pMesh.position.copy(initialPos);
      packetGroup.add(pMesh);

      packets.push({ curveIdx, progress: progress % 1.0, speed, mesh: pMesh });
    }

    // 10. Billowing Multicolored Bokeh Particle Field (1,500 particles)
    const particleCount = 1500;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColorsArray = new Float32Array(particleCount * 3);
    const particleSpeeds: number[] = [];

    const cGold = new THREE.Color(0xf59e0b);
    const cCrimson = new THREE.Color(0xe11d48);
    const cEmerald = new THREE.Color(0x10b981);
    const cCyan = new THREE.Color(0x06b6d4);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 220;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 160;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 120 - 15;

      const r = Math.random();
      const col = r < 0.28 ? cGold : r < 0.5 ? cCyan : r < 0.75 ? cCrimson : cEmerald;
      particleColorsArray[i3] = col.r;
      particleColorsArray[i3 + 1] = col.g;
      particleColorsArray[i3 + 2] = col.b;

      particleSpeeds.push(0.015 + Math.random() * 0.035);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColorsArray, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleField = new THREE.Points(particleGeo, particleMat);
    scene.add(particleField);

    // 11. Event Handlers
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = -(e.clientY / window.innerHeight - 0.5) * 2;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
      setMousePos({ x, y });
    };

    const handleScroll = () => {
      scrollRef.current.targetY = window.scrollY || document.documentElement.scrollTop;
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // 12. Dynamic 60 FPS Render Loop through EffectComposer
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      scrollRef.current.y += (scrollRef.current.targetY - scrollRef.current.y) * 0.06;

      const motionScale = reducedMotion ? 0.15 : 1.0;

      camera.position.x = mouseRef.current.x * 10 * motionScale;
      camera.position.y = mouseRef.current.y * 7 * motionScale - scrollRef.current.y * 0.012 * motionScale;
      camera.lookAt(0, -scrollRef.current.y * 0.012 * motionScale, 0);

      if (!reducedMotion) {
        // Continuous Molten Liquid Surface Deformation
        const time = elapsedTime * 1.35;
        const currentPositions = posAttr.array as Float32Array;

        for (let i = 0; i < vertexCount; i++) {
          const i3 = i * 3;
          const bx = basePositions[i3];
          const by = basePositions[i3 + 1];
          const bz = basePositions[i3 + 2];

          const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
          const nx = bx / len;
          const ny = by / len;
          const nz = bz / len;

          const wave1 = Math.sin(nx * 3.5 + time) * Math.cos(ny * 3.2 + time * 0.8) * 1.8;
          const wave2 = Math.sin(nz * 4.2 - time * 1.2) * Math.cos(nx * 2.8 + time * 0.6) * 1.3;
          const wave3 = Math.cos(ny * 5.0 + time * 1.4) * 0.85;

          const totalRadius = baseRadius + (wave1 + wave2 + wave3) * 0.95;

          currentPositions[i3] = nx * totalRadius;
          currentPositions[i3 + 1] = ny * totalRadius;
          currentPositions[i3 + 2] = nz * totalRadius;
        }

        posAttr.needsUpdate = true;
        sphereGeo.computeVertexNormals();

        liquidGroup.rotation.y = elapsedTime * 0.12 + mouseRef.current.x * 0.3;
        liquidGroup.rotation.x = Math.sin(elapsedTime * 0.15) * 0.18 + mouseRef.current.y * 0.2;

        ring1.rotation.z += 0.007;
        ring1.rotation.y += 0.005;

        ring2.rotation.z -= 0.006;
        ring2.rotation.x += 0.004;

        nodesData.forEach((node, i) => {
          node.mesh.rotation.x += node.speed;
          node.mesh.rotation.y += node.speed * 1.2;
          node.ring.rotation.z += node.speed * 1.4;

          const pulse = Math.sin(elapsedTime * 2.5 + i) * 0.12 + 1.0;
          node.mesh.scale.setScalar(pulse);
        });

        packets.forEach((packet) => {
          packet.progress += packet.speed;
          if (packet.progress >= 1.0) {
            packet.progress = 0;
          }
          const pt = transactionSplines[packet.curveIdx].getPointAt(packet.progress);
          packet.mesh.position.copy(pt);
        });

        goldLight.position.x = Math.cos(elapsedTime * 0.7) * 36;
        goldLight.position.y = Math.sin(elapsedTime * 0.5) * 26;

        crimsonLight.position.x = -Math.sin(elapsedTime * 0.6) * 38;
        crimsonLight.position.y = Math.cos(elapsedTime * 0.8) * 24;

        // Billowing upward drift of bokeh particles
        const pArray = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          pArray[i3 + 1] += particleSpeeds[i] * motionScale;
          if (pArray[i3 + 1] > 80) {
            pArray[i3 + 1] = -80;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      composer.render();
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      composer.dispose();
      scene.clear();
      renderer.dispose();
    };
  }, [reducedMotion]);

  const pX = mousePos.x * 15;
  const pY = mousePos.y * 12;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Three.js Canvas with UnrealBloomPass Post-Processing */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 2. Architectural Cyber Typography & Ambient Technical Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-35">
        <div className="absolute top-16 left-12 font-mono text-[9px] tracking-[0.35em] text-slate-500 uppercase select-none">
          PAYSHIELD // AUTONOMOUS FINANCIAL DEFENSE
        </div>
        <div className="absolute top-16 right-12 font-mono text-[9px] tracking-[0.3em] text-slate-500 uppercase text-right select-none">
          SYS_VER: 4.8.2 // ACTIVE THEORY 3D PIPELINE
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[120px] font-black text-white/[0.015] tracking-[0.25em] select-none pointer-events-none whitespace-nowrap">
          PAYSHIELD
        </div>

        <div className="absolute bottom-8 left-12 font-mono text-[10px] text-slate-500/80 flex items-center gap-3">
          <span className="text-emerald-400 font-bold">+</span>
          <span>LAT: 37.7749° N</span>
          <span className="text-slate-700">|</span>
          <span>LNG: -122.4194° W</span>
          <span className="text-slate-700">|</span>
          <span className="text-amber-400/90">COST_ARBITRAGE: ACTIVE</span>
        </div>

        <div className="absolute bottom-8 right-12 font-mono text-[10px] text-slate-500/80 flex items-center gap-3">
          <span className="text-rose-400 font-bold">+</span>
          <span>THREAT_SHIELD: 100K TX/S</span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-400 font-semibold">SECURITY: ALPHA-1</span>
        </div>
      </div>

      {/* 3. Floating Frosted Glassmorphic Stat Cards */}
      <div
        className="hidden md:flex absolute top-28 left-14 z-0 items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/65 backdrop-blur-md border border-white/10 shadow-2xl transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${pX * 0.8}px, ${-pY * 0.8}px, 0)`,
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
          99%
        </div>
        <div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Autonomous Detection
          </div>
          <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <span>99.4% ROC-AUC</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      <div
        className="hidden md:flex absolute bottom-28 right-16 z-0 items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/65 backdrop-blur-md border border-white/10 shadow-2xl transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${-pX * 0.9}px, ${pY * 0.9}px, 0)`,
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-xs">
          2%
        </div>
        <div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Friction Budget
          </div>
          <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <span className="text-emerald-400">1.24%</span>
            <span className="text-slate-400 font-normal">(&le; 2.0% Target)</span>
          </div>
        </div>
      </div>

      <div
        className="hidden lg:flex absolute bottom-36 left-20 z-0 items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/65 backdrop-blur-md border border-white/10 shadow-2xl transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${pX * 0.6}px, ${pY * 0.6}px, 0)`,
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-mono font-bold text-xs">
          1.4
        </div>
        <div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Ensemble Latency
          </div>
          <div className="text-xs font-mono font-bold text-white">
            1.4ms Pipeline
          </div>
        </div>
      </div>

      {/* 4. Contrast Vignette Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(3,7,18,0.45)_0%,rgba(3,7,18,0.80)_65%,rgba(3,7,18,0.98)_100%)] pointer-events-none" />

      {/* 5. Cyber Scanline Reticle Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(245,158,11,0.015)_50%,transparent_100%)] bg-[length:100%_4px] pointer-events-none opacity-30" />
    </div>
  );
}
