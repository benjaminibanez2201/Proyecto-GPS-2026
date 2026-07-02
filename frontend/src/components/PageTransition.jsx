import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getTransitionVariant(navigationType, hasAnimated) {
  if (!hasAnimated) return 'initial';
  if (navigationType === 'POP') return 'back';
  if (navigationType === 'REPLACE') return 'replace';
  return 'forward';
}

function scrollToPageStart(element, prefersReducedMotion) {
  const scrollOptions = {
    top: 0,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  };
  const parent = element?.parentElement;

  if (parent && parent.scrollHeight > parent.clientHeight && typeof parent.scrollTo === 'function') {
    parent.scrollTo(scrollOptions);
    return;
  }

  window.scrollTo(scrollOptions);
}

function PageTransition({ children, className = '' }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const containerRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const routeKey = location.key || `${location.pathname}${location.search}${location.hash}`;
  const variant = getTransitionVariant(navigationType, hasAnimatedRef.current);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false;

    scrollToPageStart(containerRef.current, prefersReducedMotion);
    hasAnimatedRef.current = true;
  }, [routeKey]);

  return (
    <div
      key={routeKey}
      ref={containerRef}
      className={`page-transition page-transition--${variant}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}

export default PageTransition;
