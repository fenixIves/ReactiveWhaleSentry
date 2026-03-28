"use client";
import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// GLSL Shader for ocean wave effect
const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec2 vUv;
  varying float vElevation;
  
  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Create ocean wave effect using noise
    float noise1 = snoise(vec3(pos.x * 0.3, pos.y * 0.3, uTime * 0.2));
    float noise2 = snoise(vec3(pos.x * 0.6 + 100.0, pos.y * 0.6, uTime * 0.15));
    float noise3 = snoise(vec3(pos.x * 1.2, pos.y * 1.2 + 100.0, uTime * 0.1));
    
    // Mouse interaction
    float dist = distance(uv, uMouse);
    float mouseInfluence = smoothstep(0.5, 0.0, dist) * 0.2;
    
    // Combine noise layers for ocean waves
    float elevation = noise1 * 0.5 + noise2 * 0.25 + noise3 * 0.125 + mouseInfluence;
    
    pos.z += elevation;
    vElevation = elevation;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  
  void main() {
    // Deep ocean blue base
    vec3 deepColor = vec3(0.0, 0.1, 0.2);
    
    // Ocean blue mid-tone
    vec3 oceanColor = vec3(0.0, 0.4, 0.8);
    
    // Cyan highlight
    vec3 highlightColor = vec3(0.0, 0.83, 1.0);
    
    // White foam for crests
    vec3 foamColor = vec3(0.9, 0.98, 1.0);
    
    // Create gradient based on elevation
    float mixFactor = smoothstep(-0.4, 0.6, vElevation);
    
    // Mix colors
    vec3 color = mix(deepColor, oceanColor, mixFactor);
    
    // Add cyan highlights for mid elevations
    float highlightFactor = smoothstep(0.2, 0.5, vElevation);
    color = mix(color, highlightColor, highlightFactor * 0.4);
    
    // Add white foam for high elevations
    float foamFactor = smoothstep(0.5, 0.7, vElevation);
    color = mix(color, foamColor, foamFactor * 0.6);
    
    // Add subtle grid pattern
    float gridX = step(0.98, fract(vUv.x * 40.0));
    float gridY = step(0.98, fract(vUv.y * 40.0));
    float grid = max(gridX, gridY) * 0.03;
    color += vec3(grid);
    
    // Vignette effect
    float vignette = 1.0 - length(vUv - 0.5) * 0.6;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

function OceanMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1 - e.clientY / window.innerHeight,
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Smooth mouse following
      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;
      material.uniforms.uMouse.value.x += (targetX - material.uniforms.uMouse.value.x) * 0.05;
      material.uniforms.uMouse.value.y += (targetY - material.uniforms.uMouse.value.y) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1, -3]}>
      <planeGeometry args={[viewport.width * 2.5, viewport.height * 2.5, 128, 128]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function WhaleSilhouette() {
  const whaleRef = useRef<THREE.Group>(null);
  const [isJumping, setIsJumping] = useState(false);
  const jumpStartTime = useRef(0);

  useEffect(() => {
    // Trigger whale jump every 8-12 seconds
    const scheduleJump = () => {
      const delay = 8000 + Math.random() * 4000;
      setTimeout(() => {
        setIsJumping(true);
        jumpStartTime.current = Date.now();
        setTimeout(() => setIsJumping(false), 4000);
        scheduleJump();
      }, delay);
    };
    scheduleJump();
  }, []);

  useFrame(() => {
    if (whaleRef.current && isJumping) {
      const elapsed = (Date.now() - jumpStartTime.current) / 1000;
      const progress = elapsed / 4;
      
      if (progress <= 1) {
        whaleRef.current.position.y = Math.sin(progress * Math.PI) * 3 - 2;
        whaleRef.current.position.x = (progress - 0.5) * 8;
        whaleRef.current.rotation.z = -Math.sin(progress * Math.PI) * 0.3;
        whaleRef.current.visible = progress > 0.05 && progress < 0.95;
      } else {
        whaleRef.current.visible = false;
      }
    } else if (whaleRef.current) {
      whaleRef.current.visible = false;
    }
  });

  // Simple whale shape using basic geometries
  return (
    <group ref={whaleRef} visible={false}>
      {/* Whale body */}
      <mesh>
        <capsuleGeometry args={[0.3, 1.5, 4, 8]} />
        <meshBasicMaterial color="#00D4FF" transparent opacity={0.6} />
      </mesh>
      {/* Whale tail */}
      <mesh position={[-1, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.4, 0.8, 3]} />
        <meshBasicMaterial color="#00D4FF" transparent opacity={0.5} />
      </mesh>
      {/* Whale fin */}
      <mesh position={[0.2, -0.3, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <coneGeometry args={[0.2, 0.5, 3]} />
        <meshBasicMaterial color="#00D4FF" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function BubbleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 150;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15 - 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      vel[i * 3] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 1] = Math.random() * 0.01 + 0.005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    
    return [pos, vel];
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      const positionsArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        positionsArray[i * 3] += velocities[i * 3];
        positionsArray[i * 3 + 1] += velocities[i * 3 + 1];
        positionsArray[i * 3 + 2] += velocities[i * 3 + 2];
        
        // Reset bubble when it reaches surface
        if (positionsArray[i * 3 + 1] > 8) {
          positionsArray[i * 3 + 1] = -8;
          positionsArray[i * 3] = (Math.random() - 0.5) * 20;
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        color="#00D4FF"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

export default function OceanBackground() {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 2, 6], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#000510']} />
        <fog attach="fog" args={['#000510', 8, 25]} />
        <OceanMesh />
        <WhaleSilhouette />
        <BubbleField />
        <ambientLight intensity={0.4} />
      </Canvas>
    </div>
  );
}
