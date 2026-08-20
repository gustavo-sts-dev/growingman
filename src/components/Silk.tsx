'use client';

import React, { forwardRef, useMemo, useRef, useLayoutEffect, CSSProperties } from 'react';
import { Canvas, useFrame, useThree, RootState } from '@react-three/fiber';
import { Color, Mesh, ShaderMaterial } from 'three';
import { IUniform } from 'three';

type NormalizedRGB = [number, number, number];

const hexToNormalizedRGB = (hex: string): NormalizedRGB => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
};

/** Escurece um hex por um fator, preservando o matiz. */
const scaleHex = (hex: string, factor: number): string =>
  `#${hexToNormalizedRGB(hex)
    .map((channel) =>
      Math.round(255 * Math.min(1, Math.max(0, channel * factor)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

interface UniformValue<T = number | Color> {
  value: T;
}

interface SilkUniforms {
  uSpeed: UniformValue<number>;
  uScale: UniformValue<number>;
  uNoiseIntensity: UniformValue<number>;
  uColor: UniformValue<Color>;
  uColorDark: UniformValue<Color>;
  uRotation: UniformValue<number>;
  uTime: UniformValue<number>;
  [uniform: string]: IUniform;
}

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform vec3  uColorDark;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float wave = sin(5.0 * (tex.x + tex.y +
                          cos(3.0 * tex.x + 5.0 * tex.y) +
                          0.02 * tOffset) +
                   sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  // Interpola entre as duas cores em vez de multiplicar uma só. Multiplicar
  // apenas escurece, então o tom das dobras ficava preso ao da crista — e num
  // fundo escuro tudo colapsava em preto. Com duas cores, cada extremo é
  // escolhido pelo tema.
  vec3 base = mix(uColorDark, uColor, 0.5 + 0.5 * wave);

  vec4 col = vec4(base, 1.0) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

interface SilkPlaneProps {
  uniforms: SilkUniforms;
}

const SilkPlane = forwardRef<Mesh, SilkPlaneProps>(function SilkPlane({ uniforms }, ref) {
  const { viewport } = useThree();

  useLayoutEffect(() => {
    const mesh = ref as React.MutableRefObject<Mesh | null>;
    if (mesh.current) {
      mesh.current.scale.set(viewport.width, viewport.height, 1);
    }
  }, [ref, viewport]);

  useFrame((_state: RootState, delta: number) => {
    const mesh = ref as React.MutableRefObject<Mesh | null>;
    if (mesh.current) {
      const material = mesh.current.material as ShaderMaterial & {
        uniforms: SilkUniforms;
      };
      material.uniforms.uTime.value += 0.1 * delta;
    }
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
});
SilkPlane.displayName = 'SilkPlane';

export interface SilkProps {
  speed?: number;
  scale?: number;
  /** Cor das cristas (as dobras iluminadas da seda). */
  color?: string;
  /** Cor dos vales. Sem ela, usa `color` escurecida — o visual de antes. */
  colorDark?: string;
  noiseIntensity?: number;
  rotation?: number;
  className?: string;
  style?: CSSProperties;
}

const Silk: React.FC<SilkProps> = ({
  speed = 5,
  scale = 1,
  color = '#7B7481',
  colorDark,
  noiseIntensity = 1.5,
  rotation = 0,
  className,
  style
}) => {
  const meshRef = useRef<Mesh>(null);

  const uniforms = useMemo<SilkUniforms>(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(color)) },
      // 0.2 era o piso da multiplicação antiga: sem colorDark, o visual não muda.
      uColorDark: { value: new Color(...hexToNormalizedRGB(colorDark ?? scaleHex(color, 0.2))) },
      uRotation: { value: rotation },
      uTime: { value: 0 }
    }),
    [speed, scale, noiseIntensity, color, colorDark, rotation]
  );

  return (
    <div className={className} style={style}>
      <Canvas dpr={[1, 2]} frameloop="always" style={{ width: '100%', height: '100%' }}>
        <SilkPlane ref={meshRef} uniforms={uniforms} />
      </Canvas>
    </div>
  );
};

export default Silk;
