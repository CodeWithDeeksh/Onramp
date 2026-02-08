/**
 * Performance Monitoring Utilities
 * Provides tools for measuring and optimizing frontend performance
 */

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string, callback: () => void): void {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    callback();
    const end = performance.now();
    const duration = end - start;

    if (duration > 16) {
      // Warn if render takes longer than one frame (16ms at 60fps)
      console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
    }
  } else {
    callback();
  }
}

/**
 * Debounce function for expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for rate-limiting expensive operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(img: HTMLImageElement): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          const src = target.dataset.src;
          if (src) {
            target.src = src;
            target.removeAttribute('data-src');
          }
          observer.unobserve(target);
        }
      });
    },
    {
      rootMargin: '50px',
    }
  );

  observer.observe(img);
}

/**
 * Report Web Vitals (Core Web Vitals)
 */
export function reportWebVitals(onPerfEntry?: (metric: any) => void): void {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Dynamic import with error handling
    // @ts-ignore - web-vitals is optional
    import('web-vitals')
      .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }: any) => {
        getCLS(onPerfEntry);
        getFID(onPerfEntry);
        getFCP(onPerfEntry);
        getLCP(onPerfEntry);
        getTTFB(onPerfEntry);
      })
      .catch(() => {
        // web-vitals not installed, skip reporting
        console.warn('[Performance] web-vitals package not installed');
      });
  }
}

/**
 * Prefetch data for a route
 */
export function prefetchRoute(url: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Optimize animation based on device capabilities
 */
export function getOptimizedAnimationDuration(baseDuration: number): number {
  if (prefersReducedMotion()) {
    return 0;
  }

  // Reduce animation duration on mobile for better performance
  if (window.innerWidth < 768) {
    return baseDuration * 0.7;
  }

  return baseDuration;
}

/**
 * Request idle callback wrapper with fallback
 */
export function requestIdleCallback(callback: () => void, timeout = 2000): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
