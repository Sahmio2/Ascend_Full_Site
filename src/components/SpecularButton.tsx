import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type MouseEventHandler,
  type ReactNode,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import "./SpecularButton.css";

const PAD = 20;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { return sdRoundedRect(p, uHalfSize, uRadius); }

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);
  vec2 L = vec2(cos(uAngle), sin(uAngle));
  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;
  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;
  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`;

type SpecularSize = "sm" | "md" | "lg";

type EffectProps = {
  size?: SpecularSize;
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  textColor?: string;
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  className?: string;
  children?: ReactNode;
};

type LiveEffectProps = Required<
  Pick<
    EffectProps,
    | "radius"
    | "lineColor"
    | "baseColor"
    | "intensity"
    | "shineSize"
    | "shineFade"
    | "thickness"
    | "speed"
    | "followMouse"
    | "proximity"
    | "autoAnimate"
  >
>;

const effectDefaults: LiveEffectProps = {
  radius: 18,
  lineColor: "#ffffff",
  baseColor: "#525252",
  intensity: 1,
  shineSize: 10,
  shineFade: 40,
  thickness: 1,
  speed: 0.35,
  followMouse: true,
  proximity: 250,
  autoAnimate: false,
};

function useSpecularEffect(
  hostRef: RefObject<HTMLElement | null>,
  fxRef: RefObject<HTMLSpanElement | null>,
  effect: LiveEffectProps,
) {
  const propsRef = useRef(effect);

  useEffect(() => {
    propsRef.current = effect;
  }, [effect]);

  useEffect(() => {
    const host = hostRef.current;
    const fx = fxRef.current;
    if (!host || !fx) return;

    let renderer: Renderer;
    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
      });
      if (!context) {
        host.dataset.specularFallback = "true";
        return;
      }
      renderer = new Renderer({
        canvas,
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        dpr,
        webgl: 2,
      });
    } catch {
      host.dataset.specularFallback = "true";
      return;
    }

    const gl = renderer.gl;
    const dpr = renderer.dpr;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) delete geometry.attributes.uv;

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uCenter: { value: [0, 0] },
        uHalfSize: { value: [1, 1] },
        uRadius: { value: 0 },
        uAngle: { value: 2.4 },
        uPx: { value: dpr },
        uLineColor: { value: [1, 1, 1] },
        uBaseColor: { value: [0.32, 0.32, 0.32] },
        uIntensity: { value: 1 },
        uShineSize: { value: 0.17 },
        uShineFade: { value: 0.7 },
        uThickness: { value: 1 },
        uBaseWidth: { value: dpr },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    fx.appendChild(gl.canvas);

    const sizeRef = { w: 1, h: 1 };
    const resize = () => {
      const rect = host.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      sizeRef.w = w;
      sizeRef.h = h;
      renderer.setSize(w + PAD * 2, h + PAD * 2);
      program.uniforms.uCenter.value = [(PAD + w / 2) * dpr, (PAD + h / 2) * dpr];
      program.uniforms.uHalfSize.value = [(w / 2) * dpr, (h / 2) * dpr];
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pointerAngle: number | null = null;
    let proximityT = 0;
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
      const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
      const distance = Math.hypot(dx, dy);

      if (distance === 0) {
        const nx = (event.clientX - cx) / (rect.width / 2);
        const ny = (cy - event.clientY) / (rect.height / 2);
        pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15;
      } else {
        pointerAngle = Math.atan2(cy - event.clientY, event.clientX - cx);
      }

      const t = Math.max(0, 1 - distance / Math.max(propsRef.current.proximity, 1));
      proximityT = t * t * (3 - 2 * t);
    };

    if (!reduceMotion) window.addEventListener("pointermove", onPointerMove, { passive: true });

    let angle = 2.4;
    let idleAngle = 2.4;
    let brightness = reduceMotion ? 0.55 : 0;
    let last = performance.now();
    let animationFrame = 0;
    const line = new Color();
    const base = new Color();

    const update = (now: number) => {
      if (!reduceMotion) animationFrame = requestAnimationFrame(update);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const props = propsRef.current;

      idleAngle += props.speed * dt;
      const steer = props.followMouse && pointerAngle !== null && (!props.autoAnimate || proximityT > 0);
      const target = steer && pointerAngle !== null ? pointerAngle : idleAngle;
      const difference = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      angle += difference * (1 - Math.exp(-dt * 7));

      const brightnessTarget = reduceMotion ? 0.55 : props.autoAnimate ? 1 : proximityT;
      brightness += (brightnessTarget - brightness) * (1 - Math.exp(-dt * 8));

      line.set(props.lineColor);
      base.set(props.baseColor);
      program.uniforms.uAngle.value = angle;
      program.uniforms.uRadius.value = Math.min(props.radius, Math.min(sizeRef.w, sizeRef.h) / 2) * dpr;
      program.uniforms.uLineColor.value = [line.r, line.g, line.b];
      program.uniforms.uBaseColor.value = [base.r, base.g, base.b];
      program.uniforms.uIntensity.value = props.intensity * brightness;
      program.uniforms.uShineSize.value = (props.shineSize * Math.PI) / 180;
      program.uniforms.uShineFade.value = (props.shineFade * Math.PI) / 180;
      program.uniforms.uThickness.value = props.thickness * dpr;
      renderer.render({ scene: mesh });
    };
    animationFrame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      if (gl.canvas.parentNode === fx) fx.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [fxRef, hostRef]);
}

function useResolvedEffect(props: EffectProps): LiveEffectProps {
  return {
    radius: props.radius ?? effectDefaults.radius,
    lineColor: props.lineColor ?? effectDefaults.lineColor,
    baseColor: props.baseColor ?? effectDefaults.baseColor,
    intensity: props.intensity ?? effectDefaults.intensity,
    shineSize: props.shineSize ?? effectDefaults.shineSize,
    shineFade: props.shineFade ?? effectDefaults.shineFade,
    thickness: props.thickness ?? effectDefaults.thickness,
    speed: props.speed ?? effectDefaults.speed,
    followMouse: props.followMouse ?? effectDefaults.followMouse,
    proximity: props.proximity ?? effectDefaults.proximity,
    autoAnimate: props.autoAnimate ?? effectDefaults.autoAnimate,
  };
}

function surfaceStyle(props: EffectProps): CSSProperties {
  return {
    "--sb-radius": `${props.radius ?? effectDefaults.radius}px`,
    "--sb-tint": props.tint ?? "#ffffff",
    "--sb-tint-opacity": props.tintOpacity ?? 0,
    "--sb-blur": `${props.blur ?? 0}px`,
    "--sb-text-color": props.textColor ?? "#f5f5f5",
  } as CSSProperties;
}

function surfaceClass(size: SpecularSize, className: string) {
  return `specular-button specular-button--${size}${className ? ` ${className}` : ""}`;
}

export type SpecularButtonProps = EffectProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "color" | "style">;

export default function SpecularButton({
  children = "Get Started",
  size = "lg",
  radius = 18,
  tint = "#ffffff",
  tintOpacity = 0,
  blur = 0,
  textColor = "#f5f5f5",
  lineColor = "#ffffff",
  baseColor = "#525252",
  intensity = 1,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  disabled = false,
  onClick,
  className = "",
  type = "button",
  ...buttonProps
}: SpecularButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fxRef = useRef<HTMLSpanElement>(null);
  const effect = useResolvedEffect({ radius, lineColor, baseColor, intensity, shineSize, shineFade, thickness, speed, followMouse, proximity, autoAnimate });
  useSpecularEffect(buttonRef, fxRef, effect);

  return (
    <button
      {...buttonProps}
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={surfaceClass(size, className)}
      style={surfaceStyle({ radius, tint, tintOpacity, blur, textColor })}
    >
      <span ref={fxRef} className="specular-button__fx" aria-hidden="true" />
      <span className="specular-button__label">{children}</span>
    </button>
  );
}

export type SpecularLinkProps = EffectProps & {
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  ariaLabel?: string;
};

export function SpecularLink({
  children = "Get Started",
  href,
  size = "lg",
  radius = 18,
  tint = "#ffffff",
  tintOpacity = 0,
  blur = 0,
  textColor = "#f5f5f5",
  lineColor = "#ffffff",
  baseColor = "#525252",
  intensity = 1,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  onClick,
  className = "",
  ariaLabel,
}: SpecularLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const fxRef = useRef<HTMLSpanElement>(null);
  const effect = useResolvedEffect({ radius, lineColor, baseColor, intensity, shineSize, shineFade, thickness, speed, followMouse, proximity, autoAnimate });
  useSpecularEffect(linkRef, fxRef, effect);

  return (
    <Link
      ref={linkRef}
      to={href}
      onClick={onClick}
      aria-label={ariaLabel}
      className={surfaceClass(size, className)}
      style={surfaceStyle({ radius, tint, tintOpacity, blur, textColor })}
    >
      <span ref={fxRef} className="specular-button__fx" aria-hidden="true" />
      <span className="specular-button__label">{children}</span>
    </Link>
  );
}
