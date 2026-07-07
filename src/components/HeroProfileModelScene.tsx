"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type SceneProps = {
  url: string;
  className?: string;
  onReady?: () => void;
  onError?: () => void;
};

function fitModelToView(model: THREE.Object3D, targetHeight = 1.85) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const scale = targetHeight / Math.max(size.y, 0.001);
  model.scale.setScalar(scale);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
  model.position.x -= scaledCenter.x;
  model.position.y -= scaledBox.min.y;
  model.position.z -= scaledCenter.z;
}

function neutralizeModelMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of mats) {
      if (!mat) continue;
      if ("emissive" in mat && mat.emissive instanceof THREE.Color) {
        mat.emissive.setHex(0x000000);
      }
      if ("metalness" in mat && typeof mat.metalness === "number") {
        mat.metalness = Math.min(mat.metalness, 0.35);
      }
      mat.needsUpdate = true;
    }
  });
}

export function HeroProfileModelScene({ url, className, onReady, onError }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let animId = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let modelRoot: THREE.Object3D | null = null;

    const fail = () => {
      if (!disposed) onErrorRef.current?.();
    };

    const setup = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.background = "transparent";
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0, 0.9, 2.8);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.2;
      controls.target.set(0, 0.85, 0);
      controls.minPolarAngle = Math.PI / 2 - 0.55;
      controls.maxPolarAngle = Math.PI / 2 + 0.55;

      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const key = new THREE.DirectionalLight(0xfff8f0, 1.35);
      key.position.set(2.5, 4, 3.5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xe8e8ea, 0.65);
      fill.position.set(-3, 2, 2);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffffff, 0.55);
      rim.position.set(0, 2.5, -3);
      scene.add(rim);

      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          if (disposed || !renderer || !controls || !camera) return;

          modelRoot = gltf.scene;
          neutralizeModelMaterials(modelRoot);
          fitModelToView(modelRoot);
          scene.add(modelRoot);

          const animate = () => {
            if (disposed || !renderer || !controls || !camera) return;
            animId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
          };
          animate();
          onReadyRef.current?.();
        },
        undefined,
        () => fail(),
      );
    };

    setup();

    const ro = new ResizeObserver(() => {
      if (!renderer || !camera || !container) return;
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls?.dispose();
      modelRoot?.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => mat.dispose());
        }
      });
      renderer?.dispose();
      if (renderer?.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [url]);

  return <div ref={containerRef} className={className} style={{ touchAction: "none" }} />;
}
