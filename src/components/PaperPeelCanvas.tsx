"use client";

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';

interface PaperMeshProps {
  color: string;
  isPeeling: boolean;
  isDragging: boolean;
  rotation: number;
}

function PaperMesh({ color, isPeeling, isDragging, rotation }: PaperMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Parse color gradient to get base color
  const baseColor = useMemo(() => {
    if (color === '#FEF08A' || color.toLowerCase() === 'yellow') {
      return new THREE.Color('#fff5cc');
    } else if (color === '#BBF7D0' || color.toLowerCase() === 'green') {
      return new THREE.Color('#d5f4d5');
    }
    return new THREE.Color(color);
  }, [color]);

  // Custom shader for realistic paper curl
  const shader = useMemo(() => ({
    uniforms: {
      uPeelAmount: { value: 0 },
      uTime: { value: 0 },
      uColor: { value: baseColor },
      uCreamColor: { value: new THREE.Color('#FFF8DC') },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vPeelStrength;
      
      uniform float uPeelAmount;
      uniform float uTime;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        
        // Define triangular peel region from BOTTOM-RIGHT corner
        // Triangle grows diagonally from (1,0) towards (0,1)
        float peelSize = uPeelAmount * 0.5; // Max 50% of note
        
        // Triangular mask: only peel if within triangle from bottom-right
        bool inPeelZone = (uv.x > (1.0 - peelSize)) && (uv.y < peelSize) && ((1.0 - uv.x) + uv.y < peelSize);
        
        if (inPeelZone && uPeelAmount > 0.01) {
          // Calculate strength based on distance from corner (even radial peel)
          float cornerDist = length(vec2(1.0 - uv.x, uv.y));
          float maxDist = peelSize * 1.414; // Diagonal distance
          float curlStrength = smoothstep(maxDist, 0.0, cornerDist);
          
          vPeelStrength = curlStrength;
          
          // Natural cylindrical curl - smooth and even
          float angle = curlStrength * 3.14159 * 0.6; // 108 degrees max
          float radius = 0.2;
          
          // Curl upward and backward from bottom-right
          pos.z += sin(angle) * radius;
          pos.x -= (1.0 - cos(angle)) * radius * 0.5;
          pos.y += (1.0 - cos(angle)) * radius * 0.3;
          
          // Subtle natural wrinkles
          float wrinkle = sin(cornerDist * 30.0 + uTime * 1.5) * 0.002 * curlStrength;
          pos.z += wrinkle;
          
          // Slight twist for realism
          float twist = curlStrength * 0.1;
          float c = cos(twist);
          float s = sin(twist);
          pos.xy = mat2(c, -s, s, c) * pos.xy;
        } else {
          vPeelStrength = 0.0;
        }
        
        vPosition = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vPeelStrength;
      
      uniform vec3 uColor;
      uniform vec3 uCreamColor;
      uniform float uPeelAmount;

      void main() {
        vec3 paperColor = uColor;
        
        // Show cream underside where paper is curled
        if (vPeelStrength > 0.1 && vNormal.z < 0.0) {
          // Radial gradient for cream underside
          float gradientFactor = smoothstep(0.0, 1.0, vPeelStrength);
          vec3 darkCream = uCreamColor * 0.85;
          paperColor = mix(uCreamColor, darkCream, gradientFactor * 0.3);
        } else {
          // Front face with slight gradient
          float lightVariation = 1.0 - (vUv.x * 0.05 + vUv.y * 0.03);
          paperColor *= lightVariation;
        }
        
        // Fresnel effect for edges
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
        vec3 finalColor = mix(paperColor, paperColor * 1.2, fresnel * 0.3);
        
        // Shadow under curl
        if (vPeelStrength > 0.05) {
          float shadow = 1.0 - (vPeelStrength * 0.25);
          finalColor *= shadow;
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  }), [baseColor]);

  // Animate peel amount with smooth interpolation
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const material = meshRef.current.material as THREE.ShaderMaterial;
    const target = (isPeeling || isDragging) ? 1.0 : 0.0;
    
    // Smooth spring-like interpolation
    material.uniforms.uPeelAmount.value = THREE.MathUtils.lerp(
      material.uniforms.uPeelAmount.value,
      target,
      0.12
    );
    
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} rotation={[0, 0, rotation * (Math.PI / 180)]}>
      <planeGeometry args={[1.92, 1.92, 48, 48]} />
      <shaderMaterial
        {...shader}
        side={THREE.DoubleSide}
        transparent={false}
      />
    </mesh>
  );
}

interface PaperPeelCanvasProps {
  color: string;
  rotation: number;
  isPeeling: boolean;
  isDragging: boolean;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function PaperPeelCanvas({
  color,
  rotation,
  isPeeling,
  isDragging,
  onPointerEnter,
  onPointerLeave,
}: PaperPeelCanvasProps) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 5], zoom: 100, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ pointerEvents: 'none' }}
      >
        <PaperMesh
          color={color}
          isPeeling={isPeeling}
          isDragging={isDragging}
          rotation={rotation}
        />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 3, 5]} intensity={0.6} />
        <directionalLight position={[-3, -2, -5]} intensity={0.3} />
      </Canvas>
    </div>
  );
}
