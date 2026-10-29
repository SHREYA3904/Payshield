/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Shield,
  Layers,
  Cpu,
  Zap,
  RotateCcw,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Info,
  Server,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface PipelineNodeInfo {
  id: string;
  name: string;
  subtitle: string;
  latency: string;
  role: string;
  color: string;
  description: string;
  details: string[];
}

const PIPELINE_NODES: PipelineNodeInfo[] = [
  {
    id: 'ingestion',
    name: '1. Ingestion Gateway',
    subtitle: 'Multi-Modal Stream & Batch Parser',
    latency: '0.4 ms',
    role: 'Validation & Deduplication',
    color: '#06b6d4', // Cyan
    description: 'High-throughput stream receiver validating TLS tokens, schema integrity, and velocity timestamps.',
    details: ['Schema Validation & Type Guard', 'Idempotency & Replay Protection', 'Device Fingerprint Tokenizer'],
  },
  {
    id: 'features',
    name: '2. Feature Engineering Store',
    subtitle: 'Rolling Aggregates & Geo-Distance',
    latency: '1.2 ms',
    role: 'Enrichment & Tokenization',
    color: '#3b82f6', // Blue
    description: 'Computes velocity windows (1h, 24h, 7d), cross-merchant distance velocities, and historical spending deviation.',
    details: ['1h & 24h Velocity Buckets', 'Great-Circle Haversine Jump Ratio', 'Merchant High-Risk Categorization'],
  },
  {
    id: 'lightgbm',
    name: '3. LightGBM Engine Pod',
    subtitle: 'Leaf-Wise Histogram Gradient Booster',
    latency: '1.6 ms',
    role: 'Sparse & Categorical Anomaly Scoring',
    color: '#10b981', // Emerald
    description: 'Optimized for high-cardinality device and IP tokens. Dominates on IEEE-CIS benchmarks with 0.946 ROC-AUC.',
    details: ['Gradient-based One-Side Sampling (GOSS)', 'Exclusive Feature Bundling (EFB)', 'Sub-millisecond histogram bins'],
  },
  {
    id: 'xgboost',
    name: '4. XGBoost Engine Pod',
    subtitle: 'Depth-Wise Regularized Tree Ensemble',
    latency: '4.2 ms',
    role: 'Continuous PCA & Extreme Imbalance Scoring',
    color: '#f59e0b', // Amber
    description: 'Optimized for continuous multi-dimensional feature spaces. Dominates European Credit Card with 0.982 ROC-AUC.',
    details: ['Exact greedy split searching', 'Hessian L2 & L1 regularization', 'Zero-leakage missing branch routing'],
  },
  {
    id: 'router',
    name: '5. Dynamic Agent Router',
    subtitle: 'Adaptive Ensemble Meta-Coordinator',
    latency: '0.8 ms',
    role: 'Ensemble Weighting & Model Arbitration',
    color: '#8b5cf6', // Violet
    description: 'Arbitrates predictions based on transaction archetype (high-value wire vs micro-payment vs bot attack).',
    details: ['Dynamic softmax confidence blending', 'Dataset drift detector trigger', 'SHAP feature variance weighting'],
  },
  {
    id: 'cost_matrix',
    name: '6. Cost-Aware Policy Matrix',
    subtitle: 'Expected Loss & Frontier Evaluator',
    latency: '0.5 ms',
    role: 'Loss Optimization: E[Action] = Σ C_i · P_i',
    color: '#ec4899', // Pink
    description: 'Balances true financial loss ($L) against false positive friction ($25) and step-up challenge overhead ($2).',
    details: ['Friction Budget Target <= 2.0%', 'Dynamic threshold cutoffs (0.35 & 0.72)', 'Asymmetric cost surface computation'],
  },
  {
    id: 'decision_shield',
    name: '7. Deterministic Policy Shield',
    subtitle: 'Rule Verification & Guardrails',
    latency: '0.3 ms',
    role: 'Immutable Security Enforcement',
    color: '#e11d48', // Electric Crimson
    description: 'Guarantees the final ALLOW / STEP-UP / BLOCK decision strictly conforms to deterministic compliance gates.',
    details: ['Autonomous LLM cannot override decisions', 'Sanctions & Blacklist immediate block', 'Step-up OTP generation pipeline'],
  },
  {
    id: 'gemini_explainer',
    name: '8. Gemini 3.8 Flash Explainer',
    subtitle: 'Grounding Agent & Audit Logger',
    latency: '45 ms',
    role: 'Regulatory Audit & Human-in-the-Loop',
    color: '#6366f1', // Indigo
    description: 'Generates real-time regulatory explanations grounded in SHAP values and cost calculus for compliance logs.',
    details: ['Strict zero-hallucination grounding', 'SOC2 / PCI-DSS compliance audit trail', 'Case management summary synthesis'],
  },
];

export function ThreeArchitectureScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(0);
  const [hoveredNodeName, setHoveredNodeName] = useState<string | null>(null);
  const [explodedRatio, setExplodedRatio] = useState<number>(1.0);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // References to communicate React state into the Three.js tick loop without re-triggering useEffect
  const explodedRef = useRef(1.0);
  const autoRotateRef = useRef(true);
  const selectedNodeRef = useRef(0);

  useEffect(() => {
    explodedRef.current = explodedRatio;
  }, [explodedRatio]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    selectedNodeRef.current = selectedNodeIndex;
  }, [selectedNodeIndex]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 14, 22);

    // 2. Renderer with PBR settings
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio Environment Map (PMREM + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent camera sinking under floor
    controls.minDistance = 8;
    controls.maxDistance = 38;
    controls.target.set(0, 1.5, 0);

    // 5. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x0a1128, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x1e1b4b, 0x020617, 0.8);
    scene.add(hemiLight);

    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(12, 20, 10);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 50;
      keyLight.shadow.bias = -0.0005;
      const d = 16;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
    }
    scene.add(keyLight);

    // Electric Crimson Rim Light
    const rimLight = new THREE.DirectionalLight(0xe11d48, 3.2);
    rimLight.position.set(-15, 8, -12);
    scene.add(rimLight);

    // Cyan Bottom Accent Fill
    const cyanLight = new THREE.PointLight(0x06b6d4, 1.5, 25);
    cyanLight.position.set(0, 0.5, 0);
    scene.add(cyanLight);

    // 6. Ground Grid & Contact Shadow Plane
    const gridHelper = new THREE.GridHelper(36, 36, 0xe11d48, 0x1e293b);
    gridHelper.position.y = 0;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    scene.add(gridHelper);

    // Radial shadow grounding ring
    const groundGeo = new THREE.RingGeometry(0.1, 16, 64);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.01;
    scene.add(groundMesh);

    // Central Core Pedestal
    const corePillarGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.6, 32);
    const corePillarMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.08,
    });
    const corePillar = new THREE.Mesh(corePillarGeo, corePillarMat);
    corePillar.position.y = 0.3;
    corePillar.receiveShadow = !isSoftwareGl;
    scene.add(corePillar);

    // 7. Procedural 3-12 Part Composite Nodes for each Pipeline Step
    const nodeGroups: THREE.Group[] = [];
    const interactiveMeshes: THREE.Mesh[] = [];
    const baseRadius = 8.5;
    const count = PIPELINE_NODES.length;

    PIPELINE_NODES.forEach((node, i) => {
      const angle = (i / count) * Math.PI * 2;
      const group = new THREE.Group();

      // Store initial angle & radius for exploded-view math
      group.userData = {
        index: i,
        id: node.id,
        name: node.name,
        colorHex: node.color,
        baseAngle: angle,
        baseRadius: baseRadius,
      };

      const color = new THREE.Color(node.color);

      // Part 1: Ground Floating Base Pedestal
      const baseGeo = new THREE.CylinderGeometry(0.85, 1.0, 0.35, 16);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.85,
        roughness: 0.25,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.175;
      baseMesh.castShadow = !isSoftwareGl;
      baseMesh.receiveShadow = !isSoftwareGl;
      group.add(baseMesh);

      // Part 2: Middle Energy Core (Glowing Cylinder or Box)
      const coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.9, 16);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.5,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.45,
      });
      const middleCore = new THREE.Mesh(coreGeo, coreMat);
      middleCore.position.y = 0.8;
      middleCore.castShadow = !isSoftwareGl;
      group.add(middleCore);

      // Part 3: Hero Geometry (Specific to Node Type)
      let heroMesh: THREE.Mesh;
      if (node.id === 'decision_shield') {
        // Octahedral Shield
        const octGeo = new THREE.OctahedronGeometry(0.7, 0);
        const octMat = new THREE.MeshPhysicalMaterial({
          color: color,
          metalness: 0.3,
          roughness: 0.15,
          emissive: color,
          emissiveIntensity: 0.6,
          clearcoat: 1.0,
        });
        heroMesh = new THREE.Mesh(octGeo, octMat);
      } else if (node.id === 'router') {
        // Quantum Icosahedron
        const icoGeo = new THREE.IcosahedronGeometry(0.65, 0);
        const icoMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          metalness: 0.8,
          roughness: 0.1,
          emissive: color,
          emissiveIntensity: 0.7,
        });
        heroMesh = new THREE.Mesh(icoGeo, icoMat);
      } else if (node.id === 'lightgbm' || node.id === 'xgboost') {
        // Crystalline Tree / Diamond Fin
        const coneGeo = new THREE.ConeGeometry(0.6, 1.1, 6);
        const coneMat = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.7,
          roughness: 0.2,
          emissive: color,
          emissiveIntensity: 0.5,
        });
        heroMesh = new THREE.Mesh(coneGeo, coneMat);
      } else {
        // Torus-accented sphere
        const sphGeo = new THREE.SphereGeometry(0.55, 24, 24);
        const sphMat = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.6,
          roughness: 0.25,
          emissive: color,
          emissiveIntensity: 0.4,
        });
        heroMesh = new THREE.Mesh(sphGeo, sphMat);
      }

      heroMesh.position.y = 1.7;
      heroMesh.castShadow = !isSoftwareGl;
      heroMesh.userData = { isInteractiveNode: true, nodeIndex: i };
      group.add(heroMesh);
      interactiveMeshes.push(heroMesh);

      // Part 4: Rotating Accent Ring / Orbit Halo
      const ringGeo = new THREE.TorusGeometry(0.95, 0.04, 8, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.3,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 1.7;
      ringMesh.name = 'accentRing';
      group.add(ringMesh);

      // Part 5: Beacon Point Light for top 4 nodes
      if (i % 2 === 0) {
        const pLight = new THREE.PointLight(color, 1.2, 5);
        pLight.position.y = 2.4;
        group.add(pLight);
      }

      // Initial Position
      const x = Math.cos(angle) * baseRadius;
      const z = Math.sin(angle) * baseRadius;
      group.position.set(x, 0, z);

      scene.add(group);
      nodeGroups.push(group);
    });

    // 8. Interconnecting Spline & Cyber Flow Particles
    const splinePoints: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      splinePoints.push(new THREE.Vector3(Math.cos(angle) * baseRadius, 1.4, Math.sin(angle) * baseRadius));
    }
    // Close the loop
    splinePoints.push(splinePoints[0].clone());

    const curve = new THREE.CatmullRomCurve3(splinePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 120, 0.04, 8, true);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x1e293b,
      emissiveIntensity: 0.2,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tubeMesh);

    // Dynamic Flowing Data Particles
    const particleCount = 48;
    const particleGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xe11d48, // Electric crimson packets
    });
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const dummy = new THREE.Object3D();
    const particleOffsets = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      particleOffsets[i] = i / particleCount;
    }

    // 9. Central Holographic Core in the middle
    const centralGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const centralMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xe11d48,
      emissiveIntensity: 0.8,
      wireframe: true,
    });
    const centralHolo = new THREE.Mesh(centralGeo, centralMat);
    centralHolo.position.y = 2.8;
    scene.add(centralHolo);

    const centralRingGeo = new THREE.TorusGeometry(2.0, 0.05, 8, 48);
    const centralRingMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.5,
    });
    const centralRing = new THREE.Mesh(centralRingGeo, centralRingMat);
    centralRing.position.y = 2.8;
    centralRing.rotation.x = Math.PI / 3;
    scene.add(centralRing);

    // 10. Raycasting Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const nodeIdx = hit.userData.nodeIndex;
        if (typeof nodeIdx === 'number') {
          setHoveredNodeName(PIPELINE_NODES[nodeIdx].name);
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredNodeName(null);
      renderer.domElement.style.cursor = 'default';
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const nodeIdx = hit.userData.nodeIndex;
        if (typeof nodeIdx === 'number') {
          setSelectedNodeIndex(nodeIdx);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 520;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    });
    resizeObserver.observe(container);

    // 11. Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Controls update with damping
      controls.update();

      // Auto-rotation when active
      if (autoRotateRef.current) {
        scene.rotation.y += delta * 0.12;
      }

      // Rotate central hologram & rings
      centralHolo.rotation.x = elapsed * 0.4;
      centralHolo.rotation.y = elapsed * 0.6;
      centralRing.rotation.z = -elapsed * 0.3;

      // Update node positions based on exploded layout slider
      const exp = explodedRef.current;
      nodeGroups.forEach((group, idx) => {
        const baseAngle = group.userData.baseAngle;
        const currentR = baseRadius * exp;
        const targetX = Math.cos(baseAngle) * currentR;
        const targetZ = Math.sin(baseAngle) * currentR;

        // Smooth damping
        group.position.x = THREE.MathUtils.damp(group.position.x, targetX, 6, delta);
        group.position.z = THREE.MathUtils.damp(group.position.z, targetZ, 6, delta);

        // Rotating accent ring
        const ring = group.getObjectByName('accentRing');
        if (ring) {
          ring.rotation.z = elapsed * (1 + idx * 0.2);
        }

        // Selected node elevation highlight
        const isSelected = selectedNodeRef.current === idx;
        const targetY = isSelected ? 0.6 : 0;
        group.position.y = THREE.MathUtils.damp(group.position.y, targetY, 8, delta);
      });

      // Update flowing data particles along spline
      for (let i = 0; i < particleCount; i++) {
        const t = (particleOffsets[i] + elapsed * 0.14) % 1.0;
        const pos = curve.getPointAt(t);
        dummy.position.copy(pos);
        dummy.position.multiplyScalar(exp); // scale with explosion
        dummy.scale.setScalar(0.7 + Math.sin(elapsed * 4 + i) * 0.2);
        dummy.updateMatrix();
        particleInstanced.setMatrixAt(i, dummy.matrix);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;

      // Render Scene
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // 12. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);

      // Dispose Three resources
      renderer.dispose();
      scene.clear();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  const currentNode = PIPELINE_NODES[selectedNodeIndex];

  return (
    <div className="relative w-full h-[620px] rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col font-sans select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD Overlay (Unobstructed Center Directive Compliant) */}
      <div className="relative z-10 p-4 sm:p-5 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-lg max-w-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              PayShield 3D Cyber Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Autonomous multi-engine architecture in 3D coordinate space. Click any node to inspect telemetry.
          </p>
          {hoveredNodeName && (
            <div className="mt-2 text-[11px] font-mono text-rose-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              <span>Hovering: {hoveredNodeName}</span>
            </div>
          )}
        </div>

        {/* Camera & Quick Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-md ${
              autoRotate
                ? 'bg-rose-950/60 border-rose-600/50 text-rose-300'
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>Orbit {autoRotate ? 'ON' : 'PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock (Three.js Directive Compliant) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl pointer-events-auto transition-transform duration-300 ease-out">
        {/* Toggle Collapse Bar */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            className="px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-t-lg text-[11px] font-mono font-semibold text-slate-300 hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            {isControlsCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isControlsCollapsed ? '▲ Expand Architecture Dock' : '▼ Cinema Mode (Hide Dock)'}</span>
          </button>
        </div>

        {!isControlsCollapsed && (
          <div className="rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-4 text-slate-200">
            {/* Top Node Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-slate-800/80 scrollbar-thin">
              {PIPELINE_NODES.map((node, idx) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNodeIndex(idx)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedNodeIndex === idx
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40 border border-rose-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: node.color }}
                  />
                  <span>{node.name.split('.')[1]?.trim() || node.name}</span>
                </button>
              ))}
            </div>

            {/* Selected Node Detailed Specification Grid */}
            <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Left Column: Role & Latency */}
              <div className="space-y-2 md:border-r md:border-slate-800/80 md:pr-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white">{currentNode.name}</span>
                  <span className="font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded text-[11px]">
                    {currentNode.latency}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">{currentNode.subtitle}</p>
                <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] pt-1">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  <span>Role: {currentNode.role}</span>
                </div>
              </div>

              {/* Middle Column: Architectural Description */}
              <div className="space-y-1.5 md:border-r md:border-slate-800/80 md:pr-4">
                <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider block">
                  Core Mechanics
                </span>
                <p className="text-slate-300 leading-relaxed text-[12px]">{currentNode.description}</p>
              </div>

              {/* Right Column: Execution Invariants & Exploded Slider */}
              <div className="space-y-2">
                <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider block">
                  Invariants & Guardrails
                </span>
                <ul className="space-y-1 text-slate-300">
                  {currentNode.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {/* Exploded View Slider */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800/60 mt-2 font-mono text-[11px] text-slate-400">
                  <span>Layout Expansion:</span>
                  <input
                    type="range"
                    min="0.6"
                    max="1.5"
                    step="0.05"
                    value={explodedRatio}
                    onChange={(e) => setExplodedRatio(parseFloat(e.target.value))}
                    className="w-28 accent-rose-500 cursor-pointer"
                  />
                  <span className="text-slate-200">{(explodedRatio * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
