"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const COVER = "/three/scene-case/the-scene-you-cant-sit-with-us-cover.png";
const BACK = "/three/scene-case/the-scene-you-cant-sit-with-us-back-cover-v2.png";
const SPINE = "/three/scene-case/the-scene-case-spine.png";

type Disposable = { dispose: () => void };

export function GameCaseScene() {
  const { isSignedIn } = useAuth();
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const disposables: Disposable[] = [];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f7f5);

    const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.1, 100);
    camera.position.set(0, 0.02, 16.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.74;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute(
      "aria-label",
      "Open The Scene menu with the interactive videogame case",
    );
    renderer.domElement.setAttribute("role", "button");
    renderer.domElement.tabIndex = 0;
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.035);
    scene.environment = environment.texture;
    disposables.push(pmrem, environment);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.rotateSpeed = 0.72;
    controls.minDistance = 10.25;
    controls.maxDistance = 16.5;
    controls.minPolarAngle = Math.PI * 0.34;
    controls.maxPolarAngle = Math.PI * 0.66;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.target.set(0, 0.08, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d6cf, 0.38);
    scene.add(hemi);

    const key = new THREE.RectAreaLight(0xffffff, 2.6, 4.8, 7);
    key.position.set(-4.6, 5.2, 5.4);
    key.lookAt(0, 0, 0);
    scene.add(key);

    const fill = new THREE.RectAreaLight(0xf5ffe0, 1, 3.5, 5.5);
    fill.position.set(5.2, 0.6, 4.4);
    fill.lookAt(0, 0.2, 0);
    scene.add(fill);

    const rim = new THREE.RectAreaLight(0xe9f1ff, 4.5, 2.2, 5.5);
    rim.position.set(-3.8, 2.7, -4.8);
    rim.lookAt(0, 0, 0);
    scene.add(rim);

    const shadowLight = new THREE.DirectionalLight(0xfffdf7, 0.85);
    shadowLight.position.set(-3.5, 7.5, 5);
    shadowLight.castShadow = true;
    shadowLight.shadow.mapSize.set(2048, 2048);
    shadowLight.shadow.camera.left = -6;
    shadowLight.shadow.camera.right = 6;
    shadowLight.shadow.camera.top = 7;
    shadowLight.shadow.camera.bottom = -7;
    shadowLight.shadow.bias = -0.00015;
    shadowLight.shadow.radius = 5;
    shadowLight.shadow.blurSamples = 16;
    scene.add(shadowLight);

    const groundMaterial = new THREE.ShadowMaterial({
      color: 0x8c9185,
      opacity: 0.11,
      transparent: true,
    });
    const groundGeometry = new THREE.PlaneGeometry(15, 10);
    disposables.push(groundGeometry, groundMaterial);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.56;
    ground.position.z = 0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    const contactShadowCanvas = document.createElement("canvas");
    contactShadowCanvas.width = 512;
    contactShadowCanvas.height = 256;
    const contactShadowContext = contactShadowCanvas.getContext("2d");
    if (contactShadowContext) {
      const contactGradient = contactShadowContext.createRadialGradient(
        256,
        128,
        8,
        256,
        128,
        238,
      );
      contactGradient.addColorStop(0, "rgba(33,35,32,0.6)");
      contactGradient.addColorStop(0.28, "rgba(55,57,52,0.34)");
      contactGradient.addColorStop(0.7, "rgba(90,91,86,0.09)");
      contactGradient.addColorStop(1, "rgba(100,100,96,0)");
      contactShadowContext.fillStyle = contactGradient;
      contactShadowContext.fillRect(0, 0, 512, 256);
    }
    const contactShadowTexture = new THREE.CanvasTexture(contactShadowCanvas);
    const contactShadowMaterial = new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      toneMapped: false,
    });
    const contactShadowGeometry = new THREE.PlaneGeometry(4.65, 1.28);
    disposables.push(
      contactShadowTexture,
      contactShadowMaterial,
      contactShadowGeometry,
    );
    const contactShadow = new THREE.Mesh(
      contactShadowGeometry,
      contactShadowMaterial,
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0.18, -2.552, 0.12);
    contactShadow.renderOrder = 1;
    scene.add(contactShadow);

    const caseRoot = new THREE.Group();
    const caseModel = new THREE.Group();
    caseRoot.add(caseModel);
    scene.add(caseRoot);

    const textureLoader = new THREE.TextureLoader();
    let stopped = false;

    const loadTexture = (url: string) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load(url, resolve, undefined, reject);
      });

    const makeWearTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1125;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(255,255,255,0.82)";
      ctx.lineCap = "round";

      let seed = 1741;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let i = 0; i < 20; i += 1) {
        const edge = i % 4;
        const edgeBias = 14 + random() * 48;
        let x = random() * canvas.width;
        let y = random() * canvas.height;
        if (edge === 0) y = edgeBias;
        if (edge === 1) x = canvas.width - edgeBias;
        if (edge === 2) y = canvas.height - edgeBias;
        if (edge === 3) x = edgeBias;
        const length = 28 + random() * 105;
        const angle = random() * Math.PI * 2;
        ctx.lineWidth = 0.45 + random() * 0.75;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
          x + Math.cos(angle + 0.25) * length * 0.5,
          y + Math.sin(angle + 0.25) * length * 0.5,
          x + Math.cos(angle) * length,
          y + Math.sin(angle) * length,
        );
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    Promise.all([loadTexture(COVER), loadTexture(BACK), loadTexture(SPINE)])
      .then(([frontTexture, backTexture, spineTexture]) => {
        if (stopped) {
          frontTexture.dispose();
          backTexture.dispose();
          spineTexture.dispose();
          return;
        }

        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
        [frontTexture, backTexture, spineTexture].forEach((texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(16, maxAnisotropy);
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          disposables.push(texture);
        });

        // The supplied spine PNG includes white production padding. This UV
        // window selects the complete printed strip without resampling it.
        spineTexture.wrapS = THREE.ClampToEdgeWrapping;
        spineTexture.repeat.set(0.168, 1);
        spineTexture.offset.set(0.416, 0);
        spineTexture.needsUpdate = true;

        const WIDTH = 4.0;
        const HEIGHT = 5.0;
        const DEPTH = 0.46;
        const PAPER_W = 3.89;
        const PAPER_H = 4.86;

        const blackMaterial = new THREE.MeshStandardMaterial({
          color: 0x090a09,
          roughness: 0.32,
          metalness: 0.02,
        });
        const paperFrontMaterial = new THREE.MeshStandardMaterial({
          map: frontTexture,
          color: new THREE.Color().setScalar(0.1),
          emissive: 0xffffff,
          emissiveMap: frontTexture,
          emissiveIntensity: 0.7,
          roughness: 0.38,
          metalness: 0,
          envMapIntensity: 0.14,
          side: THREE.FrontSide,
        });
        const paperBackMaterial = new THREE.MeshStandardMaterial({
          map: backTexture,
          color: new THREE.Color().setScalar(0.1),
          emissive: 0xffffff,
          emissiveMap: backTexture,
          emissiveIntensity: 0.7,
          roughness: 0.38,
          metalness: 0,
          envMapIntensity: 0.14,
          side: THREE.FrontSide,
        });
        const paperSpineMaterial = new THREE.MeshStandardMaterial({
          map: spineTexture,
          color: new THREE.Color().setScalar(0.1),
          emissive: 0xffffff,
          emissiveMap: spineTexture,
          emissiveIntensity: 0.7,
          roughness: 0.4,
          metalness: 0,
          envMapIntensity: 0.14,
          side: THREE.FrontSide,
        });
        const paperEdgeMaterial = new THREE.MeshStandardMaterial({
          color: 0xf3f1e9,
          roughness: 0.66,
          metalness: 0,
        });
        const plasticMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xe4e9ee,
          transparent: true,
          opacity: 0.34,
          transmission: 0.86,
          roughness: 0.025,
          metalness: 0,
          ior: 1.465,
          thickness: 0.12,
          attenuationColor: new THREE.Color(0xf0f5f8),
          attenuationDistance: 5,
          clearcoat: 1,
          clearcoatRoughness: 0.012,
          envMapIntensity: 3.15,
          specularIntensity: 1,
          specularColor: new THREE.Color(0xffffff),
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const seamMaterial = new THREE.LineBasicMaterial({
          color: 0x8d9aab,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        });
        const innerFrameMaterial = new THREE.MeshStandardMaterial({
          color: 0x111413,
          roughness: 0.28,
          metalness: 0.04,
          envMapIntensity: 0.35,
        });
        [
          blackMaterial,
          paperFrontMaterial,
          paperBackMaterial,
          paperSpineMaterial,
          paperEdgeMaterial,
          plasticMaterial,
          seamMaterial,
          innerFrameMaterial,
        ].forEach((material) => disposables.push(material));

        const coreGeometry = new RoundedBoxGeometry(WIDTH, HEIGHT, DEPTH, 10, 0.085);
        disposables.push(coreGeometry);
        const core = new THREE.Mesh(coreGeometry, blackMaterial);
        core.castShadow = true;
        core.receiveShadow = true;
        caseModel.add(core);

        const paperGeometry = new THREE.PlaneGeometry(PAPER_W, PAPER_H, 1, 1);
        disposables.push(paperGeometry);

        const front = new THREE.Mesh(paperGeometry, paperFrontMaterial);
        front.position.z = DEPTH / 2 + 0.012;
        front.receiveShadow = true;
        caseModel.add(front);

        const back = new THREE.Mesh(paperGeometry, paperBackMaterial);
        back.rotation.y = Math.PI;
        back.position.z = -DEPTH / 2 - 0.012;
        back.receiveShadow = true;
        caseModel.add(back);

        const spineGeometry = new THREE.PlaneGeometry(DEPTH + 0.06, PAPER_H);
        disposables.push(spineGeometry);
        const spine = new THREE.Mesh(spineGeometry, paperSpineMaterial);
        spine.rotation.y = -Math.PI / 2;
        spine.position.x = -WIDTH / 2 - 0.079;
        spine.renderOrder = 7;
        caseModel.add(spine);

        const horizontalEdgeGeometry = new THREE.BoxGeometry(PAPER_W, 0.018, 0.026);
        const verticalEdgeGeometry = new THREE.BoxGeometry(0.018, PAPER_H, 0.026);
        disposables.push(horizontalEdgeGeometry, verticalEdgeGeometry);
        [-1, 1].forEach((side) => {
          const edge = new THREE.Mesh(horizontalEdgeGeometry, paperEdgeMaterial);
          edge.position.set(0, side * (PAPER_H / 2), DEPTH / 2 + 0.017);
          caseModel.add(edge);
        });
        [-1, 1].forEach((side) => {
          const edge = new THREE.Mesh(verticalEdgeGeometry, paperEdgeMaterial);
          edge.position.set(side * (PAPER_W / 2), 0, DEPTH / 2 + 0.017);
          caseModel.add(edge);
        });

        // Molded clear rails keep the plastic concentrated at the perimeter,
        // where real cases show thickness, refraction, and bright edge light.
        const railDepth = DEPTH + 0.14;
        const innerHorizontalRailGeometry = new RoundedBoxGeometry(
          WIDTH + 0.025,
          0.07,
          DEPTH + 0.025,
          5,
          0.025,
        );
        const innerVerticalRailGeometry = new RoundedBoxGeometry(
          0.07,
          HEIGHT - 0.025,
          DEPTH + 0.025,
          5,
          0.025,
        );
        const horizontalRailGeometry = new RoundedBoxGeometry(
          WIDTH + 0.13,
          0.11,
          railDepth,
          7,
          0.045,
        );
        const verticalRailGeometry = new RoundedBoxGeometry(
          0.12,
          HEIGHT - 0.03,
          railDepth,
          7,
          0.045,
        );
        disposables.push(
          innerHorizontalRailGeometry,
          innerVerticalRailGeometry,
          horizontalRailGeometry,
          verticalRailGeometry,
        );
        [-1, 1].forEach((side) => {
          const rail = new THREE.Mesh(
            innerHorizontalRailGeometry,
            innerFrameMaterial,
          );
          rail.position.y = side * (HEIGHT / 2 - 0.012);
          caseModel.add(rail);
        });
        [-1, 1].forEach((side) => {
          const rail = new THREE.Mesh(innerVerticalRailGeometry, innerFrameMaterial);
          rail.position.x = side * (WIDTH / 2 - 0.012);
          caseModel.add(rail);
        });
        [-1, 1].forEach((side) => {
          const rail = new THREE.Mesh(horizontalRailGeometry, plasticMaterial);
          rail.position.y = side * (HEIGHT / 2 + 0.015);
          rail.castShadow = true;
          rail.renderOrder = 5;
          caseModel.add(rail);
        });
        [-1, 1].forEach((side) => {
          const rail = new THREE.Mesh(verticalRailGeometry, plasticMaterial);
          rail.position.x = side * (WIDTH / 2 + 0.015);
          rail.castShadow = true;
          rail.renderOrder = 5;
          caseModel.add(rail);
        });

        const rimGeometry = new RoundedBoxGeometry(
          WIDTH + 0.08,
          HEIGHT + 0.08,
          DEPTH + 0.09,
          10,
          0.095,
        );
        disposables.push(rimGeometry);
        const edgeGeometry = new THREE.EdgesGeometry(rimGeometry, 28);
        disposables.push(edgeGeometry);
        const seams = new THREE.LineSegments(edgeGeometry, seamMaterial);
        seams.renderOrder = 6;
        caseModel.add(seams);

        const highlightMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.38,
          depthWrite: false,
          toneMapped: false,
        });
        const topHighlightGeometry = new THREE.BoxGeometry(
          WIDTH - 0.2,
          0.016,
          0.018,
        );
        const sideHighlightGeometry = new THREE.BoxGeometry(
          0.016,
          HEIGHT - 0.22,
          0.018,
        );
        disposables.push(
          highlightMaterial,
          topHighlightGeometry,
          sideHighlightGeometry,
        );
        const topHighlight = new THREE.Mesh(topHighlightGeometry, highlightMaterial);
        topHighlight.position.set(0, HEIGHT / 2 + 0.046, DEPTH / 2 + 0.085);
        topHighlight.renderOrder = 10;
        caseModel.add(topHighlight);
        const sideHighlight = new THREE.Mesh(sideHighlightGeometry, highlightMaterial);
        sideHighlight.position.set(
          WIDTH / 2 + 0.046,
          0,
          DEPTH / 2 + 0.085,
        );
        sideHighlight.renderOrder = 10;
        caseModel.add(sideHighlight);

        const sleeveGeometry = new RoundedBoxGeometry(
          WIDTH + 0.025,
          HEIGHT + 0.025,
          0.022,
          9,
          0.07,
        );
        disposables.push(sleeveGeometry);
        const sleeveMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.045,
          transmission: 0,
          roughness: 0.02,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.01,
          envMapIntensity: 3.4,
          specularIntensity: 1,
          specularColor: new THREE.Color(0xffffff),
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        disposables.push(sleeveMaterial);
        const frontSleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
        frontSleeve.position.z = DEPTH / 2 + 0.045;
        frontSleeve.renderOrder = 7;
        caseModel.add(frontSleeve);

        const backSleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
        backSleeve.position.z = -DEPTH / 2 - 0.045;
        backSleeve.renderOrder = 7;
        caseModel.add(backSleeve);

        const spineSleeveGeometry = new THREE.PlaneGeometry(
          DEPTH + 0.105,
          HEIGHT - 0.015,
        );
        disposables.push(spineSleeveGeometry);
        const spineSleeve = new THREE.Mesh(spineSleeveGeometry, sleeveMaterial);
        spineSleeve.rotation.y = -Math.PI / 2;
        spineSleeve.position.x = -WIDTH / 2 - 0.084;
        spineSleeve.renderOrder = 8;
        caseModel.add(spineSleeve);

        const wearTexture = makeWearTexture();
        if (wearTexture) {
          wearTexture.anisotropy = Math.min(16, maxAnisotropy);
          disposables.push(wearTexture);
          const wearMaterial = new THREE.MeshBasicMaterial({
            map: wearTexture,
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });
          disposables.push(wearMaterial);
          const wear = new THREE.Mesh(paperGeometry, wearMaterial);
          wear.scale.set(1.024, 1.024, 1);
          wear.position.z = DEPTH / 2 + 0.064;
          wear.renderOrder = 9;
          caseModel.add(wear);
        }

        const hingeGeometry = new RoundedBoxGeometry(
          0.11,
          HEIGHT - 0.16,
          DEPTH + 0.15,
          5,
          0.035,
        );
        disposables.push(hingeGeometry);
        const hinge = new THREE.Mesh(hingeGeometry, plasticMaterial);
        hinge.position.x = -WIDTH / 2 - 0.005;
        hinge.renderOrder = 7;
        caseModel.add(hinge);

        const latchGeometry = new RoundedBoxGeometry(
          0.055,
          0.78,
          DEPTH + 0.125,
          4,
          0.02,
        );
        disposables.push(latchGeometry);
        [-1.55, 1.55].forEach((y) => {
          const latch = new THREE.Mesh(latchGeometry, plasticMaterial);
          latch.position.set(WIDTH / 2 + 0.016, y, 0);
          latch.renderOrder = 7;
          caseModel.add(latch);
        });

        caseModel.rotation.set(-0.018, 0.31, -0.012);
        caseModel.position.y = 0.035;
        setReady(true);
      })
      .catch(() => {
        if (!stopped) setReady(true);
      });

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    const pointerDownPosition = new THREE.Vector2();
    const hitPointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let interacting = false;
    let dragged = false;
    let interactionTimer = 0;
    const clock = new THREE.Clock();
    let frame = 0;

    const caseIsHit = (clientX: number, clientY: number) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      hitPointer.set(
        ((clientX - bounds.left) / bounds.width) * 2 - 1,
        -((clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(hitPointer, camera);
      return raycaster.intersectObject(caseModel, true).length > 0;
    };

    const toggleMenu = () => {
      setMenuOpen((open) => {
        const next = !open;
        menuOpenRef.current = next;
        renderer.domElement.setAttribute(
          "aria-label",
          next
            ? "Close The Scene menu with the interactive videogame case"
            : "Open The Scene menu with the interactive videogame case",
        );
        return next;
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointerTarget.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointerTarget.y = -((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      if (
        interacting &&
        pointerDownPosition.distanceTo(
          new THREE.Vector2(event.clientX, event.clientY),
        ) > 8
      ) {
        dragged = true;
      }
      if (!interacting) {
        renderer.domElement.style.cursor = caseIsHit(event.clientX, event.clientY)
          ? "pointer"
          : "grab";
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      interacting = true;
      dragged = false;
      pointerDownPosition.set(event.clientX, event.clientY);
      renderer.domElement.style.cursor = "grabbing";
      window.clearTimeout(interactionTimer);
    };
    const onPointerUp = (event: PointerEvent) => {
      renderer.domElement.style.cursor = caseIsHit(event.clientX, event.clientY)
        ? "pointer"
        : "grab";
      window.clearTimeout(interactionTimer);
      interactionTimer = window.setTimeout(() => {
        interacting = false;
      }, 1700);
    };
    const onCanvasClick = (event: MouseEvent) => {
      if (!dragged && caseIsHit(event.clientX, event.clientY)) toggleMenu();
    };
    const onCanvasKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleMenu();
      }
    };
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("click", onCanvasClick);
    renderer.domElement.addEventListener("keydown", onCanvasKeyDown);
    window.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const render = () => {
      frame = window.requestAnimationFrame(render);
      const elapsed = clock.getElapsedTime();
      pointer.lerp(pointerTarget, 0.035);
      const targetX = menuOpenRef.current
        ? mount.clientWidth < 760
          ? -0.74
          : -1.18
        : 0;
      caseRoot.position.x = THREE.MathUtils.lerp(
        caseRoot.position.x,
        targetX,
        0.075,
      );
      if (!interacting) {
        caseRoot.rotation.y = Math.sin(elapsed * 0.42) * 0.035 + pointer.x * 0.018;
        caseRoot.rotation.x = Math.sin(elapsed * 0.34) * 0.008 - pointer.y * 0.012;
        caseRoot.position.y = Math.sin(elapsed * 0.62) * 0.018;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(interactionTimer);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("click", onCanvasClick);
      renderer.domElement.removeEventListener("keydown", onCanvasKeyDown);
      window.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const menuItems = [
    { href: "/#landing-game", label: "Start exploring", number: "01" },
    { href: "/sign-up", label: "Start your streak", number: "02" },
    { href: isSignedIn ? "/dashboard" : "/sign-in", label: "Dashboard", number: "03" },
    { href: "/sign-in", label: "Sign in", number: "04" },
  ];

  return (
    <main className="studio-shell" aria-label="The Scene interactive case">
      <section
        ref={mountRef}
        className={`product-stage ${menuOpen ? "product-stage--menu-open" : ""}`}
        aria-busy={!ready}
        aria-label="The Scene game case viewer and main menu. Drag to rotate and scroll to zoom."
      >
        <div className={`loader ${ready ? "loader--hidden" : ""}`} aria-hidden="true">
          <span />
        </div>
        <p className="sr-only">
          A glossy early-2000s videogame case featuring the supplied front,
          back, and spine artwork. Drag to rotate the case and scroll to zoom.
        </p>
        <p className="menu-instruction" aria-live="polite">
          {menuOpen
            ? "CLICK THE GAME CASE TO CLOSE"
            : "CLICK THE GAME CASE FOR MENU"}
        </p>
        <nav
          className="case-menu"
          aria-label="The Scene menu"
          aria-hidden={!menuOpen}
          onClick={(event) => event.stopPropagation()}
        >
          <span className="case-menu__label">The Scene menu</span>
          {menuItems.map((item) => (
            <Link
              key={item.href + item.number}
              href={item.href}
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => setMenuOpen(false)}
            >
              <span>{item.number}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
