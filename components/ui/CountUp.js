import { useState, useEffect, useRef } from 'react';

// Animated number counter — counts from `start` to `end` with easing when the
// element scrolls into view. Falls back to the final value if IntersectionObserver
// is unavailable (e.g. older browsers / SSR snapshot).
export default function CountUp({
  end,
  start = 0,
  duration = 1600,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = true,
}) {
  const [val, setVal] = useState(start);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    // If the target value arrives late (e.g. after a fetch resolves), reset the
    // guard so the counter re-animates to the new end instead of sticking at 0.
    started.current = false;
    const el = ref.current;
    if (!el) return;

    const animate = () => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setVal(start + (end - start) * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === 'undefined') {
      setVal(end);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          animate();
          obs.disconnect();
        }
      },
      // Fire as soon as any part of the number is visible (threshold 0) so
      // cards near the viewport edge aren't missed.
      { threshold: 0, rootMargin: '0px 0px -24px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, start, duration]);

  function format(n) {
    const rounded = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
    if (separator && decimals === 0) {
      return Number(rounded).toLocaleString('en-US');
    }
    return rounded;
  }

  return (
    <span ref={ref}>
      {prefix}
      {format(val)}
      {suffix}
    </span>
  );
}
