import * as THREE from 'three';
import stageW5Url from '../assets/images/fetal_stage_w5_1795192142365.jpg';
import stageW9Url from '../assets/images/fetal_stage_w9_1795192142078.jpg';
import stageW14Url from '../assets/images/fetal_stage_w14_1795192141536.jpg';
import stageW20Url from '../assets/images/fetal_stage_w20_1795192140591.jpg';
import stageW28Url from '../assets/images/fetal_stage_w28_1795192141832.jpg';
import stageW38Url from '../assets/images/fetal_stage_w38_1795192140115.jpg';
import { FetalStageBlend } from '../utils/fetalStages';

export const FETAL_STAGE_IMAGE_URLS: string[] = [
  stageW5Url,
  stageW9Url,
  stageW14Url,
  stageW20Url,
  stageW28Url,
  stageW38Url,
];

export interface PhotorealStageOptions {
  highlightInternal: boolean;
  isPlaying: boolean;
  tiltX: number; // -1..1 interactive horizontal 3D tilt
  tiltY: number; // -1..1 interactive vertical 3D tilt
  userZoom: number; // 0.85..1.45 interactive zoom
}

export interface FetalPhotorealStage {
  group: THREE.Group;
  update: (
    elapsedSec: number,
    dt: number,
    stageBlend: FetalStageBlend,
    bpm: number | null,
    options: PhotorealStageOptions,
    viewportAspect: number
  ) => void;
  dispose: () => void;
}

const _dummy = new THREE.Object3D();

/**
 * Generates a soft luminous amniotic floating bokeh particle sprite procedurally.
 */
function createMoteSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0.0, 'rgba(255, 250, 240, 0.92)');
  grad.addColorStop(0.42, 'rgba(250, 228, 200, 0.44)');
  grad.addColorStop(1.0, 'rgba(244, 214, 184, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a warm fallback 1x1 cream-amber texture while images finish decoding.
 */
function createWarmPlaceholderTexture(): THREE.DataTexture {
  const data = new Uint8Array([232, 210, 186, 255]);
  const tex = new THREE.DataTexture(data, 1, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uPlayWeight;
  uniform vec2 uTilt;
  uniform vec2 uBodyCenter;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Subtle spherical 3D curvature around the baby center so interactive tilt creates organic 3D volume
    vec2 centered = uv - uBodyCenter;
    float radial = length(centered * vec2(1.45, 1.0));
    float dome = exp(-radial * radial * 4.5);

    // Gentle amniotic wave & breathing relief
    float breath = sin(uTime * 1.45) * 0.022 * uPlayWeight;
    float ripple = sin(uv.x * 5.2 + uTime * 0.9) * cos(uv.y * 4.4 - uTime * 0.75) * 0.012 * uPlayWeight;

    pos.z += dome * (0.14 + breath) + ripple;
    pos.x += uTilt.x * dome * 0.055;
    pos.y += uTilt.y * dome * 0.045;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uBlend;
  uniform float uTime;
  uniform float uPlayWeight;
  uniform float uZoom;
  uniform vec2 uTilt;
  uniform vec2 uBodyCenter;
  uniform vec2 uHeartUv;
  uniform float uHeartbeat;
  uniform float uInternalMode;
  uniform vec2 uCoverScale;

  // Computes organic luminance-based depth parallax + living breathing deformation
  vec2 computeAnimatedUv(vec2 baseUv, float depthWeight) {
    // Aspect-preserving cover mapping so 16:9 medical photography fills any card ratio with zero stretching
    vec2 uv = (baseUv - 0.5) * uCoverScale + 0.5;

    // Apply smooth daily growth zoom & user interactive zoom around baby center
    uv = (uv - uBodyCenter) / max(0.75, uZoom) + uBodyCenter;

    // Gentle weightless floating bob & subtle amniotic fluid sway
    float floatY = sin(uTime * 0.85) * 0.011 * uPlayWeight;
    float floatX = cos(uTime * 0.58) * 0.007 * uPlayWeight;
    uv += vec2(floatX, floatY);

    // Subtle living chest/body breathing expansion
    vec2 dBody = uv - uBodyCenter;
    float bodyDist = length(dBody * vec2(1.4, 1.0));
    float bodyMask = exp(-bodyDist * bodyDist * 5.2);
    float breathExpand = sin(uTime * 1.45) * 0.014 * uPlayWeight;
    uv -= dBody * breathExpand * bodyMask;

    // Gentle umbilical/amniotic micro-drift toward edges
    float edgeRipple = sin(uv.y * 7.5 + uTime * 1.15) * 0.0038 * uPlayWeight * (1.0 - bodyMask * 0.5);
    uv.x += edgeRipple;

    // Interactive 3D parallax offset (foreground baby shifts slightly relative to soft background)
    uv += uTilt * (0.022 * depthWeight - 0.006);

    return clamp(uv, vec2(0.002), vec2(0.998));
  }

  void main() {
    // First pass sample to estimate foreground baby silhouette vs bright cream background for 3D parallax
    vec2 roughUv = computeAnimatedUv(vUv, 0.5);
    vec4 roughA = texture2D(uTexA, roughUv);
    vec4 roughB = texture2D(uTexB, roughUv);
    vec3 roughCol = mix(roughA.rgb, roughB.rgb, uBlend);

    // Baby silhouette is warmer/richer than the luminous cream-beige backdrop -> estimate soft 3D depth relief
    float chromaWarmth = clamp((roughCol.r - roughCol.b) * 2.2, 0.0, 1.0);
    float luma = dot(roughCol, vec3(0.299, 0.587, 0.114));
    float fgMask = clamp((1.0 - smoothstep(0.55, 0.90, luma)) * 0.85 + chromaWarmth * 0.35, 0.0, 1.0);

    // Final parallax-displaced dual-texture crossfade
    vec2 finalUv = computeAnimatedUv(vUv, fgMask);
    vec3 colA = texture2D(uTexA, finalUv).rgb;
    vec3 colB = texture2D(uTexB, finalUv).rgb;
    vec3 col = mix(colA, colB, uBlend);

    // Subtle sunlit warm amniotic caustic shimmer drifting across the stage
    float caustic = sin((vUv.x * 4.5 + vUv.y * 3.0) + uTime * 0.65)
                  * cos((vUv.x * 3.2 - vUv.y * 4.1) - uTime * 0.48);
    col += vec3(0.045, 0.032, 0.018) * max(0.0, caustic) * (0.45 + 0.55 * uPlayWeight);

    // Synchronized lub-dub heartbeat warm internal glow right over the baby's heart position
    vec2 dHeart = (finalUv - uHeartUv) * vec2(1.77, 1.0);
    float heartDist = length(dHeart);
    float corePulse = exp(-heartDist * heartDist * 190.0);
    float haloPulse = exp(-heartDist * heartDist * 34.0);

    // Always gently alive when heartbeat exists; dramatically illuminated in Internal Glow mode
    float beatStrength = uHeartbeat * (0.16 + 0.68 * uInternalMode);
    vec3 heartCoreColor = vec3(1.0, 0.30, 0.24) * corePulse * (beatStrength * 1.15 + uInternalMode * 0.28);
    vec3 heartHaloColor = vec3(0.95, 0.36, 0.22) * haloPulse * (beatStrength * 0.42 + uInternalMode * 0.22);

    // Internal Glow mode enhances translucent backlit subsurface contrast
    if (uInternalMode > 0.01) {
      vec3 glowTint = vec3(
        pow(max(col.r, 0.001), 0.88) * 1.05,
        pow(max(col.g, 0.001), 1.08) * 0.88,
        pow(max(col.b, 0.001), 1.16) * 0.80
      );
      col = mix(col, glowTint, uInternalMode * 0.65 * fgMask);
    }

    col += heartCoreColor + heartHaloColor;

    // Gentle warm lens vignette so edges frame the baby intimately
    vec2 vigUv = vUv - 0.5;
    float vig = 1.0 - dot(vigUv, vigUv) * 0.32;
    col *= clamp(vig, 0.78, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * Creates the photorealistic animated 3D volumetric fetal development stage:
 * - 6 hyper-realistic medical CGI stages crossfaded smoothly day-by-day
 * - Depth-aware 3D parallax & interactive drag-to-tilt volumetric curvature
 * - Organic breathing, floating amniotic sway, synchronized lub-dub heart glow
 * - 3D InstancedMesh drifting golden-cream amniotic bokeh particles
 */
export function createFetalPhotorealStage(
  maxAnisotropy: number,
  onTextureReady?: () => void
): FetalPhotorealStage {
  const group = new THREE.Group();
  const placeholderTex = createWarmPlaceholderTexture();
  const moteTex = createMoteSpriteTexture();

  const loader = new THREE.TextureLoader();
  const stageTextures: THREE.Texture[] = FETAL_STAGE_IMAGE_URLS.map(() => placeholderTex);
  const ownedTextures: THREE.Texture[] = [placeholderTex, moteTex];

  FETAL_STAGE_IMAGE_URLS.forEach((url, idx) => {
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = Math.max(1, maxAnisotropy);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        stageTextures[idx] = tex;
        ownedTextures.push(tex);
        onTextureReady?.();
      },
      undefined,
      () => {
        // Keep warm placeholder if decode fails
      }
    );
  });

  const uniforms = {
    uTexA: { value: stageTextures[1] as THREE.Texture },
    uTexB: { value: stageTextures[1] as THREE.Texture },
    uBlend: { value: 0.0 },
    uTime: { value: 0.0 },
    uPlayWeight: { value: 1.0 },
    uZoom: { value: 1.0 },
    uTilt: { value: new THREE.Vector2(0, 0) },
    uBodyCenter: { value: new THREE.Vector2(0.51, 0.48) },
    uHeartUv: { value: new THREE.Vector2(0.51, 0.34) },
    uHeartbeat: { value: 0.0 },
    uInternalMode: { value: 0.0 },
    uCoverScale: { value: new THREE.Vector2(1, 1) },
  };

  // Subdivided volumetric plane scaled dynamically to fill the frustum cleanly
  const planeGeo = new THREE.PlaneGeometry(4.4, 2.475, 40, 28);
  const planeMat = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    depthWrite: true,
    depthTest: true,
  });
  const stageMesh = new THREE.Mesh(planeGeo, planeMat);
  group.add(stageMesh);

  // Floating 3D amniotic light motes in front of the baby for genuine parallax depth
  const moteCount = 38;
  const moteGeo = new THREE.PlaneGeometry(0.085, 0.085);
  const moteMat = new THREE.MeshBasicMaterial({
    map: moteTex,
    transparent: true,
    opacity: 0.56,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const motes = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
  motes.frustumCulled = false;
  group.add(motes);

  interface MoteSeed {
    x: number;
    y: number;
    z: number;
    scale: number;
    speed: number;
    phase: number;
  }
  const moteSeeds: MoteSeed[] = [];
  let seed = 7331;
  const nextRand = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < moteCount; i++) {
    moteSeeds.push({
      x: (nextRand() - 0.5) * 4.2,
      y: (nextRand() - 0.5) * 2.3,
      z: 0.22 + nextRand() * 0.72,
      scale: 0.45 + nextRand() * 1.15,
      speed: 0.25 + nextRand() * 0.45,
      phase: nextRand() * Math.PI * 2,
    });
  }

  // Smooth runtime state
  let smoothBlend = 0;
  let smoothZoom = 1;
  let smoothInternal = 0;
  let smoothPlayWeight = 1;
  let smoothTiltX = 0;
  let smoothTiltY = 0;
  let smoothHeartX = 0.51;
  let smoothHeartY = 0.34;
  let smoothCenterX = 0.51;
  let smoothCenterY = 0.48;
  let prevLowerIdx = -1;
  let prevUpperIdx = -1;
  let initialized = false;

  const IMAGE_ASPECT = 16 / 9;

  function update(
    elapsedSec: number,
    dt: number,
    stageBlend: FetalStageBlend,
    bpm: number | null,
    options: PhotorealStageOptions,
    viewportAspect: number
  ): void {
    const stepDt = Math.min(Math.max(dt, 0.001), 0.12);

    // If stage pair changed, snap blend immediately to avoid blending wrong textures
    const pairChanged =
      stageBlend.lowerIndex !== prevLowerIdx || stageBlend.upperIndex !== prevUpperIdx;
    if (!initialized || pairChanged) {
      prevLowerIdx = stageBlend.lowerIndex;
      prevUpperIdx = stageBlend.upperIndex;
      smoothBlend = stageBlend.blend;
    } else {
      smoothBlend = THREE.MathUtils.damp(smoothBlend, stageBlend.blend, 10, stepDt);
    }

    const targetZoom = stageBlend.growthZoom * options.userZoom;
    smoothZoom = initialized
      ? THREE.MathUtils.damp(smoothZoom, targetZoom, 8, stepDt)
      : targetZoom;
    smoothInternal = initialized
      ? THREE.MathUtils.damp(smoothInternal, options.highlightInternal ? 1 : 0, 7, stepDt)
      : options.highlightInternal
        ? 1
        : 0;
    smoothPlayWeight = initialized
      ? THREE.MathUtils.damp(smoothPlayWeight, options.isPlaying ? 1 : 0, 6, stepDt)
      : options.isPlaying
        ? 1
        : 0;
    smoothTiltX = initialized
      ? THREE.MathUtils.damp(smoothTiltX, options.tiltX, 7, stepDt)
      : options.tiltX;
    smoothTiltY = initialized
      ? THREE.MathUtils.damp(smoothTiltY, options.tiltY, 7, stepDt)
      : options.tiltY;
    smoothHeartX = initialized
      ? THREE.MathUtils.damp(smoothHeartX, stageBlend.heartUv[0], 8, stepDt)
      : stageBlend.heartUv[0];
    smoothHeartY = initialized
      ? THREE.MathUtils.damp(smoothHeartY, stageBlend.heartUv[1], 8, stepDt)
      : stageBlend.heartUv[1];
    smoothCenterX = initialized
      ? THREE.MathUtils.damp(smoothCenterX, stageBlend.bodyCenterUv[0], 8, stepDt)
      : stageBlend.bodyCenterUv[0];
    smoothCenterY = initialized
      ? THREE.MathUtils.damp(smoothCenterY, stageBlend.bodyCenterUv[1], 8, stepDt)
      : stageBlend.bodyCenterUv[1];
    initialized = true;

    // Lub-dub cardiac waveform synchronized to gestational BPM
    let heartbeatPulse = 0;
    if (bpm !== null && bpm > 0) {
      const freqHz = bpm / 60;
      const beatPhase = (elapsedSec * freqHz) % 1;
      const lub = Math.exp(-Math.pow((beatPhase - 0.12) / 0.055, 2));
      const dub = 0.65 * Math.exp(-Math.pow((beatPhase - 0.28) / 0.048, 2));
      heartbeatPulse = Math.min(1, lub + dub);
    }

    // Aspect-preserving cover UV scale so the 16:9 image fills both desktop & mobile without distortion
    const safeAspect = Math.max(0.5, viewportAspect);
    if (safeAspect >= IMAGE_ASPECT) {
      uniforms.uCoverScale.value.set(1.0, IMAGE_ASPECT / safeAspect);
    } else {
      uniforms.uCoverScale.value.set(safeAspect / IMAGE_ASPECT, 1.0);
    }

    // Scale mesh cleanly to match viewport aspect (with slight overscan for 3D tilt margins)
    stageMesh.scale.set((safeAspect / IMAGE_ASPECT) * 1.08, 1.08, 1.0);

    // Smooth 3D volumetric tilt on the whole stage
    const idleYaw = Math.sin(elapsedSec * 0.42) * 0.032 * smoothPlayWeight;
    const idlePitch = Math.cos(elapsedSec * 0.35) * 0.02 * smoothPlayWeight;
    stageMesh.rotation.y = smoothTiltX * 0.20 + idleYaw;
    stageMesh.rotation.x = -smoothTiltY * 0.13 + idlePitch;

    uniforms.uTexA.value = stageTextures[stageBlend.lowerIndex] ?? placeholderTex;
    uniforms.uTexB.value = stageTextures[stageBlend.upperIndex] ?? placeholderTex;
    uniforms.uBlend.value = smoothBlend;
    uniforms.uTime.value = elapsedSec;
    uniforms.uPlayWeight.value = smoothPlayWeight;
    uniforms.uZoom.value = smoothZoom;
    uniforms.uTilt.value.set(smoothTiltX, smoothTiltY);
    uniforms.uBodyCenter.value.set(smoothCenterX, smoothCenterY);
    uniforms.uHeartUv.value.set(smoothHeartX, smoothHeartY);
    uniforms.uHeartbeat.value = heartbeatPulse;
    uniforms.uInternalMode.value = smoothInternal;

    // Update 3D drifting amniotic particles (move with stronger parallax than background!)
    for (let i = 0; i < moteCount; i++) {
      const m = moteSeeds[i];
      const dx = Math.cos(elapsedSec * m.speed * 0.65 + m.phase) * 0.14 * smoothPlayWeight;
      const dy = Math.sin(elapsedSec * m.speed + m.phase) * 0.16 * smoothPlayWeight;
      const parallaxX = -smoothTiltX * m.z * 0.42;
      const parallaxY = -smoothTiltY * m.z * 0.28;
      _dummy.position.set(m.x + dx + parallaxX, m.y + dy + parallaxY, m.z);
      _dummy.scale.setScalar(m.scale * (0.85 + 0.2 * Math.sin(elapsedSec * 1.2 + m.phase)));
      _dummy.updateMatrix();
      motes.setMatrixAt(i, _dummy.matrix);
    }
    motes.instanceMatrix.needsUpdate = true;
  }

  function dispose(): void {
    planeGeo.dispose();
    planeMat.dispose();
    moteGeo.dispose();
    moteMat.dispose();
    for (const tex of ownedTextures) {
      tex.dispose();
    }
  }

  return {
    group,
    update,
    dispose,
  };
}
