import * as THREE from 'three';
import { buildModels, type WorkbenchModels } from './models';
import type {
  SceneTarget,
  WorkbenchController,
  WorkbenchOptions,
} from './types';

interface CameraMove {
  start: number;
  duration: number;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromLook: THREE.Vector3;
  toLook: THREE.Vector3;
  complete: () => void;
}

function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      geometries.add(object.geometry);
      for (const surface of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        materials.add(surface);
        for (const value of Object.values(surface))
          if (value instanceof THREE.Texture) textures.add(value);
      }
    }
    if (object instanceof THREE.Light && 'shadow' in object) {
      const shadow = object.shadow as THREE.LightShadow | undefined;
      shadow?.map?.dispose();
      shadow?.mapPass?.dispose();
    }
  });
  for (const value of textures) value.dispose();
  for (const value of materials) value.dispose();
  for (const value of geometries) value.dispose();
  scene.clear();
}

export function createWorkbench(
  host: HTMLElement,
  options: WorkbenchOptions,
): WorkbenchController {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.touchAction = 'pan-y';
  host.append(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#17212e');
  const fog = new THREE.Fog('#17212e', 23, 70);
  scene.fog = fog;
  let models: WorkbenchModels;
  try {
    models = buildModels();
    scene.add(models.root);
    models.setLamp(options.lampOn);
  } catch (error) {
    disposeScene(scene);
    renderer.dispose();
    canvas.remove();
    throw error;
  }

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 120);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const homeLook = new THREE.Vector3(-0.12, 0.9, 0.16);
  const look = homeLook.clone();
  let homeYaw = 0.35;
  let homePolar = 1.23;
  let yaw = homeYaw;
  let polar = homePolar;
  let radius = 9.6;
  let layout: 'desktop' | 'medium' | 'mobile' | null = null;
  let disposed = false;
  let failed = false;
  let ready = false;
  let frame = 0;
  let width = 0;
  let height = 0;
  let pointerTarget: SceneTarget | null = null;
  let controlTarget: SceneTarget | null = null;
  let move: CameraMove | null = null;
  let hiddenAt = 0;
  let drag: {
    id: number;
    x: number;
    y: number;
    yaw: number;
    polar: number;
    moved: boolean;
  } | null = null;

  function updateCamera() {
    camera.position
      .setFromSpherical(new THREE.Spherical(radius, polar, yaw))
      .add(homeLook);
    look.copy(homeLook);
    camera.lookAt(look);
  }

  function requestRender() {
    if (disposed || failed || document.hidden || frame || !width || !height)
      return;
    frame = requestAnimationFrame(render);
  }

  function render(now: number) {
    frame = 0;
    if (disposed || failed || document.hidden) return;
    let complete: (() => void) | null = null;
    if (move) {
      const progress = Math.min(
        1,
        Math.max(0, (now - move.start) / move.duration),
      );
      const eased = progress * progress * (3 - 2 * progress);
      camera.position.lerpVectors(move.fromPosition, move.toPosition, eased);
      look.lerpVectors(move.fromLook, move.toLook, eased);
      camera.lookAt(look);
      if (progress === 1) {
        complete = move.complete;
        move = null;
      }
    }
    try {
      renderer.render(scene, camera);
    } catch {
      fail();
      return;
    }
    const projected = new THREE.Vector3();
    options.onAnchors(
      models.anchors.map(({ target, position }) => {
        projected.copy(position).project(camera);
        return {
          target,
          x: THREE.MathUtils.clamp((projected.x * 0.5 + 0.5) * 100, 6, 94),
          y: THREE.MathUtils.clamp((-projected.y * 0.5 + 0.5) * 100, 8, 92),
          visible:
            !move &&
            !complete &&
            projected.z > -1 &&
            projected.z < 1 &&
            Math.abs(projected.x) < 1.1 &&
            Math.abs(projected.y) < 1.1,
        };
      }),
    );
    if (!ready) {
      ready = true;
      options.onReady();
    }
    if (move) requestRender();
    complete?.();
  }

  function resize() {
    if (disposed) return;
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    const nextLayout =
      width <= 600 ? 'mobile' : width <= 1100 ? 'medium' : 'desktop';
    if (nextLayout !== layout) {
      layout = nextLayout;
      homeYaw = layout === 'mobile' ? 0.17 : layout === 'medium' ? 0.29 : 0.35;
      homePolar =
        layout === 'mobile' ? 1.14 : layout === 'medium' ? 1.18 : 1.23;
      homeLook.set(
        layout === 'mobile' ? -0.18 : -0.12,
        layout === 'mobile' ? 0.82 : 0.9,
        layout === 'mobile' ? 0.25 : 0.16,
      );
      yaw = homeYaw;
      polar = homePolar;
    }
    camera.fov = layout === 'mobile' ? 45 : layout === 'medium' ? 38 : 35;
    // Portrait frames fit the computer and three objects, not the furniture.
    // The desk edge, legs, and distant window may leave the frame.
    const mainObjectsFit =
      4.22 /
      (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    radius = Math.max(layout === 'mobile' ? 10.4 : 9.6, mainObjectsFit);
    camera.far = Math.max(120, radius * 3);
    camera.updateProjectionMatrix();
    fog.near = radius * 1.65;
    fog.far = radius * 5;
    if (!move) updateCamera();
    requestRender();
  }

  function highlight() {
    models.setHighlight(controlTarget ?? pointerTarget);
    requestRender();
  }

  function hover(target: SceneTarget | null) {
    if (pointerTarget === target) return;
    pointerTarget = target;
    canvas.style.cursor = target ? 'pointer' : 'grab';
    options.onHover(target);
    highlight();
  }

  function pick(event: PointerEvent): SceneTarget | null {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    camera.updateMatrixWorld();
    scene.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(models.pickables, false)[0];
    return hit ? (hit.object.userData.target as SceneTarget) : null;
  }

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0 || move || failed) return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw,
      polar,
      moved: false,
    };
    canvas.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent) {
    if (move || failed) return;
    if (drag && drag.id === event.pointerId) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.hypot(dx, dy) > 6) drag.moved = true;
      if (!drag.moved) return;
      hover(null);
      canvas.style.cursor = 'grabbing';
      yaw = THREE.MathUtils.clamp(
        drag.yaw - dx * 0.0024,
        homeYaw - (layout === 'mobile' ? 0.22 : 0.28),
        homeYaw + (layout === 'mobile' ? 0.22 : 0.28),
      );
      polar = THREE.MathUtils.clamp(
        drag.polar - dy * 0.0018,
        homePolar - 0.12,
        homePolar + 0.1,
      );
      updateCamera();
      requestRender();
    } else if (event.pointerType !== 'touch') hover(pick(event));
  }

  function pointerUp(event: PointerEvent) {
    const previous = drag;
    drag = null;
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    if (!previous || previous.id !== event.pointerId || move || failed) return;
    const selected = !previous.moved ? pick(event) : null;
    canvas.style.cursor = selected ? 'pointer' : 'grab';
    if (selected) options.onSelect(selected);
  }

  function pointerCancel() {
    if (drag && canvas.hasPointerCapture(drag.id))
      canvas.releasePointerCapture(drag.id);
    drag = null;
    hover(null);
    canvas.style.cursor = 'grab';
  }

  function pointerLeave() {
    if (!drag) hover(null);
  }

  function visibility() {
    if (document.hidden) {
      hiddenAt = performance.now();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pointerCancel();
    } else {
      if (move && hiddenAt) move.start += performance.now() - hiddenAt;
      hiddenAt = 0;
      requestRender();
    }
  }

  function fail() {
    if (disposed || failed) return;
    failed = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    move = null;
    options.onError();
  }

  function contextLost(event: Event) {
    event.preventDefault();
    fail();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerCancel);
  canvas.addEventListener('pointerleave', pointerLeave);
  canvas.addEventListener('webglcontextlost', contextLost);
  document.addEventListener('visibilitychange', visibility);
  canvas.style.cursor = 'grab';
  resize();

  return {
    setLamp(on) {
      if (disposed) return;
      models.setLamp(on);
      renderer.shadowMap.needsUpdate = true;
      requestRender();
    },
    setHighlight(target) {
      if (disposed) return;
      controlTarget = target;
      highlight();
    },
    reset() {
      if (disposed) return;
      move = null;
      yaw = homeYaw;
      polar = homePolar;
      updateCamera();
      requestRender();
    },
    enter(onComplete) {
      if (disposed || failed) return;
      if (options.reducedMotion) {
        onComplete();
        return;
      }
      move = {
        start: performance.now(),
        duration: 520,
        fromPosition: camera.position.clone(),
        toPosition: models.screenCenter
          .clone()
          .add(new THREE.Vector3(0.14, 0.16, 2.6)),
        fromLook: look.clone(),
        toLook: models.screenCenter.clone(),
        complete: onComplete,
      };
      hover(null);
      requestRender();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      move = null;
      observer.disconnect();
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerCancel);
      canvas.removeEventListener('pointerleave', pointerLeave);
      canvas.removeEventListener('webglcontextlost', contextLost);
      document.removeEventListener('visibilitychange', visibility);
      disposeScene(scene);
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
