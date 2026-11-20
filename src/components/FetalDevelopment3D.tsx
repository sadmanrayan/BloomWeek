import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  FastForward,
  HeartPulse,
  Info,
  Pause,
  Play,
  RotateCcw,
  Ruler,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { PregnancySummary } from '../utils/pregnancy';
import {
  DEFAULT_EXPLORE_DAY,
  MAX_PREGNANCY_DAY,
  MIN_PREGNANCY_DAY,
  clampPregnancyDay,
  getFetalDayMetrics,
} from '../utils/fetalDevelopment';
import { resolveFetalStageBlend } from '../utils/fetalStages';
import { FetalHeartbeatSynth } from '../utils/heartbeatAudio';
import {
  FETAL_STAGE_IMAGE_URLS,
  createFetalPhotorealStage,
} from '../three/fetalPhotorealStage';

interface FetalDevelopment3DProps {
  summary: PregnancySummary | null;
}

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '');
    const isSoft = /swiftshader|llvmpipe|softpipe|mesa|software/i.test(rendererStr);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return isSoft;
  } catch {
    return true;
  }
}

export const FetalDevelopment3D: React.FC<FetalDevelopment3DProps> = ({ summary }) => {
  const userDayNumber = summary ? clampPregnancyDay(summary.dayNumber) : null;

  const [selectedDay, setSelectedDay] = useState<number>(() =>
    userDayNumber ?? DEFAULT_EXPLORE_DAY
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });
  const [isTimelapse, setIsTimelapse] = useState<boolean>(false);
  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [highlightInternal, setHighlightInternal] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [webglStatus, setWebglStatus] = useState<'ready' | 'lost' | 'unsupported'>('ready');

  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const resetViewFnRef = useRef<(() => void) | null>(null);
  const heartbeatSynthRef = useRef<FetalHeartbeatSynth | null>(null);

  const metrics = useMemo(() => getFetalDayMetrics(selectedDay), [selectedDay]);
  const stageBlend = useMemo(() => resolveFetalStageBlend(selectedDay), [selectedDay]);

  // Sync viewer automatically when user sets or changes their LMP date
  const prevLmpRef = useRef<string | null>(summary?.lmpIso ?? null);
  useEffect(() => {
    const currentLmp = summary?.lmpIso ?? null;
    if (currentLmp !== prevLmpRef.current) {
      prevLmpRef.current = currentLmp;
      if (summary) {
        setSelectedDay(clampPregnancyDay(summary.dayNumber));
        setIsTimelapse(false);
      } else {
        setSelectedDay(DEFAULT_EXPLORE_DAY);
        setIsTimelapse(false);
      }
    }
  }, [summary]);

  // Mutable simulation state read by the WebGL loop (never recreates WebGL context on UI toggles)
  const simStateRef = useRef({
    stageBlend,
    bpm: metrics.heartRateBpm,
    highlightInternal,
    isPlaying,
    tiltX: 0,
    tiltY: 0,
    userZoom: 1.0,
  });

  useEffect(() => {
    simStateRef.current.stageBlend = stageBlend;
    simStateRef.current.bpm = metrics.heartRateBpm;
    simStateRef.current.highlightInternal = highlightInternal;
    simStateRef.current.isPlaying = isPlaying;
  }, [stageBlend, metrics.heartRateBpm, highlightInternal, isPlaying]);

  // Day-by-Day Timelapse auto-stepping
  useEffect(() => {
    if (!isTimelapse) return;
    const timer = window.setInterval(() => {
      setSelectedDay((prev) => {
        if (prev >= MAX_PREGNANCY_DAY) {
          setIsTimelapse(false);
          return MAX_PREGNANCY_DAY;
        }
        return prev + 1;
      });
    }, 180);
    return () => window.clearInterval(timer);
  }, [isTimelapse]);

  // Procedural Web Audio Heartbeat Synthesizer
  useEffect(() => {
    if (!soundEnabled || metrics.heartRateBpm === null) {
      heartbeatSynthRef.current?.stop();
      return;
    }

    if (!heartbeatSynthRef.current) {
      heartbeatSynthRef.current = new FetalHeartbeatSynth();
    }
    heartbeatSynthRef.current.start(metrics.heartRateBpm);
  }, [soundEnabled, metrics.heartRateBpm]);

  useEffect(() => {
    if (soundEnabled && metrics.heartRateBpm !== null) {
      heartbeatSynthRef.current?.setBpm(metrics.heartRateBpm);
    }
  }, [metrics.heartRateBpm, soundEnabled]);

  useEffect(() => {
    return () => {
      heartbeatSynthRef.current?.dispose();
      heartbeatSynthRef.current = null;
    };
  }, []);

  // Mount Photorealistic Volumetric Three.js WebGL Stage ONCE inside isolated container
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglStatus('unsupported');
      return;
    }

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.setAttribute(
      'aria-label',
      'Photorealistic animated 3D fetal development stage. Drag to tilt perspective and scroll to zoom.'
    );
    container.appendChild(renderer.domElement);

    let viewW = Math.max(container.clientWidth, 320);
    let viewH = Math.max(container.clientHeight, 320);
    renderer.setSize(viewW, viewH, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#E6D2BC');

    const camera = new THREE.PerspectiveCamera(34, viewW / viewH, 0.1, 20);
    camera.position.set(0, 0, 4.02);
    camera.lookAt(0, 0, 0);

    const maxAnisotropy = isSoftwareGl
      ? 1
      : Math.min(8, renderer.capabilities.getMaxAnisotropy());

    let disposed = false;
    const renderOneFrame = () => {
      if (disposed) return;
      renderer.render(scene, camera);
    };

    const photorealStage = createFetalPhotorealStage(maxAnisotropy, renderOneFrame);
    scene.add(photorealStage.group);

    // Interactive Pointer Drag-to-Tilt + Wheel Zoom
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture issues
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragging) {
        const dx = (e.clientX - lastX) / Math.max(viewW, 240);
        const dy = (e.clientY - lastY) / Math.max(viewH, 240);
        lastX = e.clientX;
        lastY = e.clientY;
        simStateRef.current.tiltX = THREE.MathUtils.clamp(
          simStateRef.current.tiltX + dx * 2.4,
          -1,
          1
        );
        simStateRef.current.tiltY = THREE.MathUtils.clamp(
          simStateRef.current.tiltY - dy * 2.4,
          -1,
          1
        );
      } else if (e.pointerType === 'mouse') {
        // Subtle gentle hover parallax even without dragging
        const rect = renderer.domElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          const ny = ((e.clientY - rect.top) / rect.height - 0.5) * -2;
          simStateRef.current.tiltX = THREE.MathUtils.clamp(nx * 0.28, -1, 1);
          simStateRef.current.tiltY = THREE.MathUtils.clamp(ny * 0.22, -1, 1);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore release issues
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && Math.abs(e.deltaY) < 4) return;
      // Allow smooth zoom only when holding Ctrl/Alt or pinching, or subtle scroll zoom when hovering
      // Wait: keep normal page vertical scroll smooth unless user zooms with pinch/ctrl!
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        simStateRef.current.userZoom = THREE.MathUtils.clamp(
          simStateRef.current.userZoom - e.deltaY * 0.0025,
          0.9,
          1.45
        );
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    resetViewFnRef.current = () => {
      simStateRef.current.tiltX = 0;
      simStateRef.current.tiltY = 0;
      simStateRef.current.userZoom = 1.0;
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglStatus('lost');
    };
    const handleContextRestored = () => {
      setWebglStatus('ready');
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    const resizeObserver = new ResizeObserver(() => {
      viewW = Math.max(container.clientWidth, 260);
      viewH = Math.max(container.clientHeight, 260);
      camera.aspect = viewW / viewH;
      camera.updateProjectionMatrix();
      renderer.setSize(viewW, viewH, false);
    });
    resizeObserver.observe(container);

    let rafId = 0;
    let softTimeoutId = 0;
    let lastNow = performance.now();
    let elapsedSec = 0;

    // Software-WebGL fence pacing so headless/low-GPU renderers never stall the main thread
    const afterDraw = (next: () => void) => {
      if (disposed) return;
      if (!isSoftwareGl) {
        rafId = window.requestAnimationFrame(next);
        return;
      }
      const gl = renderer.getContext();
      if (!(gl instanceof WebGL2RenderingContext) || !gl.fenceSync) {
        softTimeoutId = window.setTimeout(next, 85);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        softTimeoutId = window.setTimeout(next, 85);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const status = gl.clientWaitSync(sync, 0, 0);
        if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
          gl.deleteSync(sync);
          softTimeoutId = window.setTimeout(next, 75);
        } else if (status === gl.WAIT_FAILED) {
          gl.deleteSync(sync);
          softTimeoutId = window.setTimeout(next, 110);
        } else {
          softTimeoutId = window.setTimeout(poll, 5);
        }
      };
      softTimeoutId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastNow) / 1000, 0.1);
      lastNow = now;

      if (!document.hidden) {
        if (simStateRef.current.isPlaying) {
          elapsedSec += dt;
        }
        photorealStage.update(
          elapsedSec,
          dt,
          simStateRef.current.stageBlend,
          simStateRef.current.bpm,
          {
            highlightInternal: simStateRef.current.highlightInternal,
            isPlaying: simStateRef.current.isPlaying,
            tiltX: simStateRef.current.tiltX,
            tiltY: simStateRef.current.tiltY,
            userZoom: simStateRef.current.userZoom,
          },
          viewW / viewH
        );
        renderer.render(scene, camera);
      }

      afterDraw(tick);
    };

    // Draw first frame immediately
    photorealStage.update(
      0,
      0.016,
      simStateRef.current.stageBlend,
      simStateRef.current.bpm,
      {
        highlightInternal: simStateRef.current.highlightInternal,
        isPlaying: simStateRef.current.isPlaying,
        tiltX: 0,
        tiltY: 0,
        userZoom: 1,
      },
      viewW / viewH
    );
    renderer.render(scene, camera);
    afterDraw(tick);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(softTimeoutId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      photorealStage.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      resetViewFnRef.current = null;
    };
  }, []);

  const handleStepDay = (delta: number) => {
    setIsTimelapse(false);
    setSelectedDay((prev) => clampPregnancyDay(prev + delta));
  };

  const handleToggleTimelapse = () => {
    setIsTimelapse((prev) => {
      const next = !prev;
      if (next) {
        setIsPlaying(true);
        if (selectedDay >= MAX_PREGNANCY_DAY - 1) {
          setSelectedDay(35);
        }
      }
      return next;
    });
  };

  const handleJumpToMyDay = () => {
    if (userDayNumber === null) return;
    setIsTimelapse(false);
    setSelectedDay(userDayNumber);
  };

  const isSyncedToUserDay = userDayNumber !== null && selectedDay === userDayNumber;
  const rulerFillPercent = Math.min(
    100,
    Math.max(14, Math.round((Math.log10(metrics.lengthMm + 1) / Math.log10(520)) * 100))
  );
  const fallbackImgUrl =
    FETAL_STAGE_IMAGE_URLS[
      stageBlend.blend < 0.5 ? stageBlend.lowerIndex : stageBlend.upperIndex
    ] ?? FETAL_STAGE_IMAGE_URLS[1];

  return (
    <section
      id="baby-3d"
      ref={sectionRef}
      data-testid="baby-3d-section"
      data-day={selectedDay}
      data-week={metrics.week}
      data-stage={stageBlend.stageId}
      data-internal={highlightInternal ? 'on' : 'off'}
      data-ruler={showRuler ? 'on' : 'off'}
      aria-labelledby="baby-3d-heading"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
    >
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A84A67] dark:text-[#E58AA6]">
            Interactive 3D Growth
          </p>
          <h2
            id="baby-3d-heading"
            className="mt-1 font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#2E2428] dark:text-[#F5ECEF]"
          >
            3D Baby Development
          </h2>
          <p className="mt-1 text-sm text-[#6B5B61] dark:text-[#C3B3B9] max-w-2xl">
            Realistic animated day-by-day fetal development from Day 1 to Day 280. Drag gently to
            tilt in 3D, step day by day, or play the continuous growth timelapse.
          </p>
        </div>

        {userDayNumber !== null && !isSyncedToUserDay && (
          <button
            type="button"
            onClick={handleJumpToMyDay}
            className="self-start sm:self-auto h-9 px-3.5 text-xs sm:text-sm font-medium rounded-lg border border-[#D8B6C2] dark:border-[#513B45] bg-[#FAF0F3] hover:bg-[#F3E2E8] dark:bg-[#2A2025] dark:hover:bg-[#382B32] text-[#8E3954] dark:text-[#F0A4BC] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Jump to My Day (Day {userDayNumber})
          </button>
        )}
      </div>

      {/* Main 3D Photorealistic Stage Card */}
      <div className="relative rounded-3xl overflow-hidden border border-[#E5D3D8] dark:border-[#3D2E35] bg-[#E6D2BC] dark:bg-[#241B1E] shadow-sm">
        {/* Isolated 3D WebGL Viewport */}
        <div
          data-testid="baby-3d-canvas-wrap"
          className="relative w-full h-[420px] sm:h-[520px] lg:h-[580px] select-none"
        >
          {/* Photorealistic fallback image visible instantly if WebGL is lost/unsupported */}
          {webglStatus !== 'ready' && (
            <img
              src={fallbackImgUrl}
              alt={`Photorealistic fetal development at Week ${metrics.week}, Day ${metrics.dayOfWeek}`}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Live Volumetric Three.js WebGL Canvas */}
          <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

          {/* Top-Left Compact Stage Readout (solid warm cream, zero backdrop-blur) */}
          <div className="pointer-events-none absolute top-3.5 left-3.5 sm:top-5 sm:left-5 z-10 max-w-[74%]">
            <div className="inline-flex flex-col rounded-2xl px-3.5 py-2.5 bg-[#FFF9F4]/92 dark:bg-[#221A1E]/92 border border-[#E6D4C7] dark:border-[#46363D] shadow-xs">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-serif text-base sm:text-lg font-semibold text-[#2E2428] dark:text-[#F8EFF2] tabular-nums">
                  Week {metrics.week}, Day {metrics.dayOfWeek}
                </span>
                <span className="text-xs font-medium text-[#8C455C] dark:text-[#E58AA6] tabular-nums">
                  Day {metrics.dayNumber} of {MAX_PREGNANCY_DAY}
                </span>
              </div>
              <p className="text-xs text-[#65545B] dark:text-[#C8B6BC] mt-0.5 truncate">
                {metrics.stageName} · {metrics.trimesterLabel}
                {isSyncedToUserDay ? ' · Your current day' : ''}
              </p>
            </div>
          </div>

          {/* Top-Right Compact View Controls (Reset Tilt + Info) */}
          <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => resetViewFnRef.current?.()}
              aria-label="Reset 3D camera angle"
              title="Reset 3D view"
              className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-[#FFF9F4]/92 hover:bg-[#FFFFFF] dark:bg-[#221A1E]/92 dark:hover:bg-[#31262B] border border-[#E6D4C7] dark:border-[#46363D] text-[#3B2A30] dark:text-[#F5ECEF] shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setShowInfo((prev) => !prev)}
              aria-label={showInfo ? 'Close daily development info' : 'Open daily development info'}
              aria-expanded={showInfo}
              title="Daily development details"
              className={`w-9 h-9 rounded-full inline-flex items-center justify-center border shadow-xs transition-colors cursor-pointer ${
                showInfo
                  ? 'bg-[#A84A67] border-[#A84A67] text-white'
                  : 'bg-[#FFF9F4]/92 hover:bg-[#FFFFFF] dark:bg-[#221A1E]/92 dark:hover:bg-[#31262B] border-[#E6D4C7] dark:border-[#46363D] text-[#3B2A30] dark:text-[#F5ECEF]'
              }`}
            >
              {showInfo ? (
                <X className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Info className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Far-Left Edge Actual Size Ruler Overlay (toggled by Size Ruler button) */}
          {showRuler && (
            <aside
              aria-label="Actual fetal size ruler"
              data-testid="baby-3d-ruler-overlay"
              className="pointer-events-none absolute left-3.5 sm:left-5 top-24 bottom-20 z-10 flex items-center gap-2.5"
            >
              <div className="h-full max-h-[240px] w-7 rounded-xl bg-[#FFF9F4]/92 dark:bg-[#221A1E]/92 border border-[#E6D4C7] dark:border-[#46363D] px-1.5 py-2 flex flex-col justify-between items-center shadow-xs">
                <div className="w-full h-full relative flex flex-col justify-end items-center">
                  <div className="absolute inset-0 flex flex-col justify-between items-start py-0.5">
                    {Array.from({ length: 9 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`block h-px bg-[#8A6D60]/70 dark:bg-[#C6A79C]/60 ${
                          idx % 2 === 0 ? 'w-3.5' : 'w-2'
                        }`}
                      />
                    ))}
                  </div>
                  <div
                    style={{ height: `${rulerFillPercent}%` }}
                    className="w-1.5 rounded-full bg-[#A84A67] dark:bg-[#E58AA6] transition-all duration-300 self-end"
                  />
                </div>
              </div>

              <div className="rounded-xl px-3 py-2 bg-[#FFF9F4]/94 dark:bg-[#221A1E]/94 border border-[#E6D4C7] dark:border-[#46363D] shadow-xs">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8C455C] dark:text-[#E58AA6]">
                  Actual Size
                </p>
                <p className="font-serif text-base font-semibold text-[#2E2428] dark:text-[#F8EFF2] tabular-nums">
                  {metrics.lengthLabel}
                </p>
                <p className="text-[11px] text-[#6B5B61] dark:text-[#C3B3B9]">
                  {metrics.lengthMeasureType}
                </p>
                <p className="text-[11px] font-medium text-[#3B2A30] dark:text-[#EADCE1] mt-1 tabular-nums">
                  Est. {metrics.weightLabel}
                </p>
              </div>
            </aside>
          )}

          {/* Expandable Day Info Panel */}
          {showInfo && (
            <aside
              aria-label="Daily development details"
              data-testid="baby-3d-info-panel"
              className="absolute right-3.5 sm:right-5 top-16 sm:top-[68px] z-20 w-[calc(100%-1.75rem)] max-w-xs sm:max-w-sm rounded-2xl bg-[#FFF9F4]/96 dark:bg-[#221A1E]/96 border border-[#E6D4C7] dark:border-[#46363D] p-4 shadow-md"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A84A67] dark:text-[#E58AA6]">
                  Day {metrics.dayNumber} · {metrics.stageName}
                </p>
                <h3 className="mt-0.5 font-serif text-base font-semibold text-[#2E2428] dark:text-[#F8EFF2] leading-snug">
                  {metrics.headline}
                </h3>
              </div>

              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#57474E] dark:text-[#D5C6CC]">
                {metrics.dailyFocus}
              </p>

              <dl className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-[#EADAD1] dark:border-[#3E2F36] text-xs">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[#7A686F] dark:text-[#B3A1A8]">
                    Length
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#2E2428] dark:text-[#F8EFF2] tabular-nums">
                    {metrics.lengthLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[#7A686F] dark:text-[#B3A1A8]">
                    Weight
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#2E2428] dark:text-[#F8EFF2] tabular-nums">
                    {metrics.weightLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[#7A686F] dark:text-[#B3A1A8]">
                    Heart Rate
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#2E2428] dark:text-[#F8EFF2] tabular-nums">
                    {metrics.heartRateBpm ? `${metrics.heartRateBpm} bpm` : 'Forming'}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 pt-2.5 border-t border-[#EADAD1] dark:border-[#3E2F36]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7A686F] dark:text-[#B3A1A8] mb-1.5">
                  Active Focus Today
                </p>
                <ul className="space-y-1 text-xs text-[#4A3B42] dark:text-[#DFD0D6]">
                  {metrics.developingSystems.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="w-1.5 h-1.5 rounded-full bg-[#A84A67] dark:bg-[#E58AA6] shrink-0"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* Collapse / Expand Controls Handle when dock is collapsed */}
          {controlsCollapsed && (
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10">
              <button
                type="button"
                onClick={() => setControlsCollapsed(false)}
                className="h-9 px-4 rounded-full inline-flex items-center gap-2 bg-[#FFF9F4]/95 hover:bg-white dark:bg-[#221A1E]/95 dark:hover:bg-[#2E2429] border border-[#E6D4C7] dark:border-[#46363D] text-xs font-semibold text-[#3B2A30] dark:text-[#F5ECEF] shadow-sm cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
                <span>Show 3D Controls</span>
              </button>
            </div>
          )}
        </div>

        {/* Collapsible Bottom Control Dock (Zero overlap over baby, zero backdrop-blur) */}
        {!controlsCollapsed && (
          <div
            data-testid="baby-3d-controls"
            className="bg-[#FFF9F5] dark:bg-[#1E171B] border-t border-[#E6D4C7] dark:border-[#3A2D33] px-4 sm:px-6 py-4 space-y-3.5"
          >
            {/* Row 1: Day-by-Day Stepper + Smooth 1..280 Day Scrubber */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center justify-between md:justify-start gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStepDay(-7)}
                  disabled={selectedDay <= MIN_PREGNANCY_DAY}
                  aria-label="Previous week"
                  title="Previous week (-7 days)"
                  className="h-9 px-2.5 rounded-lg border border-[#E4D3DA] dark:border-[#44353D] bg-[#FAF4F6] hover:bg-[#F2E6EA] dark:bg-[#2A2126] dark:hover:bg-[#352A30] text-xs font-semibold text-[#3B2A30] dark:text-[#F5ECEF] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>1W</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStepDay(-1)}
                  disabled={selectedDay <= MIN_PREGNANCY_DAY}
                  aria-label="Previous day"
                  title="Previous day (-1 day)"
                  className="h-9 px-2.5 rounded-lg border border-[#E4D3DA] dark:border-[#44353D] bg-[#FAF4F6] hover:bg-[#F2E6EA] dark:bg-[#2A2126] dark:hover:bg-[#352A30] text-xs font-semibold text-[#3B2A30] dark:text-[#F5ECEF] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Day</span>
                </button>

                <span className="md:hidden text-xs font-semibold text-[#2E2428] dark:text-[#F5ECEF] tabular-nums px-1">
                  W{metrics.week} · D{metrics.dayOfWeek}
                </span>

                <button
                  type="button"
                  onClick={() => handleStepDay(1)}
                  disabled={selectedDay >= MAX_PREGNANCY_DAY}
                  aria-label="Next day"
                  title="Next day (+1 day)"
                  className="h-9 px-2.5 rounded-lg border border-[#E4D3DA] dark:border-[#44353D] bg-[#FAF4F6] hover:bg-[#F2E6EA] dark:bg-[#2A2126] dark:hover:bg-[#352A30] text-xs font-semibold text-[#3B2A30] dark:text-[#F5ECEF] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Day</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepDay(7)}
                  disabled={selectedDay >= MAX_PREGNANCY_DAY}
                  aria-label="Next week"
                  title="Next week (+7 days)"
                  className="h-9 px-2.5 rounded-lg border border-[#E4D3DA] dark:border-[#44353D] bg-[#FAF4F6] hover:bg-[#F2E6EA] dark:bg-[#2A2126] dark:hover:bg-[#352A30] text-xs font-semibold text-[#3B2A30] dark:text-[#F5ECEF] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>1W</span>
                  <ChevronsRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Day-by-Day Range Scrubber */}
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <label htmlFor="baby-3d-day-slider" className="sr-only">
                  Select pregnancy day from 1 to 280
                </label>
                <span className="text-[11px] font-medium text-[#7B6970] dark:text-[#B5A3AA] tabular-nums shrink-0">
                  Day 1
                </span>
                <input
                  id="baby-3d-day-slider"
                  type="range"
                  min={MIN_PREGNANCY_DAY}
                  max={MAX_PREGNANCY_DAY}
                  step={1}
                  value={selectedDay}
                  onChange={(e) => {
                    setIsTimelapse(false);
                    setSelectedDay(clampPregnancyDay(Number(e.target.value)));
                  }}
                  className="w-full h-2 rounded-full accent-[#A84A67] dark:accent-[#E58AA6] cursor-pointer bg-[#EAD9DF] dark:bg-[#3B2E35]"
                />
                <span className="text-[11px] font-medium text-[#7B6970] dark:text-[#B5A3AA] tabular-nums shrink-0">
                  Day 280
                </span>
              </div>
            </div>

            {/* Row 2: Interactive Mode Controls + Concise Biometrics */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#EFE3E7] dark:border-[#31262C]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  aria-pressed={isPlaying}
                  className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isPlaying
                      ? 'bg-[#A84A67] border-[#A84A67] text-white hover:bg-[#913D57]'
                      : 'bg-[#FAF4F6] dark:bg-[#2A2126] border-[#E4D3DA] dark:border-[#44353D] text-[#3B2A30] dark:text-[#F5ECEF] hover:bg-[#F2E6EA] dark:hover:bg-[#352A30]'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Pause Motion</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Play Motion</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleToggleTimelapse}
                  aria-pressed={isTimelapse}
                  className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isTimelapse
                      ? 'bg-[#A84A67] border-[#A84A67] text-white hover:bg-[#913D57]'
                      : 'bg-[#FAF4F6] dark:bg-[#2A2126] border-[#E4D3DA] dark:border-[#44353D] text-[#3B2A30] dark:text-[#F5ECEF] hover:bg-[#F2E6EA] dark:hover:bg-[#352A30]'
                  }`}
                >
                  <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isTimelapse ? 'Stop Timelapse' : 'Day Timelapse'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRuler((prev) => !prev)}
                  aria-pressed={showRuler}
                  className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showRuler
                      ? 'bg-[#A84A67] border-[#A84A67] text-white hover:bg-[#913D57]'
                      : 'bg-[#FAF4F6] dark:bg-[#2A2126] border-[#E4D3DA] dark:border-[#44353D] text-[#3B2A30] dark:text-[#F5ECEF] hover:bg-[#F2E6EA] dark:hover:bg-[#352A30]'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Size Ruler</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHighlightInternal((prev) => !prev)}
                  aria-pressed={highlightInternal}
                  className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    highlightInternal
                      ? 'bg-[#A84A67] border-[#A84A67] text-white hover:bg-[#913D57]'
                      : 'bg-[#FAF4F6] dark:bg-[#2A2126] border-[#E4D3DA] dark:border-[#44353D] text-[#3B2A30] dark:text-[#F5ECEF] hover:bg-[#F2E6EA] dark:hover:bg-[#352A30]'
                  }`}
                >
                  <HeartPulse className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Heartbeat Glow</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  disabled={metrics.heartRateBpm === null}
                  aria-pressed={soundEnabled && metrics.heartRateBpm !== null}
                  title={
                    metrics.heartRateBpm === null
                      ? 'Heartbeat begins around Week 5 (Day 35)'
                      : `Toggle fetal heartbeat audio (${metrics.heartRateBpm} bpm)`
                  }
                  className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    soundEnabled && metrics.heartRateBpm !== null
                      ? 'bg-[#A84A67] border-[#A84A67] text-white hover:bg-[#913D57]'
                      : 'bg-[#FAF4F6] dark:bg-[#2A2126] border-[#E4D3DA] dark:border-[#44353D] text-[#3B2A30] dark:text-[#F5ECEF] hover:bg-[#F2E6EA] dark:hover:bg-[#352A30]'
                  }`}
                >
                  {soundEnabled && metrics.heartRateBpm !== null ? (
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>
                    {metrics.heartRateBpm !== null
                      ? `Heartbeat (${metrics.heartRateBpm} bpm)`
                      : 'Heartbeat (W5+)'}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#5E4E55] dark:text-[#C7B6BC]">
                <span className="hidden lg:inline tabular-nums">
                  <strong className="text-[#2E2428] dark:text-[#F5ECEF]">{metrics.lengthLabel}</strong>
                  {' · '}
                  <strong className="text-[#2E2428] dark:text-[#F5ECEF]">{metrics.weightLabel}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setControlsCollapsed(true)}
                  aria-label="Hide 3D controls"
                  className="h-8 px-2.5 rounded-lg text-xs font-medium text-[#6B5B61] hover:text-[#2E2428] dark:text-[#C3B3B9] dark:hover:text-[#F5ECEF] hover:bg-[#F3E9EC] dark:hover:bg-[#2D2328] inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Hide</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Day Headline Bar below card */}
      <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs sm:text-sm text-[#6B5B61] dark:text-[#C3B3B9]">
        <p>
          <span className="font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
            {metrics.headline}:
          </span>{' '}
          {metrics.dailyFocus}
        </p>
      </div>
    </section>
  );
};
