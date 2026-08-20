'use client';

import React, { forwardRef, useMemo, useRef, useState, useLayoutEffect, CSSProperties } from 'react';
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

/** Aceita "#abc", "#aabbcc" ou "rgb(a, b, c)" — o que uma CSS var pode conter. */
const parseCssColor = (raw: string): string | null => {
  const value = raw.trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [r, g, b] = value.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  const rgb = value.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!rgb) return null;
  return `#${rgb.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
};

/**
 * Levanta o tom só o suficiente para o padrão aparecer.
 *
 * O shader faz `uColor * pattern` — multiplicação, então ele só ESCURECE. Um
 * fundo quase preto (#080808) vira preto uniforme e o Silk some. O piso aqui é
 * BAIXO de propósito: o Silk é textura de fundo, e precisa ficar perto da
 * luminância do fundo para não competir com o texto que o tema desenhou para
 * ele. Piso alto transforma o fundo em primeiro plano e o título vira silhueta.
 */
const ensureVisible = (hex: string, minLuminance = 0.1): string => {
  const [r, g, b] = hexToNormalizedRGB(hex);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (luminance >= minLuminance) return hex;

  const channel = (value: number) => {
    // Preto puro não tem matiz a preservar: vira cinza no piso definido.
    const lifted = luminance === 0 ? minLuminance : value * (minLuminance / luminance);
    return Math.round(255 * Math.min(1, lifted)).toString(16).padStart(2, '0');
  };

  return `#${channel(r)}${channel(g)}${channel(b)}`;
};

interface UniformValue<T = number | Color> {
  value: T;
}

interface SilkUniforms {
  uSpeed: UniformValue<number>;
  uScale: UniformValue<number>;
  uNoiseIntensity: UniformValue<number>;
  uColor: UniformValue<Color>;
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

  // A modulação original era fixa em 0.4 — o padrão variava de 0.2 a 1.0 do tom,
  // profundo demais para uma textura de fundo: as ondas escuras brigavam com o
  // texto por cima. uContrast deixa a profundidade sob controle do template.
  float pattern = 1.0 - uContrast * (0.5 - 0.5 * wave);

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
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
  /** Cor de fallback, usada antes da montagem ou se a var não resolver. */
  color?: string;
  /**
   * CSS var do tema de onde tirar a cor (ex.: "--theme-accent"). O shader
   * precisa de um valor concreto, então a var é resolvida no cliente.
   * `null` desliga a leitura e usa apenas `color`.
   */
  colorVar?: string | null;
  noiseIntensity?: number;
  rotation?: number;
  className?: string;
  style?: CSSProperties;
}

const Silk: React.FC<SilkProps> = ({
  speed = 5,
  scale = 1,
  color = '#7B7481',
  colorVar = '--theme-accent',
  noiseIntensity = 1.5,
  rotation = 0,
  className,
  style
}) => {
  const meshRef = useRef<Mesh>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [themeColor, setThemeColor] = useState<string | null>(null);

  // As vars do tema são injetadas no DOM pelo page.tsx do tenant, então só dá
  // para lê-las depois da montagem. Antes disso vale o fallback de `color`.
  useLayoutEffect(() => {
    if (!colorVar || !hostRef.current) return;
    const raw = getComputedStyle(hostRef.current).getPropertyValue(colorVar);
    const parsed = raw ? parseCssColor(raw) : null;
    if (parsed) setThemeColor(parsed);
  }, [colorVar]);

  const resolved = ensureVisible(themeColor ?? color);

  const uniforms = useMemo<SilkUniforms>(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(resolved)) },
      uRotation: { value: rotation },
      uTime: { value: 0 }
    }),
    [speed, scale, noiseIntensity, resolved, rotation]
  );

  return (
    <div ref={hostRef} className={className} style={style}>
      <Canvas dpr={[1, 2]} frameloop="always" style={{ width: '100%', height: '100%' }}>
        <SilkPlane ref={meshRef} uniforms={uniforms} />
      </Canvas>
    </div>
  );
};

export default Silk;
