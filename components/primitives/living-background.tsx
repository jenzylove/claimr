"use client";

// Living Background. A single full-viewport WebGL2 canvas running a fragment
// shader that renders a slow-flowing pink/blue noise field. Brand-colored,
// content-readable (dark base, low brightness), with subtle mouse parallax.
//
// This is the visual signature of the app. Mounted once per layout that
// wants it.
//
// Falls back gracefully: if WebGL2 isn't available, the canvas stays black
// and the rest of the UI is unaffected.

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

// iq's hash + noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  // Mouse parallax: shift the field slightly toward cursor
  vec2 mouseNorm = (u_mouse / u_resolution.xy) * 2.0 - 1.0;
  mouseNorm.y = -mouseNorm.y;
  p -= mouseNorm * 0.08;

  // Domain-warped flow field, very slow.
  float t = u_time * 0.04;
  vec2 q = vec2(
    fbm(p + vec2(0.0, t)),
    fbm(p + vec2(t, 0.0))
  );
  vec2 r = vec2(
    fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.5),
    fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.5)
  );
  float n = fbm(p + 4.0 * r);

  // Brand palette
  vec3 pink = vec3(1.0, 0.176, 0.478);    // #FF2D7A
  vec3 blue = vec3(0.176, 0.431, 1.0);    // #2D6EFF
  vec3 deep = vec3(0.018, 0.020, 0.055);  // near-black with cool tint

  // Compose
  vec3 col = mix(blue, pink, n);
  col = mix(deep, col, smoothstep(0.28, 0.72, n));

  // Heavy attenuation so foreground content stays primary
  col *= 0.22;

  // Subtle vignette darkens edges
  float vig = 1.0 - smoothstep(0.55, 1.45, length(p));
  col *= mix(0.65, 1.0, vig);

  // Slow breath: 0.92 -> 1.0 over 6s
  float breath = 0.92 + 0.08 * (0.5 + 0.5 * sin(u_time * 0.5));
  col *= breath;

  outColor = vec4(col, 1.0);
}
`;

interface Props {
  className?: string;
  /** When true, sits at zIndex -1 behind content. Default true. */
  behind?: boolean;
}

export function LivingBackground({ className = "", behind = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl) {
      // No WebGL2 — leave canvas black. UI keeps working.
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("[LivingBackground] shader error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[LivingBackground] link error:", gl.getProgramInfoLog(program));
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "a_position");
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const mouseLoc = gl.getUniformLocation(program, "u_mouse");

    gl.useProgram(program);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // Pause animation when tab is hidden. Saves a lot of battery.
    let visible = !document.hidden;
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      if (!visible) return;
      resize();
      const t = (performance.now() - start) / 1000;
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, t);
      gl.uniform2f(mouseLoc, mouseX * (window.devicePixelRatio || 1), mouseY * (window.devicePixelRatio || 1));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none ${className}`}
      style={behind ? { zIndex: -1 } : undefined}
      aria-hidden
    />
  );
}
