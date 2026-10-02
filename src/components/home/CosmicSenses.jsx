"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Canvas,
  useFrame,
} from "@react-three/fiber";
import {  Sparkles,
  Stars,
} from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
} from "@react-three/postprocessing";
import {
  Suspense,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";

import "./cosmic-senses.css";

const senses = [
  {
    number: "01",
    name: "Sight",
    tag: "VISION",
    icon: "◉",
    href: "/meditations",
    color: "#8f969c",
    atmosphere: "#b8c7d1",
    radius: 2.55,
    size: 0.36,
    speed: 0.23,
    offset: 0.4,
  },
  {
    number: "02",
    name: "Sound",
    tag: "LISTEN",
    icon: "◌",
    href: "/classes",
    color: "#d5a66f",
    atmosphere: "#f3d7a2",
    radius: 3.35,
    size: 0.46,
    speed: 0.18,
    offset: 1.9,
  },
  {
    number: "03",
    name: "Touch",
    tag: "FEEL",
    icon: "✦",
    href: "/workshops",
    color: "#2f78a8",
    atmosphere: "#86c9e8",
    radius: 4.15,
    size: 0.52,
    speed: 0.15,
    offset: 3.15,
  },
  {
    number: "04",
    name: "Taste",
    tag: "SAVOR",
    icon: "◒",
    href: "/infinity",
    color: "#b44f32",
    atmosphere: "#e99668",
    radius: 5,
    size: 0.55,
    speed: 0.125,
    offset: 4.4,
    rings: true,
  },
  {
    number: "05",
    name: "Scent",
    tag: "BREATHE",
    icon: "✺",
    href: "/start-here",
    color: "#c59662",
    atmosphere: "#e2c28f",
    radius: 5.85,
    size: 0.48,
    speed: 0.105,
    offset: 5.3,
  },
  {
    number: "06",
    name: "Mind",
    tag: "REFLECT",
    icon: "∞",
    href: "/about",
    color: "#d1b477",
    atmosphere: "#f0dda9",
    radius: 6.7,
    size: 0.62,
    speed: 0.09,
    offset: 0.9,
  },
  {
    number: "07",
    name: "Awareness",
    tag: "AWAKEN",
    icon: "✧",
    href: "/infinity/membership",
    color: "#397aa0",
    atmosphere: "#7fc6df",
    radius: 7.55,
    size: 0.54,
    speed: 0.075,
    offset: 2.45,
  },
];

function Orbit({ radius }) {
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0,
      0,
      radius,
      radius * 0.42,
      0,
      Math.PI * 2,
      false,
      0
    );

    return curve
      .getPoints(160)
      .map(
        ([x, y]) =>
          new THREE.Vector3(x, 0, y)
      );
  }, [radius]);

  const geometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints(
        points
      ),
    [points]
  );

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        transparent
        opacity={0.17}
        color="#8fa6b8"
        depthWrite={false}
      />
    </line>
  );
}

function CentralSun() {
  const sunRef = useRef(null);
  const coronaRef = useRef(null);

  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y +=
        delta * 0.045;
    }

    if (coronaRef.current) {
      const pulse =
        1 +
        Math.sin(
          state.clock.elapsedTime * 0.8
        ) *
          0.035;

      coronaRef.current.scale.setScalar(
        pulse
      );
    }
  });

  return (
    <group>
      <mesh ref={sunRef}>
        <sphereGeometry args={[1.05, 96, 96]} />

        <meshStandardMaterial
          color="#ffbf62"
          emissive="#ff8b2c"
          emissiveIntensity={4.2}
          roughness={0.82}
          metalness={0}
        />
      </mesh>

      <mesh ref={coronaRef}>
        <sphereGeometry args={[1.18, 64, 64]} />

        <meshBasicMaterial
          color="#f9cf81"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      <pointLight
        color="#ffd9a0"
        intensity={155}
        distance={35}
        decay={2}
      />

      <pointLight
        color="#96cbe7"
        intensity={18}
        distance={16}
        decay={2}
      />
    </group>
  );
}

function SensePlanet({ sense, reduceMotion, onSelect }) {
  const orbitRef = useRef(null);
  const planetRef = useRef(null);
  const atmosphereRef = useRef(null);

  useFrame((state, delta) => {
    if (!orbitRef.current) return;

    const time = reduceMotion
      ? sense.offset
      : state.clock.elapsedTime *
          sense.speed +
        sense.offset;

    orbitRef.current.position.x =
      Math.cos(time) * sense.radius;

    orbitRef.current.position.z =
      Math.sin(time) *
      sense.radius *
      0.42;

    if (planetRef.current) {
      planetRef.current.rotation.y +=
        reduceMotion ? 0 : delta * 0.18;
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -=
        reduceMotion ? 0 : delta * 0.07;
    }
  });

  return (
    <>
      <Orbit radius={sense.radius} />

      <group ref={orbitRef}>
        <mesh
          ref={planetRef}
          onClick={() => onSelect(sense.href)}
          onPointerEnter={() => { document.body.style.cursor = "pointer"; }}
          onPointerLeave={() => { document.body.style.cursor = "default"; }}
          castShadow
          receiveShadow
        >
          <sphereGeometry
            args={[
              sense.size,
              64,
              64,
            ]}
          />

          <meshStandardMaterial
            color={sense.color}
            roughness={0.78}
            metalness={0.03}
          />
        </mesh>

        <mesh ref={atmosphereRef}>
          <sphereGeometry
            args={[
              sense.size * 1.07,
              48,
              48,
            ]}
          />

          <meshBasicMaterial
            color={sense.atmosphere}
            transparent
            opacity={0.13}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {sense.rings && (
          <mesh
            rotation={[
              Math.PI / 2.35,
              0.18,
              0,
            ]}
          >
            <ringGeometry
              args={[
                sense.size * 1.35,
                sense.size * 2.05,
                96,
              ]}
            />

            <meshStandardMaterial
              color="#cab88a"
              transparent
              opacity={0.56}
              roughness={0.9}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>
    </>
  );
}

function SpaceScene({ reduceMotion, onSelect }) {
  const universeRef = useRef(null);

  useFrame((state) => {
    if (
      reduceMotion ||
      !universeRef.current
    ) {
      return;
    }

    const targetX =
      state.pointer.y * 0.12;

    const targetY =
      state.pointer.x * 0.16;

    universeRef.current.rotation.x =
      THREE.MathUtils.lerp(
        universeRef.current.rotation.x,
        targetX,
        0.025
      );

    universeRef.current.rotation.y =
      THREE.MathUtils.lerp(
        universeRef.current.rotation.y,
        targetY,
        0.025
      );
  });

  return (
    <>

      <fog
        attach="fog"
        args={["#050b16", 14, 30]}
      />

      <ambientLight intensity={0.055} />

      <directionalLight position={[-8, 10, 8]} color="#b9d8ef" intensity={0.42} />

      <Stars
        radius={95}
        depth={55}
        count={5000}
        factor={2.8}
        saturation={0.25}
        fade
        speed={reduceMotion ? 0 : 0.12}
      />

      <Sparkles
        count={90}
        size={1.7}
        scale={[19, 11, 10]}
        speed={reduceMotion ? 0 : 0.08}
        opacity={0.25}
        color="#dbeafe"
      />

      <group
        ref={universeRef}
        rotation={[
          -0.16,
          -0.16,
          -0.05,
        ]}
      >
        <CentralSun />

        {senses.map((sense) => (
          <SensePlanet
            key={sense.number}
            sense={sense}
            reduceMotion={reduceMotion}
            onSelect={onSelect}
          />
        ))}
      </group>

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.35}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.6}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export default function CosmicSenses() {
  const router = useRouter();

  return (
    <section className="cosmic-hero">
      <div
        className="cosmic-nebula cosmic-nebula-one"
        aria-hidden="true"
      />

      <div
        className="cosmic-nebula cosmic-nebula-two"
        aria-hidden="true"
      />

      <div className="cosmic-shell">
        <div className="cosmic-copy">
          <p className="cosmic-kicker">
            AWAKEN / INNER COSMOS
          </p>

          <h2>
            Explore your{" "}
            <em>inner universe.</em>
          </h2>

          <p className="cosmic-description">
            Seven senses. Seven gateways.
            Choose a world and begin your
            journey inward.
          </p>

          <div className="cosmic-instruction">
            <span />
            Select a planet to begin
          </div>
        </div>

        <div className="cosmic-canvas-shell">
          <div
            className="cosmic-space-aura"
            aria-hidden="true"
          />

          <Suspense
            fallback={
              <div className="cosmic-loading">
                <span />
                Entering the inner cosmos…
              </div>
            }
          >
            <Canvas
              dpr={[1, 1.6]}
              camera={{
                position: [0, 8.5, 13.5],
                fov: 40,
                near: 0.1,
                far: 140,
              }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference:
                  "high-performance",
                toneMapping:
                  THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.05,
              }}
              shadows={false}
            >
              <SpaceScene
                reduceMotion={false}
                onSelect={(href) => router.push(href)}
              />
            </Canvas>
          </Suspense>
        </div>
      </div>

      <nav className="cosmic-sense-nav" aria-label="Explore the seven senses">
        {senses.map((sense) => (
          <Link key={sense.number} href={sense.href}>
            <small>{sense.number}</small>
            <span>{sense.name}</span>
          </Link>
        ))}
      </nav>
      <p className="cosmic-footer-hint">
        Click a planet to enter
      </p>
    </section>
  );
}