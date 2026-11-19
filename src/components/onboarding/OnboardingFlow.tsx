import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ArrowRight, ArrowLeft, Check, Shield, Lock } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';
import { listImportBrowsers, scanImportBrowser, importBrowserBookmarks, importBrowserHistory, importBookmarksHtml } from '../../lib/electronBridge';

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'cinematic' | 'search' | 'import' | 'sync' | 'ready';
type SearchEngine = 'duckduckgo' | 'google' | 'brave';
type ImportBrowser = 'chrome' | 'arc' | 'brave' | 'edge';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FavIcon = ({ domain, size = 64 }: { domain: string; size?: number }) => (
  <img
    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`}
    alt={domain}
    width={size} height={size}
    className="rounded-sm object-contain"
    style={{ imageRendering: 'crisp-edges' }}
    onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
  />
);

// ─── Reusable Cinematic Background ───────────────────────────────────────────
interface CinematicBackgroundProps {
  sceneType: 'search' | 'import' | 'sync' | 'ready';
}
const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ sceneType }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The setup now uses the supplied Graphite ambient treatment.  Keep this
    // component as the common backdrop so each stage shares one visual system,
    // without running a second WebGL scene behind the opening cinematic.
    return undefined;
  }, [sceneType]);

  function initBlackHoleScene() {
    if (!canvasRef.current) return;
    const container = canvasRef.current!;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(48, (container.clientWidth || innerWidth) / (container.clientHeight || innerHeight), 0.1, 140);
    camera.position.set(0, 1.1, 29);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(container.clientWidth || innerWidth, container.clientHeight || innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
    container.appendChild(renderer.domElement);

    const system = new THREE.Group();
    scene.add(system);
    const horizon = new THREE.Mesh(
      new THREE.SphereGeometry(4.7, 80, 80),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    horizon.renderOrder = 3;
    system.add(horizon);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(5.0, 80, 80),
      new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.BackSide, uniforms: { glow: { value: new THREE.Color(0x7000ff) } }, vertexShader: 'varying vec3 vN; void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'varying vec3 vN; uniform vec3 glow; void main(){float f=pow(1.0-abs(vN.z),3.4);gl_FragColor=vec4(glow*f,f*0.30);}' })
    );
    halo.renderOrder = 2;
    system.add(halo);

    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = THREE.MathUtils.degToRad(66);
    ringGroup.rotation.z = THREE.MathUtils.degToRad(-12);
    system.add(ringGroup);
    const rings: THREE.Mesh[] = [];
    const ringSpecs = [
      [9.3, 0.22, 0x240044, 0.38], [11.8, 0.16, 0x7000ff, 0.55], [15.5, 0.10, 0xa855f7, 0.45], [20.0, 0.055, 0x7000ff, 0.28]
    ] as const;
    ringSpecs.forEach(([radius, tube, color, opacity], index) => {
      const geometry = new THREE.TorusGeometry(radius, tube, 16, 220);
      const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.8, transparent: true, opacity, roughness: 0.26, metalness: 0.72, depthWrite: false });
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.z = index * 0.5;
      ring.renderOrder = 1;
      ringGroup.add(ring); rings.push(ring);
    });
    const innerDisk = new THREE.Mesh(
      new THREE.RingGeometry(5.15, 9.8, 240),
      new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false, uniforms: { violet: { value: new THREE.Color(0x7000ff) } }, vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'varying vec2 vUv; uniform vec3 violet; void main(){float d=abs(vUv.y-.5)*2.; float streak=pow(1.-d,5.); float a=streak*(.20+.65*pow(vUv.x,1.7)); gl_FragColor=vec4(violet*(.4+streak*1.4),a);}' })
    );
    innerDisk.rotation.x = Math.PI / 2;
    innerDisk.renderOrder = 0;
    ringGroup.add(innerDisk);

    const key = new THREE.PointLight(0xa855f7, 22, 45); key.position.set(0, 4, 7); scene.add(key);
    const rim = new THREE.PointLight(0x7000ff, 14, 36); rim.position.set(-10, -2, -6); scene.add(rim);
    const clock = new THREE.Clock();
    let alive = true;
    const resize = () => { const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); };
    addEventListener('resize', resize);
    const disposeMaterial = (material: THREE.Material | THREE.Material[]) => (Array.isArray(material) ? material : [material]).forEach(item => item.dispose());
    const animate = () => {
      if (!alive) return;
      requestAnimationFrame(animate);
      const t = reducedMotion ? 7.5 : clock.getElapsedTime();
      const formation = THREE.MathUtils.smoothstep(t, 0.6, 4.8);
      const peak = THREE.MathUtils.smoothstep(t, 5.2, 7.8);
      const collapse = THREE.MathUtils.smoothstep(t, 10.4, 13.5);
      const scale = Math.max(0.035, formation * (1 - collapse * 0.94));
      system.scale.setScalar(scale);
      camera.position.z = 33 - formation * 10 + collapse * 3;
      ringGroup.rotation.z = THREE.MathUtils.degToRad(-12) + t * 0.042;
      ringGroup.rotation.x = THREE.MathUtils.degToRad(66) + Math.sin(t * 0.18) * 0.035;
      rings.forEach((ring, index) => { ring.rotation.z += (index % 2 ? -1 : 1) * (0.0025 + index * 0.0009); ring.scale.setScalar(1 - collapse * 0.72); });
      halo.material.uniforms.glow.value.setHex(peak > 0.5 ? 0xa855f7 : 0x7000ff);
      key.intensity = (12 + peak * 15) * (1 - collapse * 0.8);
      renderer.render(scene, camera);
    };
    animate();
    return () => { alive = false; removeEventListener('resize', resize); scene.traverse(object => { const mesh = object as THREE.Mesh; mesh.geometry?.dispose(); if (mesh.material) disposeMaterial(mesh.material); }); renderer.dispose(); renderer.domElement.remove(); };
  }

  function legacyVesperScene() {
    if (!canvasRef.current) return;
    const container = canvasRef.current;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090f, 0.02);

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.set(0, 0, 25);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;position:absolute;inset:0;';
    container.appendChild(renderer.domElement);

    // Scene-specific elements
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const mat = new THREE.MeshPhysicalMaterial({ color: 0x8b5cf6, emissive: 0x4c1d95, emissiveIntensity: 0.6, roughness: 0.15, metalness: 0.8, clearcoat: 0.9 });

    if (sceneType === 'search') {
      // Floating search nodes / network
      for (let i = 0; i < 8; i++) {
        const node = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + Math.random() * 0.6, 0), mat);
        node.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8);
        mainGroup.add(node);
      }
      // Connecting lines
      const lineMat = new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.2 });
      for (let i = 0; i < 12; i++) {
        const points = [
          new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10),
          new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10),
        ];
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat);
        mainGroup.add(line);
      }
    } else if (sceneType === 'import') {
      // Data stream / migration flow
      for (let i = 0; i < 20; i++) {
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), mat);
        cube.position.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8);
        cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        mainGroup.add(cube);
      }
      // Flow rings
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(4 + i * 2, 0.05, 8, 64), new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.15 }));
        ring.rotation.x = Math.PI / 2 + i * 0.3;
        mainGroup.add(ring);
      }
    } else if (sceneType === 'sync') {
      // Cloud / sync visualization
      for (let i = 0; i < 12; i++) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random() * 0.4, 16, 16), mat);
        sphere.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6);
        mainGroup.add(sphere);
      }
      // Orbital rings
      for (let i = 0; i < 2; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(6 + i * 3, 0.08, 16, 100), new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.2 }));
        ring.rotation.x = Math.PI / 2.5;
        mainGroup.add(ring);
      }
    } else if (sceneType === 'ready') {
      // Victory / completion scene
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(2, 0), mat);
      mainGroup.add(core);
      // Victory rings
      for (let i = 0; i < 4; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(3 + i * 1.5, 0.06, 16, 80), new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.3 - i * 0.05 }));
        ring.rotation.x = Math.PI / 2 + i * 0.2;
        mainGroup.add(ring);
      }
    }

    // Particles for all scenes
    const pCount = 400;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 5 + Math.random() * 20;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      pPos[i*3] = r * Math.sin(ph) * Math.cos(th);
      pPos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pPos[i*3+2] = r * Math.cos(ph);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.12, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
    scene.add(particles);

    // Lighting
    const ambient = new THREE.AmbientLight(0x0f0b1a);
    ambient.intensity = 2;
    scene.add(ambient);
    const light = new THREE.DirectionalLight(0x8b5cf6, 4);
    light.position.set(5, 10, 8);
    scene.add(light);
    const backLight = new THREE.PointLight(0x6366f1, 5, 25);
    backLight.position.set(0, 0, -5);
    scene.add(backLight);

    const clock = new THREE.Clock();
    let alive = true;
    function animate() {
      if (!alive) return;
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      mainGroup.rotation.y = t * 0.15;
      mainGroup.rotation.x = Math.sin(t * 0.2) * 0.1;
      particles.rotation.y = t * 0.03;
      particles.rotation.x = t * 0.015;

      if (sceneType === 'ready') {
        // Pulsing core for ready screen
        const core = mainGroup.children[0];
        if (core) {
          const scale = 1 + Math.sin(t * 2) * 0.1;
          (core as any).scale.set(scale, scale, scale);
          (core as any).rotation.y = t * 0.5;
          (core as any).rotation.z = t * 0.3;
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      const rw = container.clientWidth || window.innerWidth;
      const rh = container.clientHeight || window.innerHeight;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      alive = false;
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }

  void initBlackHoleScene;
  void legacyVesperScene;

  return (
    <div ref={canvasRef} className={`graphite-ambient graphite-ambient--${sceneType} absolute inset-0 pointer-events-none z-0`}>
      <span className="graphite-ambient__orb graphite-ambient__orb--one" />
      <span className="graphite-ambient__orb graphite-ambient__orb--two" />
      <span className="graphite-ambient__grain" />
    </div>
  );
};

// ─── Screen 0: Three.js Cinematic Reveal ─────────────────────────────────────
function createBlackHoleCinematic(container: HTMLDivElement, onCollapse: () => void) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(47, (container.clientWidth || innerWidth) / (container.clientHeight || innerHeight), .1, 140);
  camera.position.set(0, .8, 31);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth || innerWidth, container.clientHeight || innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;'; container.appendChild(renderer.domElement);
  const system = new THREE.Group(); scene.add(system);
  const disk = new THREE.Group(); disk.rotation.set(THREE.MathUtils.degToRad(67), 0, THREE.MathUtils.degToRad(-13)); system.add(disk);
  const glow = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: .46, blending: THREE.AdditiveBlending, depthWrite: false });
  const rings: THREE.Mesh[] = [];
  [[9.5,.25],[12.5,.17],[16.7,.11],[23,.06]].forEach(([radius,tube], i) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 220), glow.clone()); ring.rotation.z = i * .7; disk.add(ring); rings.push(ring); });
  const stream = new THREE.Mesh(new THREE.RingGeometry(5.0, 10.8, 240), new THREE.MeshBasicMaterial({ color: 0x7000ff, transparent: true, opacity: .22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); stream.rotation.x = Math.PI / 2; disk.add(stream);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(5.05, 64, 64), new THREE.MeshBasicMaterial({ color: 0x7000ff, transparent: true, opacity: .12, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })); system.add(halo);
  const horizon = new THREE.Mesh(new THREE.SphereGeometry(4.75, 80, 80), new THREE.MeshBasicMaterial({ color: 0x000000 })); horizon.renderOrder = 4; system.add(horizon);
  const rayGeometry = new THREE.BufferGeometry();
  const rayPositions = new Float32Array(72 * 2 * 3);
  for (let i = 0; i < 72; i++) {
    const angle = Math.random() * Math.PI * 2;
    const start = 5.3 + Math.random() * 1.8;
    const end = 19 + Math.random() * 24;
    const offset = i * 6;
    rayPositions[offset] = Math.cos(angle) * start; rayPositions[offset + 1] = Math.sin(angle) * start * .58; rayPositions[offset + 2] = (Math.random() - .5) * 2;
    rayPositions[offset + 3] = Math.cos(angle) * end; rayPositions[offset + 4] = Math.sin(angle) * end * .58; rayPositions[offset + 5] = (Math.random() - .5) * 5;
  }
  rayGeometry.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));
  const rayMaterial = new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const rays = new THREE.LineSegments(rayGeometry, rayMaterial); rays.rotation.set(THREE.MathUtils.degToRad(67), 0, THREE.MathUtils.degToRad(-13)); scene.add(rays);
  scene.add(new THREE.PointLight(0xa855f7, 25, 40));
  const clock = new THREE.Clock(); let alive = true; let completed = false;
  const resize = () => { const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }; addEventListener('resize', resize);
  const animate = () => { if (!alive) return; requestAnimationFrame(animate); const t = reduced ? 5.6 : clock.getElapsedTime(); const form = THREE.MathUtils.smoothstep(t, .15, 2.3); const peak = THREE.MathUtils.smoothstep(t, 2.5, 4.1); const collapse = THREE.MathUtils.smoothstep(t, 4.7, 5.8); const burst = THREE.MathUtils.smoothstep(t, 5.45, 6.05) * (1 - THREE.MathUtils.smoothstep(t, 6.3, 7.1)); const scale = Math.max(.018, form * (1 - collapse * .982)); system.scale.setScalar(scale); camera.position.z = 33 - form * 11 + collapse * 4; disk.rotation.z = THREE.MathUtils.degToRad(-13) + t * .072; rings.forEach((ring, i) => { ring.rotation.z += (i % 2 ? -.012 : .008) * (1 - collapse); ring.scale.setScalar(1 - collapse * .82); }); halo.scale.setScalar(1 + Math.sin(t * 1.4) * .04); glow.opacity = .36 + peak * .28; rayMaterial.opacity = burst * .95; rays.scale.setScalar(.15 + burst * 1.25); rays.rotation.z += .003; renderer.render(scene, camera); if (!reduced && t > 7.15 && !completed) { completed = true; onCollapse(); } };
  animate();
  return () => { alive = false; removeEventListener('resize', resize); scene.traverse(object => { const mesh = object as THREE.Mesh; mesh.geometry?.dispose(); const material = mesh.material; if (material) (Array.isArray(material) ? material : [material]).forEach(item => item.dispose()); }); renderer.dispose(); renderer.domElement.remove(); };
}
void createBlackHoleCinematic;

const CinematicReveal: React.FC<{ onEnter: () => void; onSkip: () => void }> = ({ onEnter, onSkip }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const launchedRef = useRef(false);
  const initedRef = useRef(false);
  const disposeRef = useRef<(() => void) | null>(null);
  const [launched, setLaunched] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    const init = () => {
      if (initedRef.current || !canvasRef.current) return;
      initedRef.current = true;
      disposeRef.current = initThreeScene() ?? null;
    };
    requestAnimationFrame(init);

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); triggerLaunch(); }
      if (e.code === 'Escape') { e.preventDefault(); onSkip(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', handleKey);
      disposeRef.current?.();
      disposeRef.current = null;
    };
  }, []);

  function triggerLaunch() {
    if (launchedRef.current) return;
    launchedRef.current = true;
    setLaunched(true);
    setTimeout(onEnter, 650);
  }

  function initThreeScene() {
    if (!canvasRef.current) return;
    // The supplied Graphite welcome replaces the experimental WebGL intro.
    // Keeping this function inert also guarantees there is no background
    // render loop after the user leaves the welcome step.
    return undefined;
    /* Legacy logo scene retained below temporarily for safe rollback. */
    const container = canvasRef.current!;

    // Ensure container has dimensions — fall back to window size
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060609, 0.025);

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
    container.appendChild(renderer.domElement);

    const brandGroup = new THREE.Group();
    scene.add(brandGroup);

    const vMat = new THREE.MeshPhysicalMaterial({ color: 0x9333ea, emissive: 0x3b0764, emissiveIntensity: 0.7, roughness: 0.12, metalness: 0.85, clearcoat: 1.0, clearcoatRoughness: 0.1 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, wireframe: true, transparent: true, opacity: 0.25 });

    const wingGeo = new THREE.BoxGeometry(1.6, 7.8, 1.4);
    const lWing = new THREE.Mesh(wingGeo, vMat);
    lWing.position.set(-2.0, 0.6, 0);
    lWing.rotation.z = THREE.MathUtils.degToRad(-26);
    const lGlow = new THREE.Mesh(wingGeo, glowMat);
    lGlow.scale.set(1.08, 1.05, 1.15);
    lWing.add(lGlow);
    brandGroup.add(lWing);

    const rWing = new THREE.Mesh(wingGeo, vMat);
    rWing.position.set(2.0, 0.6, 0);
    rWing.rotation.z = THREE.MathUtils.degToRad(26);
    const rGlow = new THREE.Mesh(wingGeo, glowMat);
    rGlow.scale.set(1.08, 1.05, 1.15);
    rWing.add(rGlow);
    brandGroup.add(rWing);

    const apex = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.4, 1.8, 16), vMat);
    apex.position.set(0, -2.6, 0);
    brandGroup.add(apex);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(6.5, 0.05, 16, 120), new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.9 }));
    ring1.rotation.x = Math.PI / 2.3;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(8.2, 0.03, 16, 140), new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.45 }));
    ring2.rotation.x = -Math.PI / 2.8;
    scene.add(ring2);

    const pCount = 750;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 4 + Math.random() * 22;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      pPos[i*3] = r * Math.sin(ph) * Math.cos(th);
      pPos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pPos[i*3+2] = r * Math.cos(ph);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xd8b4fe, size: 0.14, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }));
    scene.add(particles);

    const ambient = new THREE.AmbientLight(0x0f0b1a);
    ambient.intensity = 2.5;
    scene.add(ambient);
    const kl = new THREE.DirectionalLight(0xc084fc, 5.0); kl.position.set(8, 12, 10); scene.add(kl);
    const fl = new THREE.DirectionalLight(0x6366f1, 3.0); fl.position.set(-10, -6, 6); scene.add(fl);
    const rl = new THREE.PointLight(0xa855f7, 8.0, 30); rl.position.set(0, 0, -4); scene.add(rl);

    let mx = 0, my = 0, tx = 0, ty = 0;
    const onMouseMove = (e: MouseEvent) => {
      mx = (e.clientX - window.innerWidth / 2) * 0.0012;
      my = (e.clientY - window.innerHeight / 2) * 0.0012;
    };
    const onResize = () => {
      const rw = container.clientWidth || window.innerWidth;
      const rh = container.clientHeight || window.innerHeight;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let alive = true;
    function animate() {
      if (!alive) return;
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05;
      camera.position.x = tx * 10; camera.position.y = -ty * 8; camera.lookAt(0, 0, 0);

      if (t < 3.2) {
        const p = t / 3.2, e = 1 - Math.pow(1 - p, 3);
        camera.position.z = 32 - e * 14;
        brandGroup.rotation.y = (1 - e) * Math.PI;
      } else {
        brandGroup.rotation.y = Math.sin(t * 0.45) * 0.18 + tx * 0.4;
        brandGroup.rotation.x = Math.cos(t * 0.35) * 0.12 + ty * 0.3;
        brandGroup.position.y = Math.sin(t * 0.8) * 0.28;
      }
      ring1.rotation.z = t * 0.15; ring1.rotation.y = Math.sin(t * 0.2) * 0.3;
      ring2.rotation.z = -t * 0.1; ring2.rotation.y = Math.cos(t * 0.25) * 0.25;
      particles.rotation.y = t * 0.04; particles.rotation.x = t * 0.02;
      rl.intensity = 6.0 + Math.sin(t * 1.5) * 2.5;
      renderer.render(scene, camera);
    }
    animate();

    // Cleanup when component unmounts
    return () => {
      alive = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }

  return (
    <div className="stitch-vibrant-welcome" style={{ opacity: loaded ? 1 : 0, transition: 'opacity .45s ease' }}>
      <div className="stitch-vibrant-welcome__window"><i /><i /><i /></div>
      <span className="stitch-vibrant-welcome__brand">⌄ &nbsp; VESPER</span>
      <main>
        <span className="stitch-vibrant-welcome__eyebrow">● &nbsp; VESPER BROWSER 1.0 <b /> Fast, focused, private by design</span>
        <h1>Welcome to<br/><em>the new web</em></h1>
        <button onClick={triggerLaunch} disabled={launched}>{launched ? 'Opening setup…' : 'Get Started'} <span>→</span></button>
        <p>Ready to experience the distraction-free web</p>
      </main>
      <footer><span>⇩ &nbsp; Import bookmarks &amp; history</span><span>Press <kbd>ENTER</kbd> or <kbd>SPACE</kbd> to continue</span><button onClick={onSkip}>Skip setup &nbsp; Esc</button></footer>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#0b0c10]"
      style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease' }}
    >
      {/* Three.js canvas */}
      <div ref={canvasRef} className="absolute inset-0 z-10" />

      {/* Cinematic overlays */}
      <div className="fixed inset-0 pointer-events-none z-20">
        <div className="absolute top-0 left-0 right-0 h-10 border-b border-purple-500/15 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-12 border-t border-purple-500/15 bg-gradient-to-t from-black/90 to-transparent" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 via-purple-500/40 to-transparent blur-sm" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(11,12,16,0.85)_100%)]" />
        {/* Corner reticles */}
        {[['top-14 left-6','border-t-2 border-l-2'],['top-14 right-6','border-t-2 border-r-2'],['bottom-16 left-6','border-b-2 border-l-2'],['bottom-16 right-6','border-b-2 border-r-2']].map(([pos, border]) => (
          <div key={pos} className={`absolute ${pos} w-5 h-5 ${border} border-purple-400/40`} />
        ))}
      </div>

      {/* Top telemetry bar */}
      <header className="hidden">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161822]/70 backdrop-blur-md border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dce6] animate-ping" />
            <span className="text-cyan-400 font-bold tracking-wider">SEC.01</span>
          </span>
          <span className="text-white/60">SYS_INIT :: REVEAL</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px] tracking-wider text-purple-200/50">
          <span>ASPECT: 2.39:1 CINEMATIC</span>
          <span className="text-purple-500/40">•</span>
          <span>OPTICAL CLEARANCE: OPT_V9</span>
          <span className="text-purple-500/40">•</span>
          <span className="text-cyan-400/80 font-semibold">144 FPS UNLOCKED</span>
        </div>
      </header>

      {/* Center content */}
      <main className="hidden">
        <div
          className="flex flex-col items-center gap-5"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 1s ease 0.8s, transform 1s cubic-bezier(0.34,1.56,0.64,1) 0.8s' }}
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/30 backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-purple-200/90">
              VESPER BROWSER ARCHITECTURE // ACT 01
            </span>
          </div>

          <h1 className="text-[72px] md:text-[96px] font-black tracking-tight leading-none text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #e9d5ff 50%, rgba(167,139,250,0.8) 100%)', filter: 'drop-shadow(0 10px 35px rgba(147,51,234,0.4))' }}>
            VESPER
          </h1>

          <p className="text-lg text-purple-200/80 font-light tracking-[0.08em] max-w-xl leading-relaxed">
            Distraction-Free Spatial Web Platform. Zero Telemetry. 100% Native Power.
          </p>

          <div className="flex items-center gap-6 mt-8">
            <button
              onClick={triggerLaunch}
              disabled={launched}
              className="group flex items-center gap-4 px-14 py-6 rounded-full text-white text-xl font-semibold tracking-widest uppercase transition-all duration-300 border border-white/20"
              style={{ background: 'linear-gradient(135deg, #9333ea, #db2777, #6366f1)', boxShadow: '0 0 45px rgba(168,85,247,0.5)', fontFamily: 'system-ui, -apple-system, sans-serif' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 70px rgba(168,85,247,0.8)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 45px rgba(168,85,247,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              {launched ? (
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex items-end gap-1.5 h-6">
                  {[0,100,200,300].map(d => (
                    <span key={d} className="w-1.5 rounded-full bg-white/90" style={{ height: 6, animation: `soundwave 1s ease-in-out infinite ${d}ms` }} />
                  ))}
                </div>
              )}
              <span>Enter Vesper</span>
              <kbd className="px-4 py-2 text-[14px] rounded bg-white/20 font-mono">Space</kbd>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onSkip}
              className="flex items-center gap-3 px-8 py-5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-base tracking-wider uppercase backdrop-blur-md border border-white/10 transition-all"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              <kbd className="px-3 py-1.5 rounded bg-black/40 text-[13px] text-purple-300 border border-purple-500/20">Esc</kbd>
              Skip Sequence
            </button>
          </div>
        </div>
      </main>

      {/* Bottom telemetry */}
      <footer className="hidden">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-semibold tracking-wider">SCENE 01 / 01</span>
          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 animate-pulse" style={{ width: loaded ? '100%' : '0%', transition: 'width 2s ease' }} />
          </div>
          <span className="text-white/40">INITIALIZING CANVAS</span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-[#161822]/80 backdrop-blur-md border border-purple-500/20 text-center tracking-wider text-[10px] text-purple-200/70">
          AUDIO ENGINE: OFF • 144HZ V-SYNC • V8 COMPILER READY • ZERO DATA LOGGING
        </div>
        <div className="flex items-center gap-2 text-white/50 text-[10px] tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>Vesper Native v1.0.0 (x86_64)</span>
        </div>
      </footer>

      <button
        onClick={onSkip}
        className="absolute right-8 bottom-8 z-30 rounded-full px-5 py-2 text-xs font-medium tracking-wide transition-colors"
        style={{ color: 'rgba(232,220,255,0.68)', backgroundColor: 'rgba(15,10,24,0.50)', border: '1px solid rgba(168,85,247,0.22)', backdropFilter: 'blur(10px)' }}
      >
        Skip intro <kbd className="ml-2 rounded bg-black/30 px-1.5 py-0.5 text-[10px]">Esc</kbd>
      </button>

      <style>{`
        @keyframes soundwave { 0%,100%{height:4px} 50%{height:16px} }
      `}</style>
    </div>
  );
};

// ─── Shared setup nav bar ─────────────────────────────────────────────────────
const SetupNav: React.FC<{ step: Screen }> = ({ step }) => {
  const steps: { id: Screen; label: string }[] = [
    { id: 'search', label: 'Search Engine' },
    { id: 'import', label: 'Import Data' },
    { id: 'sync',   label: 'Data & privacy' },
    { id: 'ready',  label: 'Launch' },
  ];
  const idx = steps.findIndex(s => s.id === step);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-8" style={{ backgroundColor: 'rgba(11,9,17,0.62)', borderBottom: '1px solid rgba(167,139,250,0.16)', backdropFilter: 'blur(18px)' }}>
      <div className="flex items-center gap-4">
        <img src="./vesper-logo.png" alt="Vesper" className="w-10 h-10 rounded-lg" />
        <span className="text-[16px] font-bold" style={{ color: '#f1eff5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Vesper</span>
        <span className="text-[13px] px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>SETUP</span>
      </div>
      <div className="flex items-center gap-3 text-[15px]">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <span className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              s.id === step ? 'text-white' : i < idx ? 'text-[#9b94ab]' : 'text-[#6e6880]'
            }`} style={s.id === step ? { backgroundColor: '#1e1a2e', border: '1px solid rgba(139,92,246,0.4)', color: '#c084fc', fontFamily: 'system-ui, -apple-system, sans-serif' } : { fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {i < idx && <Check className="w-5 h-5 inline mr-2.5 text-[#34d399]" />}
              {s.id === step && <span className="inline-block w-2 h-2 rounded-full bg-[#8b5cf6] mr-2.5 animate-pulse" />}
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="text-[#2a2535] px-1.5" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>/</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-4 text-[14px]" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
        <span>Obsidian Kernel</span>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px]" style={{ backgroundColor: '#62259b', color: '#e9ddff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>V</div>
      </div>
    </header>
  );
};

const SetupFooter: React.FC<{ onBack?: () => void; onContinue: () => void; continueLabel?: string; disabled?: boolean; showContinue?: boolean }> = ({ onBack, onContinue, continueLabel = 'Continue', disabled = false, showContinue = true }) => (
  <footer className="fixed bottom-0 left-0 right-0 z-50 h-24 flex items-center justify-between px-8" style={{ backgroundColor: 'rgba(11,9,17,0.62)', borderTop: '1px solid rgba(167,139,250,0.16)', backdropFilter: 'blur(18px)' }}>
    {onBack ? (
      <button onClick={onBack} className="flex items-center gap-3 px-6 py-3 rounded-full text-[14px] font-semibold transition-colors" style={{ color: '#ded8ea', backgroundColor: 'rgba(27,23,36,0.74)', border: '1px solid rgba(206,190,230,0.16)', fontFamily: 'system-ui, -apple-system, sans-serif' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(56,43,76,0.82)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
        <ArrowLeft className="w-5 h-5" /> Back
      </button>
    ) : <div />}
    <div className="absolute right-8 flex items-center gap-4 text-[14px]" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <kbd className="px-3 py-1.5 rounded text-[13px]" style={{ backgroundColor: '#1a1721', border: '1px solid #252132', color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Esc</kbd>
      <span>to cancel setup</span>
    </div>
    {showContinue && <button
      onClick={onContinue}
      disabled={disabled}
      className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 px-10 py-3 rounded-full text-[14px] font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: 'linear-gradient(100deg, #a56aff 0%, #7c3aed 52%, #6420bb 100%)', boxShadow: '0 8px 28px rgba(139,92,246,0.42), inset 0 1px 0 rgba(255,255,255,0.28)', fontFamily: 'system-ui, -apple-system, sans-serif' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 10px 38px rgba(167,104,255,0.62), inset 0 1px 0 rgba(255,255,255,0.34)'; el.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 8px 28px rgba(139,92,246,0.42), inset 0 1px 0 rgba(255,255,255,0.28)'; el.style.transform = 'translateY(0)'; }}
    >
      {continueLabel}
      <kbd className="px-2.5 py-1 rounded-md text-[11px] bg-black/20 border border-white/20" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Space</kbd>
      <ArrowRight className="w-5 h-5" />
    </button>}
  </footer>
);

// ─── Screen 1: Search Engine ──────────────────────────────────────────────────
const SearchEngineStep: React.FC<{ selected: SearchEngine; onSelect: (s: SearchEngine) => void; onNext: () => void; onBack: () => void }> = ({ selected, onSelect, onNext, onBack }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  const engines: { id: SearchEngine; label: string; tag: string; desc: string; feature: string; num: number; domain: string }[] = [
    { id: 'duckduckgo', label: 'DuckDuckGo', tag: 'DDG://', desc: 'Tracker blocking & zero search history tracking built-in.', feature: 'Strict Isolation', num: 1, domain: 'duckduckgo.com' },
    { id: 'google',     label: 'Google Search', tag: 'WWW://', desc: 'Comprehensive web index with instant answers and maps.', feature: 'Global Reach', num: 2, domain: 'google.com' },
    { id: 'brave',      label: 'Brave Search', tag: 'NODE://', desc: 'Independent index, zero profiling, completely private queries.', feature: 'Decoupled Index', num: 3, domain: 'search.brave.com' },
  ];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Digit1') onSelect('duckduckgo');
      if (e.code === 'Digit2') onSelect('google');
      if (e.code === 'Digit3') onSelect('brave');
      if (e.code === 'Space') { e.preventDefault(); onNext(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="stitch-stage">
      <div className="stitch-window stitch-window--search">
        <div className="stitch-titlebar"><span className="stitch-brand"><img src="./vesper-logo.png" alt="" /> Vesper Browser Setup</span><span>STEP 1 OF 4</span></div>
        <section className="stitch-sidebar">
          <button className="stitch-back" onClick={onBack}><ArrowLeft size={18} /> Back</button>
          <div>
            <p className="stitch-kicker">SETUP</p>
            <h1>Pick your search engine.</h1>
            <p>Choose your default search engine. Fast, private, and customizable anytime in settings.</p>
          </div>
          <button className="stitch-primary" onClick={onNext}>Next <ArrowRight size={18} /></button>
        </section>
        <section className="stitch-choice-pane" aria-label="Choose a search engine">
          {engines.map(eng => {
            const active = selected === eng.id;
            return <button key={eng.id} onClick={() => onSelect(eng.id)} className={`stitch-choice ${active ? 'is-selected' : ''}`}>
              <span className="stitch-radio" />
              <span className="stitch-choice-label">{eng.label}{eng.id === 'duckduckgo' && <em>PRIVATE</em>}</span>
              <span className="stitch-choice-icon"><FavIcon domain={eng.domain} size={40} /></span>
            </button>;
          })}
          <p className="stitch-choice-note">You can add custom engines or change search shortcuts anytime in Settings.</p>
        </section>
      </div>
    </div>
  );

  return (
    <div className="graphite-setup-screen fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#160426' }}>
      <CinematicBackground sceneType="search" />

      <SetupNav step="search" />

      <main className="flex-1 flex flex-col items-center justify-center px-8 pt-24 pb-28 relative z-10">
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 500ms cubic-bezier(0.34,1.56,0.64,1) 100ms' }}>
          <div className="flex flex-col items-center text-center mb-14">
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-10" style={{ backgroundColor: 'rgba(26,23,33,0.8)', border: '1px solid #252132', backdropFilter: 'blur(8px)' }}>
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" />
              <span className="text-[13px] tracking-widest uppercase font-medium" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Phase 01 / 04</span>
              <span className="text-[13px]" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>• Query Pipeline</span>
            </div>
            <h1 className="text-[52px] font-bold tracking-tight mb-5" style={{ color: '#f1eff5', letterSpacing: '-0.02em', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Choose Your Search Engine</h1>
            <p className="text-[17px] max-w-lg leading-relaxed" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Select how you want to discover the web. You can change this at any time in settings.</p>
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
            {engines.map((eng, i) => {
              const active = selected === eng.id;
              return (
                <button
                  key={eng.id}
                  onClick={() => onSelect(eng.id)}
                  className="flex flex-col p-10 rounded-2xl text-left transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(43,29,65,0.63)' : 'rgba(23,20,32,0.48)',
                    border: active ? '2px solid rgba(180,130,255,0.56)' : '1px solid rgba(202,184,229,0.14)',
                    boxShadow: active ? '0 0 40px rgba(139,92,246,0.25)' : 'none',
                    backdropFilter: 'blur(20px)',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(16px)',
                    transition: `opacity 400ms ease ${200 + i*80}ms, transform 500ms cubic-bezier(0.34,1.56,0.64,1) ${200 + i*80}ms, background-color 150ms, border-color 150ms, box-shadow 150ms`,
                  }}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ backgroundColor: active ? 'rgba(139,92,246,0.2)' : '#1a1721' }}>
                      <FavIcon domain={eng.domain} size={64} />
                    </div>
                    {active && (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                        <span className="text-[13px] font-semibold" style={{ color: '#a78bfa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Privacy Recommended</span>
                        <Check className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-[26px] font-bold" style={{ color: active ? '#f1eff5' : '#c5c0d4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{eng.label}</span>
                    <span className="text-[14px]" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{eng.tag}</span>
                  </div>
                  <p className="text-[16px] leading-relaxed mb-8" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{eng.desc}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? '#8b5cf6' : '#3b3252' }} />
                      <span className="text-[15px]" style={{ color: active ? '#a78bfa' : '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{eng.feature}</span>
                    </div>
                    <span className="text-[16px] font-bold" style={{ color: '#3b3252', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{eng.num}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* DNS info bar */}
          <div className="max-w-3xl mx-auto mt-8 flex items-center justify-between px-8 py-5 rounded-xl" style={{ backgroundColor: 'rgba(20,17,29,0.52)', border: '1px solid rgba(202,184,229,0.16)', backdropFilter: 'blur(20px)', opacity: visible ? 1 : 0, transition: 'opacity 500ms ease 500ms' }}>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1a1721' }}>
                <Lock className="w-6 h-6" style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <p className="text-[15px] font-semibold" style={{ color: '#f1eff5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>DNS-over-HTTPS Encryption Active</p>
                <p className="text-[13px]" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Queries resolve via Vesper Secured Zero-Log Encrypted Resolvers</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[14px]" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <kbd className="px-3 py-1.5 rounded text-[13px]" style={{ backgroundColor: '#1a1721', border: '1px solid #252132', color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Press 1, 2, or 3</kbd>
              <span>to toggle</span>
            </div>
          </div>
        </div>
      </main>

      <SetupFooter onBack={onBack} onContinue={onNext} />
    </div>
  );
};

// ─── Screen 2: Import Data ────────────────────────────────────────────────────
const ImportDataStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [selectedBrowser, setSelectedBrowser] = useState<ImportBrowser>('chrome');
  const [detected, setDetected] = useState<{id:string;name:string;available:boolean;profiles:{name:string;bookmarkCount:number;historyCount:number}[]}[]>([]);
  const [importStatus, setImportStatus] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const { addBookmark, addHistoryItem } = useBrowserStore();
  useEffect(() => { void listImportBrowsers().then(rows => { setDetected(rows); const first = rows.find(r => r.profiles.some(profile => profile.bookmarkCount > 0)) ?? rows.find(r => r.available); if (first) setSelectedBrowser(first.id as ImportBrowser); }); }, []);
  const scanSelectedBrowser = async () => {
    setImportError(null);
    setImporting(true);
    setImportProgress(15);
    setImportStatus(`Scanning ${browsers.find(browser => browser.id === selectedBrowser)?.label ?? 'browser'}…`);
    try {
      await yieldToPaint();
      setImportProgress(65);
      const result = await scanImportBrowser(selectedBrowser);
      if (!result) {
        const message = 'Scanning is available in the Vesper desktop app.';
        setImportProgress(null); setImportStatus(message); setImportError(message); return;
      }
      setDetected(rows => rows.map(row => row.id === result.id ? result : row));
      const count = result.profiles.reduce((total, profile) => total + profile.bookmarkCount, 0);
      const historyCount = result.profiles.reduce((total, profile) => total + profile.historyCount, 0);
      setImportProgress(100);
      setImportStatus(
        !result.available
          ? 'Browser not found on this device. Import its exported bookmarks HTML file below.'
          : count === 0
            ? `Found ${result.profiles.length} profile(s), with ${historyCount} history entries but no readable bookmarks.`
            : `Found ${result.profiles.length} profile(s), ${count} bookmark(s), and ${historyCount} history entries.`
      );
      if (!result.available || (count === 0 && historyCount === 0)) {
        setImportError(!result.available
          ? `${result.name} was not found in its expected Windows data folder.`
          : `${result.name} was found, but it has no readable bookmarks. You can still import its browsing history, or export bookmarks as HTML from ${result.name}.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not scan the selected browser.';
      setImportProgress(null); setImportStatus(message); setImportError(message);
    }
    finally { setImporting(false); }
  };
  const yieldToPaint = () => new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
  const saveImportedBookmarks = async (items: { title: string; url: string; folder: string }[], source: string) => {
    const total = items.length;
    const batchSize = 50;
    for (let start = 0; start < total; start += batchSize) {
      items.slice(start, start + batchSize).forEach(item => addBookmark(item.url, item.title));
      const completed = Math.min(start + batchSize, total);
      setImportProgress(35 + Math.round((completed / total) * 65));
      setImportStatus(`Saving bookmarks to Vesper: ${completed} of ${total}`);
      await yieldToPaint();
    }
    setImportProgress(100);
    setImportStatus(`Imported ${total} bookmarks from ${source}.`);
    window.setTimeout(onNext, 700);
  };
  const saveImportedHistory = async (items: { title: string; url: string; visitedAt: number }[]) => {
    const total = items.length;
    const batchSize = 50;
    for (let start = 0; start < total; start += batchSize) {
      items.slice(start, start + batchSize).forEach(item => addHistoryItem(item));
      const completed = Math.min(start + batchSize, total);
      setImportProgress(35 + Math.round((completed / total) * 65));
      setImportStatus(`Saving browsing history: ${completed} of ${total}`);
      await yieldToPaint();
    }
  };
  const doImport = async () => {
    if (!importBookmarks && !importHistory) { onNext(); return; }
    const browser = detected.find(row => row.id === selectedBrowser && row.available);
    const profile = browser?.profiles.find(candidate => candidate.bookmarkCount > 0 || candidate.historyCount > 0);
    if (!browser || !profile) {
      const message = 'No bookmarks or browsing history were found in that browser profile.';
      setImportStatus(message); setImportError(message); return;
    }
    setImporting(true);
    setImportProgress(10);
    setImportStatus(`Opening ${browser.name} profile…`);
    try {
      await yieldToPaint();
      setImportProgress(30);
      setImportStatus(`Reading data from ${browser.name}…`);
      await yieldToPaint();
      if (importBookmarks && profile.bookmarkCount > 0) {
        const items = await importBrowserBookmarks(browser.id, profile.name);
        await saveImportedBookmarks(items, browser.name);
      }
      if (importHistory && profile.historyCount > 0) {
        setImportProgress(35);
        setImportStatus(`Reading browsing history from ${browser.name}…`);
        const items = await importBrowserHistory(browser.id, profile.name);
        await saveImportedHistory(items);
      }
      setImportProgress(100);
      setImportStatus(`Imported data from ${browser.name}.`);
      window.setTimeout(onNext, 700);
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed.';
      setImportStatus(message); setImportError(message);
    }
    finally { setImporting(false); }
  };
  const importExportedBookmarks = async () => {
    setImportError(null);
    setImporting(true);
    setImportProgress(10);
    setImportStatus('Choose a bookmarks HTML export…');
    try {
      await yieldToPaint();
      setImportProgress(30);
      setImportStatus('Reading exported bookmarks…');
      const items = await importBookmarksHtml();
      if (!items.length) { setImportProgress(null); setImportStatus('No bookmarks were imported.'); return; }
      await saveImportedBookmarks(items, 'the exported file');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed.';
      setImportStatus(message); setImportError(message);
    } finally { setImporting(false); }
  };
  const [importBookmarks, setImportBookmarks] = useState(true);
  const [importHistory, setImportHistory] = useState(true);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  const browsers: { id: ImportBrowser; label: string; badge?: string; desc: string; domain: string }[] = [
    { id: 'chrome', label: 'Google Chrome', desc: 'Chromium bookmarks from a local profile', domain: 'google.com/chrome' },
    { id: 'arc',    label: 'Arc Browser', desc: 'Profile import where a Chromium bookmark file is available', domain: 'arc.net' },
    { id: 'brave',  label: 'Brave Browser', desc: 'Chromium bookmarks from a local profile', domain: 'brave.com' },
    { id: 'edge',   label: 'Microsoft Edge', desc: 'Chromium bookmarks from a local profile', domain: 'microsoft.com' },
  ];

  const Toggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="relative shrink-0 transition-all"
      style={{ width: 48, height: 26, borderRadius: 13, backgroundColor: active ? '#7c3aed' : '#27272a', boxShadow: active ? '0 0 10px rgba(139,92,246,0.4)' : 'none', transition: 'all 200ms' }}>
      <span style={{ position:'absolute', top: 4, left: active ? 24 : 4, width: 18, height: 18, borderRadius: '50%', backgroundColor: 'white', transition: 'left 200ms cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );

  const Checkbox = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <div onClick={onToggle} className="w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-all shrink-0"
      style={{ backgroundColor: active ? '#7c3aed' : '#1a1721', border: `2px solid ${active ? '#8b5cf6' : '#3b3252'}`, boxShadow: active ? '0 0 8px rgba(139,92,246,0.4)' : 'none' }}>
      {active && <Check className="w-4 h-4 text-white" />}
    </div>
  );

  return (
    <div className="stitch-stage">
      <div className="stitch-window stitch-window--search">
        <div className="stitch-titlebar"><span className="stitch-brand"><img src="./vesper-logo.png" alt="" /> Vesper Browser Setup</span><span>STEP 2 OF 4</span></div>
        <section className="stitch-sidebar">
          <button className="stitch-back" onClick={onBack}><ArrowLeft size={18} /> Back</button>
          <div><p className="stitch-kicker">DATA MIGRATION</p><h1>Bring your browser with you.</h1><p>Import bookmarks and recent browsing history directly from a local browser profile.</p></div>
          <button className="stitch-primary" onClick={() => void doImport()} disabled={importing}>{importing ? 'Importing…' : 'Continue'} <ArrowRight size={18} /></button>
        </section>
        <section className="stitch-choice-pane" aria-label="Choose a browser to import">
          {browsers.map(browser => {
            const profileCount = detected.find(row => row.id === browser.id)?.profiles.reduce((sum, profile) => sum + profile.bookmarkCount + profile.historyCount, 0) ?? 0;
            return <button key={browser.id} onClick={() => setSelectedBrowser(browser.id)} className={`stitch-choice ${selectedBrowser === browser.id ? 'is-selected' : ''}`}>
              <span className="stitch-radio" /><span className="stitch-choice-label">{browser.label}{profileCount > 0 && <em>{profileCount} FOUND</em>}</span><span className="stitch-choice-icon"><FavIcon domain={browser.domain} size={40} /></span>
            </button>;
          })}
          <div className="stitch-import-actions"><button onClick={() => void scanSelectedBrowser()}>Scan selected browser</button><label><input type="checkbox" checked={importBookmarks} onChange={() => setImportBookmarks(!importBookmarks)} /> Bookmarks</label><label><input type="checkbox" checked={importHistory} onChange={() => setImportHistory(!importHistory)} /> History</label></div>
          {importStatus && <p className="stitch-choice-note">{importStatus}</p>}
          <button className="stitch-link" onClick={() => void importExportedBookmarks()}>Import an exported bookmarks HTML file</button>
        </section>
      </div>
      {importError && <div className="stitch-error" role="alert"><strong>Import needs attention</strong><span>{importError}</span><button onClick={() => setImportError(null)}>Close</button></div>}
    </div>
  );

  return (
    <div className="graphite-setup-screen fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#160426' }}>
      <CinematicBackground sceneType="import" />

      <SetupNav step="import" />

      <main className="flex-1 flex items-center justify-center px-8 pt-24 pb-28 relative z-10">
        <div
          className="w-full max-w-2xl rounded-2xl p-10"
          style={{
            backgroundColor: 'rgba(20,17,29,0.62)',
            border: '1px solid rgba(202,184,229,0.16)',
            backdropFilter: 'blur(22px)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 500ms cubic-bezier(0.34,1.56,0.64,1) 100ms',
          }}
        >
          {/* Step label */}
          <div className="flex items-center justify-center gap-2.5 mb-10">
            <span className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" />
            <span className="text-[13px] tracking-widest uppercase font-medium" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Step 02 of 04</span>
            <span style={{ color: '#3b3252' }}>•</span>
            <span className="text-[13px]" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Migration Engine</span>
          </div>

          {/* Icon + heading */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#1a1721', border: '1px solid #252132' }}>
              <svg className="w-10 h-10" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            </div>
            <h1 className="text-[36px] font-bold mb-4" style={{ color: '#f1eff5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Import From Your Existing Browser</h1>
            <p className="text-[16px] leading-relaxed" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Import bookmarks from a detected local browser profile. History and passwords are not imported yet.</p>
          </div>

          {/* Browser list */}
          <div className="flex flex-col gap-4 mb-8">
            {browsers.map((b, i) => {
              const active = selectedBrowser === b.id;
              return (
                <div key={b.id} onClick={() => setSelectedBrowser(b.id)}
                  className="flex items-center gap-5 px-6 py-5 rounded-xl cursor-pointer transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(26,22,40,0.9)' : 'rgba(15,15,21,0.7)',
                    border: active ? '1px solid rgba(139,92,246,0.4)' : '1px solid #1e1a2b',
                    backdropFilter: 'blur(8px)',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateX(0)' : 'translateX(-12px)',
                    transition: `opacity 400ms ease ${200 + i*60}ms, transform 400ms cubic-bezier(0.34,1.56,0.64,1) ${200 + i*60}ms, background-color 150ms, border-color 150ms`,
                  }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#1a1721' }}>
                    <FavIcon domain={b.domain} size={40} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-[16px] font-semibold" style={{ color: '#f1eff5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{b.label}</span>
                      {(detected.find(row => row.id === b.id)?.available) && (
                        <span className="text-[13px] px-3 py-1 rounded font-semibold" style={{ backgroundColor: active ? 'rgba(139,92,246,0.15)' : '#1a1721', color: active ? '#a78bfa' : '#6e6880', border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : '#252132'}`, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          Detected · {detected.find(row => row.id === b.id)?.profiles.reduce((total, profile) => total + profile.bookmarkCount, 0)} bookmarks · {detected.find(row => row.id === b.id)?.profiles.reduce((total, profile) => total + profile.historyCount, 0)} history
                        </span>
                      )}
                    </div>
                    <p className="text-[14px]" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{b.desc}</p>
                  </div>
                  <Toggle active={active} onToggle={() => setSelectedBrowser(b.id)} />
                </div>
              );
            })}
          </div>

          <button
            className="w-full h-11 rounded-full text-[14px] font-bold text-white transition-all mb-6 disabled:opacity-60"
            style={{ background: 'linear-gradient(100deg, #a56aff 0%, #7c3aed 52%, #6420bb 100%)', border: '1px solid rgba(231,219,255,0.30)', boxShadow: '0 7px 22px rgba(124,58,237,0.32), inset 0 1px 0 rgba(255,255,255,0.25)' }}
            onClick={() => void scanSelectedBrowser()}
            disabled={importing}
          >
            {importing ? 'Scanning…' : `Scan selected ${browsers.find(browser => browser.id === selectedBrowser)?.label ?? 'browser'}`}
          </button>
          {(importStatus || importProgress !== null) && (
            <div className="mb-6 rounded-xl px-4 py-3" style={{ backgroundColor: '#171321', border: '1px solid #312545' }}>
              <div className="flex items-center justify-between text-[13px]" style={{ color: '#ddd6fe' }}>
                <span>{importStatus}</span>
                {importProgress !== null && <span className="ml-4 shrink-0">{importProgress}%</span>}
              </div>
              {importProgress !== null && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: '#2a2238' }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={importProgress ?? undefined}>
                  <div className="h-full rounded-full transition-all duration-200" style={{ width: `${importProgress}%`, background: 'linear-gradient(90deg, #8b5cf6, #c4b5fd)' }} />
                </div>
              )}
            </div>
          )}

          {/* Data items */}
          <div className="mb-8" style={{ borderTop: '1px solid #1e1a2b', paddingTop: 28 }}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Select Data Items to Transfer</span>
              <span className="text-[14px]" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{[importBookmarks, importHistory].filter(Boolean).length} items selected</span>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Import bookmarks', info: 'From selected profile', active: importBookmarks, toggle: () => setImportBookmarks(!importBookmarks) },
                { label: 'Import browsing history', info: 'Up to 5,000 recent entries', active: importHistory, toggle: () => setImportHistory(!importHistory) },
              ].map((item, i) => (
                <div key={item.label} onClick={item.toggle} className="flex items-center gap-5 cursor-pointer"
                  style={{ opacity: visible ? 1 : 0, transition: `opacity 400ms ease ${450 + i*60}ms` }}>
                  <Checkbox active={item.active} onToggle={item.toggle} />
                  <span className="flex-1 text-[15px] font-medium" style={{ color: item.active ? '#f1eff5' : '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{item.label}</span>
                  <span className="text-[14px]" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{item.info}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-4 p-5 rounded-xl mb-6" style={{ backgroundColor: 'rgba(15,15,21,0.7)', border: '1px solid #1e1a2b', backdropFilter: 'blur(8px)' }}>
            <Shield className="w-6 h-6 shrink-0" style={{ color: '#8b5cf6' }} />
            <p className="text-[14px] leading-relaxed" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Imports are read locally from browser bookmark files. Passwords are never read or copied by Vesper.</p>
          </div>

          <button className="w-full text-center text-[15px] transition-colors py-3" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }} onClick={onNext}>
            Start fresh without importing
          </button>
          <button className="w-full text-center text-[14px] transition-colors py-2" style={{ color: '#a78bfa', fontFamily: 'system-ui, -apple-system, sans-serif' }} onClick={() => void importExportedBookmarks()} disabled={importing}>
            Import an exported bookmarks HTML file
          </button>
        </div>
      </main>

      <SetupFooter onBack={onBack} onContinue={() => void doImport()} continueLabel={importing ? 'Importing…' : 'Import bookmarks'} disabled={importing} />
      {importError && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(5px)' }} role="alertdialog" aria-modal="true" aria-labelledby="import-error-title">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#17121f', border: '1px solid #7645a6', boxShadow: '0 24px 64px rgba(0,0,0,0.55)' }}>
            <h2 id="import-error-title" className="text-lg font-semibold" style={{ color: '#f1eff5' }}>Import needs attention</h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#c5bdd1' }}>{importError}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setImportError(null)} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ color: '#ddd6fe', backgroundColor: '#2a2137', border: '1px solid #4a3763' }}>Close</button>
              <button onClick={() => { setImportError(null); void importExportedBookmarks(); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: '#7c3aed' }}>Choose HTML file</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Screen 3: Local data ─────────────────────────────────────────────────────
const CloudSyncStep: React.FC<{ onNext: (synced: boolean) => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [visible, setVisible] = useState(false);
  const [shieldEnabled, setShieldEnabled] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  return (
    <div className="stitch-stage">
      <div className="stitch-window stitch-window--shield">
        <section className="stitch-sidebar">
          <button className="stitch-back" onClick={onBack}><ArrowLeft size={18} /> Back</button>
          <div><p className="stitch-kicker">PROTECTION SETUP</p><h1>Block ads and trackers?</h1><p>Vesper comes with built-in strict shield protection, blocking trackers, fingerprinting, and invasive ads for faster browsing.</p></div>
          <div><button className="stitch-primary" onClick={() => onNext(false)}>Next <ArrowRight size={18} /></button><p className="stitch-step-note">STEP 3 OF 4 · You can modify this in Settings later</p></div>
        </section>
        <section className="stitch-shield-pane">
          <button onClick={() => setShieldEnabled(true)} className={`stitch-shield-option ${shieldEnabled ? 'is-selected' : ''}`}><span className="stitch-radio" /><span><strong>YES, block ads &amp; trackers for me.</strong><em>RECOMMENDED</em><p>Stops scripts from profiling your web activity while reducing bandwidth usage.</p><small>✓ uBlock-grade engine &nbsp;&nbsp; ✓ Blocks malicious scripts &nbsp;&nbsp; ✓ Faster loads</small></span></button>
          <button onClick={() => setShieldEnabled(false)} className={`stitch-shield-option ${!shieldEnabled ? 'is-selected' : ''}`}><span className="stitch-radio" /><span><strong>NO, standard protection.</strong><p>Allow non-intrusive ads and trackers to support websites by default.</p></span></button>
          <div className="stitch-shield-status"><Shield size={20} /> <strong>Strict Local Shield</strong><span>•</span><span>Zero Telemetry Sent</span><code>Native protection</code></div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="graphite-setup-screen fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#160426' }}>
      <CinematicBackground sceneType="sync" />

      <SetupNav step="sync" />

      <main className="flex-1 flex flex-col items-center justify-center px-8 pt-24 pb-28 relative z-10">
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 500ms cubic-bezier(0.34,1.56,0.64,1) 100ms' }}>
          <div className="flex flex-col items-center text-center mb-12">
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8" style={{ backgroundColor: 'rgba(26,23,33,0.8)', border: '1px solid #252132', backdropFilter: 'blur(8px)' }}>
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" />
              <span className="text-[13px] tracking-widest uppercase font-medium" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Step 03 / 04 • Local data</span>
            </div>
            <h1 className="text-[44px] font-bold tracking-tight mb-5" style={{ color: '#f1eff5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Stay on this device</h1>
            <p className="text-[17px] max-w-lg leading-relaxed" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Vesper profiles and browsing data stay on this device. There is no Vesper account or cloud sync yet. Website sign-in works normally inside browser tabs.</p>
          </div>

          <div className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(20,17,29,0.62)', border: '1px solid rgba(202,184,229,0.16)', backdropFilter: 'blur(22px)' }}>
            <div className="p-8">
              <button
                onClick={() => onNext(false)}
                className="w-full flex items-center justify-between p-6 rounded-xl transition-all group"
                style={{ backgroundColor: '#1a1721', border: '1px solid #252132' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3b3252'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#252132'; }}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#27272a' }}>
                    <Lock className="w-7 h-7" style={{ color: '#9b94ab' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-[17px] font-semibold" style={{ color: '#f1eff5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Continue</p>
                    <p className="text-[14px] leading-relaxed" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Keep all data 100% on your device. Zero telemetry, zero external servers, pure local privacy.</p>
                    <div className="flex gap-2.5 mt-4">
                      {['Local profile', 'No Vesper account'].map(tag => (
                        <span key={tag} className="text-[13px] px-3 py-1.5 rounded font-medium" style={{ backgroundColor: '#1a1721', color: '#9b94ab', border: '1px solid #252132', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform shrink-0" style={{ color: '#9b94ab' }} />
              </button>
            </div>

            <div className="mx-8 mb-8 px-6 py-5 rounded-xl flex items-center gap-4 text-[14px]" style={{ backgroundColor: 'rgba(15,15,21,0.7)', border: '1px solid #1e1a2b', backdropFilter: 'blur(8px)' }}>
              <Shield className="w-6 h-6 shrink-0" style={{ color: '#8b5cf6' }} />
              <span style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Tabs and bookmarks stay on this PC. Website logins happen on the site.</span>
            </div>
          </div>
        </div>
      </main>

      <SetupFooter onBack={onBack} onContinue={() => onNext(false)} />
    </div>
  );
};

// ─── Screen 4: Ready to Launch ────────────────────────────────────────────────
const ReadyStep: React.FC<{ searchEngine: SearchEngine; onLaunch: () => void; onBack: () => void }> = ({ searchEngine, onLaunch, onBack }) => {
  const [setDefault, setSetDefault] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); onLaunch(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const searchLabels: Record<SearchEngine, string> = { duckduckgo: 'DuckDuckGo Encrypted', google: 'Google Search', brave: 'Brave Search' };

  return (
    <div className="stitch-finale">
      <div className="stitch-finale__top"><span>● VESPER CORE</span><span>STEP 4 OF 4 &nbsp; • &nbsp; Setup Complete — All Set</span></div>
      <main>
        <img src="./vesper-logo.png" alt="Vesper" />
        <h1>We're glad you chose us!</h1><h2>Enjoy our browser.</h2>
        <p><strong>We care about your privacy.</strong> Designed from the ground up with zero telemetry, tracker neutralization, and total ownership over your data.</p>
        <button onClick={onLaunch}>Start Browsing <ArrowRight size={19} /></button>
        <small>Your private browsing session is ready to launch</small>
      </main>
      <footer><span>◉ Imported browser data stays on this device</span><span>Press <kbd>ENTER</kbd> or <kbd>SPACE</kbd> to launch</span><span>Finish <kbd>Esc</kbd></span></footer>
    </div>
  );

  return (
    <div className="graphite-setup-screen fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#160426' }}>
      <CinematicBackground sceneType="ready" />

      <SetupNav step="ready" />

      <main className="flex-1 flex flex-col items-center justify-center px-8 pt-24 pb-28 relative z-10">
        <div className="w-full max-w-2xl" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 500ms cubic-bezier(0.34,1.56,0.64,1) 100ms' }}>
          <div className="flex flex-col items-center text-center mb-12">
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8" style={{ backgroundColor: 'rgba(26,23,33,0.8)', border: '1px solid #252132', backdropFilter: 'blur(8px)' }}>
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
              <span className="text-[13px] tracking-widest uppercase font-medium" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Stage 04 / 04</span>
              <span style={{ color: '#3b3252' }}>•</span>
              <span className="text-[13px]" style={{ color: '#34d399', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Initialization Complete</span>
            </div>
            <h1 className="text-[48px] font-bold tracking-tight mb-5" style={{ color: '#f1eff5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Vesper is Ready</h1>
            <p className="text-[17px] leading-relaxed" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Your environment has been configured.<br/>Fast, distraction-free, and private by design.</p>
          </div>

          {/* Summary card */}
          <div className="rounded-2xl overflow-hidden mb-8" style={{ backgroundColor: 'rgba(20,17,29,0.62)', border: '1px solid rgba(202,184,229,0.16)', backdropFilter: 'blur(22px)' }}>
            {/* Header */}
            <div className="flex items-center gap-6 p-8" style={{ borderBottom: '1px solid #1e1a2b' }}>
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#1a1721', border: '1px solid #252132' }}>
                <img src="./vesper-logo.png" alt="Vesper" className="w-16 h-16 rounded-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-3">
                  <Check className="w-6 h-6" style={{ color: '#34d399' }} />
                  <span className="text-[16px] font-semibold" style={{ color: '#f1eff5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Obsidian Core Active</span>
                </div>
                <p className="text-[14px] mb-4 leading-relaxed" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Zero telemetric background pings. Sandboxed local execution layers enabled across all isolated browser workspaces.</p>
                <div className="flex flex-wrap gap-2.5">
                  {['Local profile', 'Tracker blocking', 'Private by default'].map(t => (
                    <span key={t} className="text-[13px] px-3 py-1.5 rounded font-medium" style={{ backgroundColor: '#1a1721', color: '#9b94ab', border: '1px solid #252132', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{t}</span>
                  ))}
                </div>
              </div>
              <span className="text-[13px] shrink-0" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>v1.0.4</span>
            </div>

            {/* Config grid */}
            <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: '#1e1a2b' }}>
              {[
                { label: 'Default Search', value: searchLabels[searchEngine] },
                { label: 'Data Migration', value: 'Bookmarks & History Loaded' },
                { label: 'Storage', value: 'Local on this device' },
                { label: 'Runtime Pipeline', value: 'Chromium V8 Accelerated' },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-5 p-6" style={{ backgroundColor: 'rgba(20,17,29,0.54)', border: '1px solid rgba(202,184,229,0.11)', backdropFilter: 'blur(18px)', opacity: visible ? 1 : 0, transition: `opacity 400ms ease ${250 + i*60}ms` }}>
                  <Check className="w-6 h-6 shrink-0" style={{ color: '#8b5cf6' }} />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{item.label}</p>
                    <p className="text-[16px] font-semibold truncate" style={{ color: '#f1eff5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Set as default */}
            <div onClick={() => setSetDefault(!setDefault)} className="flex items-center gap-6 p-8 cursor-pointer transition-colors" style={{ borderTop: '1px solid #1e1a2b' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(22,20,31,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
              <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 transition-all"
                style={{ backgroundColor: setDefault ? '#7c3aed' : '#1a1721', border: `2px solid ${setDefault ? '#8b5cf6' : '#3b3252'}` }}>
                {setDefault && <Check className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-semibold mb-1.5" style={{ color: '#f1eff5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Set Vesper as my default system browser</p>
                <p className="text-[14px]" style={{ color: '#9b94ab', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Direct all incoming web links into your hardened workspace</p>
              </div>
              <span className="text-[13px] px-3 py-1.5 rounded font-semibold shrink-0" style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>⚡ Recommended</span>
            </div>
          </div>

          {/* Launch button */}
          <div className="flex flex-col items-center gap-6" style={{ opacity: visible ? 1 : 0, transition: 'opacity 500ms ease 600ms' }}>
            <button
              onClick={onLaunch}
              className="flex items-center gap-5 px-14 py-6 rounded-2xl text-[18px] font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 0 50px rgba(139,92,246,0.5)', minWidth: 340, justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 0 70px rgba(139,92,246,0.7)'; el.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 0 50px rgba(139,92,246,0.5)'; el.style.transform = 'scale(1)'; }}
            >
              Enter Vesper
              <kbd className="px-3 py-1.5 rounded text-[14px] bg-white/20" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Enter</kbd>
              <ArrowRight className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-6 text-[14px]" style={{ color: '#6e6880', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <button className="hover:text-[#9b94ab] transition-colors">⌨ Open keyboard shortcut cheatsheet</button>
              <span>•</span>
              <button className="hover:text-[#9b94ab] transition-colors">≡ Fine-tune flags</button>
            </div>
          </div>
        </div>
      </main>

      <SetupFooter onBack={onBack} onContinue={onLaunch} showContinue={false} />
    </div>
  );
};

// ─── Main Orchestrator ────────────────────────────────────────────────────────
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { updateSettings, createTab } = useBrowserStore();
  const [screen, setScreen] = useState<Screen>('cinematic');
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('duckduckgo');


  const finish = () => {
    updateSettings({ defaultSearchEngine: searchEngine });
    localStorage.setItem('vesper_onboarding_done', '1');
    createTab('vesper://newtab');
    onComplete();
  };

  return (
    <>
      {screen === 'cinematic' && (
        <CinematicReveal
          onEnter={() => setScreen('search')}
          onSkip={finish}
        />
      )}
      {screen === 'search' && (
        <SearchEngineStep
          selected={searchEngine}
          onSelect={setSearchEngine}
          onNext={() => setScreen('import')}
          onBack={() => setScreen('cinematic')}
        />
      )}
      {screen === 'import' && (
        <ImportDataStep
          onNext={() => setScreen('sync')}
          onBack={() => setScreen('search')}
        />
      )}
      {screen === 'sync' && (
        <CloudSyncStep
          onNext={() => setScreen('ready')}
          onBack={() => setScreen('import')}
        />
      )}
      {screen === 'ready' && (
        <ReadyStep
          searchEngine={searchEngine}
          onLaunch={finish}
          onBack={() => setScreen('sync')}
        />
      )}
    </>
  );
};
