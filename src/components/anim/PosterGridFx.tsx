"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/anim/signal";

/**
 * Grid Displacement + RGB shift como fundo da atração (skill grid-displacement-effect).
 * Porte fiel das duas passagens do demo Codrops/Chakib Mazouni, ESCOPADO ao painel
 * (canvas próprio, não overlay fullscreen): uma grade GPGPU (Pass A) acumula a
 * velocidade do cursor e relaxa no tempo; o shader de display (Pass B) deforma o
 * pôster por esse campo e separa R/G/B. Guarda reduced-motion / pointer grosso /
 * sem-WebGL → cai para o pôster estático (escuro). Pausa fora da tela e em aba oculta.
 */

// ── Shaders (idênticos ao assets/shaders/* da skill) ─────────────────────────
const SIMULATION_SHADER = /* glsl */ `
uniform vec2  uMouse;
uniform vec2  uDeltaMouse;
uniform float uMouseMove;
uniform float uGridSize;
uniform float uRelaxation;
uniform float uDistance;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 color = texture(uGrid, uv);
  float dist = distance(uv, uMouse);
  dist = 1.0 - smoothstep(0.0, uDistance / uGridSize, dist);
  color.rg += uDeltaMouse * dist;
  color.rg *= min(uRelaxation, uMouseMove);
  gl_FragColor = color;
}`;
const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vUv = uv;
}`;
const FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D uTexture;
uniform sampler2D uGrid;
uniform vec2  uContainerResolution;
uniform vec2  uImageResolution;
varying vec2 vUv;
vec2 coverUvs(vec2 ir, vec2 cr) {
  float iaX = ir.x / ir.y, iaY = ir.y / ir.x;
  float caX = cr.x / cr.y, caY = cr.y / cr.x;
  vec2 ratio = vec2(min(caX / iaX, 1.0), min(caY / iaY, 1.0));
  return vec2(vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
              vUv.y * ratio.y + (1.0 - ratio.y) * 0.5);
}
void main() {
  vec2 imageUvs  = coverUvs(uImageResolution, uContainerResolution);
  vec2 squareUvs = coverUvs(vec2(1.0), uContainerResolution);
  vec4 disp = texture2D(uGrid, squareUvs);
  vec2 finalUvs = imageUvs - disp.rg * 0.01;
  vec4 img = texture2D(uTexture, finalUvs);
  vec2  shift = disp.rg * 0.001;
  float s = clamp(length(disp.rg), 0.0, 2.0);
  img.r = texture2D(uTexture, finalUvs + shift * (1.0 + s * 0.25)).r;
  img.g = texture2D(uTexture, finalUvs + shift * (1.0 + s * 2.0)).g;
  img.b = texture2D(uTexture, finalUvs + shift * (1.0 + s * 1.5)).b;
  gl_FragColor = img;
}`;

const PARAMS = { relaxation: 0.965, distance: 0.6, strength: 0.8, gridSize: 700 };

export function PosterGridFx({
  src,
  opacity = 0.45,
}: {
  src: string;
  opacity?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fx, setFx] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const panel = panelRef.current;
    if (!canvas || !panel) return;

    // Guards a11y/capacidade → mantém o pôster estático.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (prefersReducedMotion() || !fine) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      let THREE: typeof import("three");
      let GPUComputationRenderer: typeof import("three/examples/jsm/misc/GPUComputationRenderer.js").GPUComputationRenderer;
      try {
        THREE = await import("three");
        ({ GPUComputationRenderer } = await import(
          "three/examples/jsm/misc/GPUComputationRenderer.js"
        ));
      } catch {
        return; // sem three → fallback estático
      }
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      } catch {
        return; // WebGL indisponível → fallback estático
      }
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
      camera.position.z = 10;
      const sizes = { width: 1, height: 1 };

      // Pass A — grade GPGPU (a "física")
      const grid = Math.ceil(Math.sqrt(PARAMS.gridSize));
      const gpu = new GPUComputationRenderer(grid, grid, renderer);
      const variable = gpu.addVariable("uGrid", SIMULATION_SHADER, gpu.createTexture());
      gpu.setVariableDependencies(variable, [variable]);
      Object.assign(variable.material.uniforms, {
        uTime: { value: 0 },
        uRelaxation: { value: PARAMS.relaxation },
        uGridSize: { value: grid },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uDeltaMouse: { value: new THREE.Vector2(0, 0) },
        uMouseMove: { value: 0 },
        uDistance: { value: PARAMS.distance * 10 },
      });
      const err = gpu.init();
      if (err) {
        renderer.dispose();
        return; // sem suporte a textura float → fallback estático
      }

      // Pass B — plano de display (o "look")
      const placeholder = new THREE.DataTexture(
        new Uint8Array([10, 14, 20, 0]),
        1,
        1,
      );
      placeholder.needsUpdate = true;
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        uniforms: {
          uTexture: { value: placeholder },
          uGrid: { value: null },
          uContainerResolution: { value: new THREE.Vector2(1, 1) },
          uImageResolution: { value: new THREE.Vector2(1, 1) },
        },
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      scene.add(mesh);

      new THREE.TextureLoader().load(src, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        material.uniforms.uTexture.value = t;
        material.uniforms.uImageResolution.value.set(
          t.image.naturalWidth || 1200,
          t.image.naturalHeight || 1880,
        );
      });

      // Dimensiona renderer/câmera/plano ao painel (escopo, não window).
      const resize = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const fov = camera.fov * (Math.PI / 180);
        sizes.height = 2 * Math.tan(fov / 2) * camera.position.z;
        sizes.width = sizes.height * camera.aspect;
        mesh.scale.set(sizes.width, sizes.height, 1);
        renderer.setSize(w, h, false);
        material.uniforms.uContainerResolution.value.set(w, h);
      };
      resize();

      // Cursor → grade (coordenadas relativas ao canvas).
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(mesh)[0];
        if (!hit || !hit.uv) return;
        const u = variable.material.uniforms;
        u.uMouseMove.value = 1;
        const delta = hit.uv
          .clone()
          .sub(u.uMouse.value)
          .multiplyScalar(PARAMS.strength * 100);
        u.uDeltaMouse.value.copy(delta);
        u.uMouse.value.copy(hit.uv);
      };

      const clock = new THREE.Clock();
      let raf = 0;
      const render = () => {
        const u = variable.material.uniforms;
        u.uTime.value = clock.getElapsedTime();
        u.uMouseMove.value *= 0.95;
        u.uDeltaMouse.value.multiplyScalar(PARAMS.relaxation);
        gpu.compute();
        material.uniforms.uGrid.value =
          gpu.getCurrentRenderTarget(variable).texture;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };
      const startLoop = () => {
        if (!raf) raf = requestAnimationFrame(render);
      };
      const stopLoop = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };

      // Pausa fora da tela / em aba oculta (cidadania de performance).
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !document.hidden) startLoop();
        else stopLoop();
      });
      io.observe(panel);
      const onVisible = () => {
        if (document.hidden) stopLoop();
        else startLoop();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("visibilitychange", onVisible);
      startLoop();
      setFx(true);

      cleanup = () => {
        stopLoop();
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("visibilitychange", onVisible);
        mesh.geometry.dispose();
        material.dispose();
        placeholder.dispose();
        material.uniforms.uTexture.value?.dispose?.();
        gpu.dispose?.();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [src]);

  return (
    <div
      aria-hidden
      className="pointer-events-none sticky top-0 hidden h-[calc(100svh-4rem)] lg:block"
      style={{ marginBottom: "calc(-1 * (100svh - 4rem))" }}
    >
      <div ref={panelRef} className="absolute right-0 top-0 h-full w-[54%]">
        {/* Fallback estático (e estado SSR/inicial): pôster escuro, sem WebGL. */}
        {!fx && (
          <div
            className="absolute inset-0"
            style={
              {
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity,
              } as CSSProperties
            }
          />
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full"
          style={{ opacity, visibility: fx ? "visible" : "hidden" }}
        />
      </div>
    </div>
  );
}
