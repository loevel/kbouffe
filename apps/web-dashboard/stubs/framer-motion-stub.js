// Minimal framer-motion stub for Cloudflare Workers SSR.
// Animations run client-side (via static chunks). This stub avoids
// bundling 260 KB of motion code into the server bundle.

import { createElement, forwardRef } from "react";

const tags = ["div","span","p","a","button","ul","li","ol","img","svg","path","h1","h2","h3","h4","h5","h6","section","article","header","footer","main","nav","aside","form","input","label","table","thead","tbody","tr","td","th"];

const MOTION_PROPS = new Set([
  "initial","animate","exit","variants","transition","whileHover","whileTap",
  "whileFocus","whileDrag","whileInView","drag","dragConstraints","dragElastic",
  "dragMomentum","dragTransition","dragDirectionLock","onDragStart","onDragEnd",
  "onDrag","onAnimationStart","onAnimationComplete","onUpdate","layout",
  "layoutId","layoutDependency","layoutScroll","layoutRoot","inherit","custom",
  "onViewportEnter","onViewportLeave","viewport","transformTemplate",
]);

const noopMotion = new Proxy({}, {
  get: (_, tag) => forwardRef(({ children, ...props }, ref) => {
    const domProps = {};
    for (const key in props) {
      if (!MOTION_PROPS.has(key)) domProps[key] = props[key];
    }
    return createElement(tag || "div", { ...domProps, ref }, children);
  })
});
tags.forEach(tag => { noopMotion[tag] = noopMotion[tag]; });

export const motion = noopMotion;
export const AnimatePresence = ({ children }) => children;
export const MotionConfig = ({ children }) => children;
export const LazyMotion = ({ children }) => children;
export const m = noopMotion;
export const useAnimation = () => ({ start: () => {}, stop: () => {}, set: () => {} });
export const useMotionValue = (v) => ({ get: () => v, set: () => {}, onChange: () => () => {} });
export const useTransform = (v, input, output) => ({ get: () => output?.[0] ?? 0, set: () => {} });
export const useSpring = (v) => ({ get: () => v, set: () => {} });
export const useScroll = () => ({ scrollY: { get: () => 0 }, scrollX: { get: () => 0 } });
export const useInView = () => false;
export const useReducedMotion = () => true;
export const useDragControls = () => ({});
export const useAnimate = () => [null, () => Promise.resolve()];
export const animate = () => ({ stop: () => {} });
export const stagger = () => 0;
export const spring = () => {};
export const easeIn = [0.4, 0, 1, 1];
export const easeOut = [0, 0, 0.2, 1];
export const easeInOut = [0.4, 0, 0.2, 1];
export default { motion, AnimatePresence, useAnimation, useMotionValue };
