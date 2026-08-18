import { useEffect, useState } from "react";

export function useCountUp(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const done = (value: number) => (step >= 0 ? value >= target : value <= target);

    const timer = setInterval(() => {
      start += step;
      if (done(start)) {
        setCurrent(target);
        clearInterval(timer);
      } else {
        setCurrent(step >= 0 ? Math.floor(start) : Math.ceil(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return current;
}
