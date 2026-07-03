import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const EXIT_DURATION_MS = 160;
const REDUCED_EXIT_DURATION_MS = 160;
const ENTER_SETTLE_FALLBACK_MS = 500;

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
  const routeKey = `${location.pathname}${location.search}${location.hash}`;
  const displayedRouteKeyRef = useRef(routeKey);
  const latestChildrenRef = useRef(children);
  const timeoutRef = useRef(null);
  const [transitionState, setTransitionState] = useState(() => ({
    routeKey,
    children,
    phase: 'enter',
    variant: 'initial',
  }));
  const [settled, setSettled] = useState(false);

  latestChildrenRef.current = children;

  const handleAnimationEnd = () => {
    if (transitionState.phase === 'enter') {
      setSettled(true);
    }
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false;

    scrollToPageStart(containerRef.current, prefersReducedMotion);
    hasAnimatedRef.current = true;

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (transitionState.phase !== 'enter') return undefined;

    const fallbackTimer = window.setTimeout(() => {
      setSettled(true);
    }, ENTER_SETTLE_FALLBACK_MS);

    return () => clearTimeout(fallbackTimer);
  }, [transitionState]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false;
    const nextVariant = getTransitionVariant(navigationType, hasAnimatedRef.current);

    if (displayedRouteKeyRef.current === routeKey) {
      return;
    }

    clearTimeout(timeoutRef.current);
    setTransitionState((current) => ({
      ...current,
      phase: 'exit',
    }));

    timeoutRef.current = window.setTimeout(() => {
      displayedRouteKeyRef.current = routeKey;
      setSettled(false);
      setTransitionState({
        routeKey,
        children: latestChildrenRef.current,
        phase: 'enter',
        variant: nextVariant,
      });
      scrollToPageStart(containerRef.current, prefersReducedMotion);
    }, prefersReducedMotion ? REDUCED_EXIT_DURATION_MS : EXIT_DURATION_MS);
  }, [routeKey, navigationType]);

  const isAnimating = transitionState.phase === 'exit' || (transitionState.phase === 'enter' && !settled);
  const animationClassNames = isAnimating
    ? ` page-transition--${transitionState.phase} page-transition--${transitionState.variant}`
    : '';

  return (
    <div
      ref={containerRef}
      className={`page-transition${animationClassNames}${className ? ` ${className}` : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {transitionState.children}
    </div>
  );
}

export default PageTransition;
