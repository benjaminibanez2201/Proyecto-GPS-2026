import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { getPublicaciones } from '@services/publicacion.service.js';
import '@styles/spotlightTour.css';

const POLL_INTERVAL_MS = 150;
const POLL_TIMEOUT_MS = 6000;
const TOOLTIP_WIDTH = 320;
const VIEWPORT_MARGIN = 16;

const STEPS = [
  {
    id: 'filtros',
    route: '/buscar',
    selector: '.ba-filters-panel',
    title: 'Filtros a tu medida',
    text: 'Encuentra piezas con internet incluido o cerca de tu universidad aquí.',
  },
  {
    id: 'favoritos',
    route: '/buscar',
    selector: '[data-tour="favorito-btn"]',
    title: '¿Te gustó un aviso?',
    text: 'Guárdalo aquí para compararlo más tarde sin perderlo de vista.',
  },
  {
    id: 'contacto',
    dynamic: true,
    selector: '[data-tour="contactar-btn"]',
    title: 'Contacto seguro',
    text: 'Agenda una visita o habla directamente con el arrendador desde la plataforma.',
  },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function SpotlightTour({ active, onClose, onFinish }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [contactoPath, setContactoPath] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (active) {
      setStepIndex(0);
      setContactoPath(null);
    }
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;

    cancelledRef.current = false;
    setRect(null);
    const step = STEPS[stepIndex];

    const measure = (el) => {
      const box = el.getBoundingClientRect();
      setRect({
        top: box.top - 8,
        left: box.left - 8,
        width: box.width + 16,
        height: box.height + 16,
      });
    };

    const pollForElement = (startedAt) => {
      if (cancelledRef.current) return;

      const el = document.querySelector(step.selector);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        window.setTimeout(() => {
          if (cancelledRef.current) return;
          measure(el);
        }, 350);
        return;
      }

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        handleSkipStep();
        return;
      }

      window.setTimeout(() => pollForElement(startedAt), POLL_INTERVAL_MS);
    };

    const prepareStep = async () => {
      if (step.dynamic) {
        let targetPath = contactoPath;

        if (!targetPath) {
          const [data, error] = await getPublicaciones();
          if (cancelledRef.current) return;

          const list = Array.isArray(data) ? data : (data?.data || []);
          const primera = list[0];
          const publicId = primera?.publicId;

          if (error || !publicId) {
            handleFinishTour();
            return;
          }

          targetPath = `/publicacion/${publicId}`;
          setContactoPath(targetPath);
        }

        if (location.pathname !== targetPath) {
          navigate(targetPath);
          return;
        }
      } else if (location.pathname !== step.route) {
        navigate(step.route);
        return;
      }

      pollForElement(Date.now());
    };

    prepareStep();

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex, location.pathname]);

  useEffect(() => {
    if (!rect) return undefined;

    const step = STEPS[stepIndex];
    const update = () => {
      const el = document.querySelector(step.selector);
      if (el) {
        const box = el.getBoundingClientRect();
        setRect({
          top: box.top - 8,
          left: box.left - 8,
          width: box.width + 16,
          height: box.height + 16,
        });
      }
    };

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(rect), stepIndex]);

  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;

  const handleSkipStep = () => {
    if (isLast) {
      handleFinishTour();
    } else {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLast) {
      handleFinishTour();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (isFirst) return;
    setStepIndex((prev) => prev - 1);
  };

  const handleFinishTour = () => {
    onFinish?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  if (!active || !rect) return null;

  const step = STEPS[stepIndex];
  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const showBelow = spaceBelow > 220;
  const tooltipLeft = clamp(rect.left, VIEWPORT_MARGIN, window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN);
  const tooltipStyle = showBelow
    ? { top: rect.top + rect.height + 16, left: tooltipLeft }
    : { top: rect.top - 16, left: tooltipLeft, transform: 'translateY(-100%)' };

  return (
    <div className="spotlight-overlay">
      <div
        className="spotlight-hole"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
      />

      <div className="spotlight-tooltip" style={tooltipStyle}>
        <button type="button" className="spotlight-close" onClick={handleClose} aria-label="Cerrar tour">
          <X size={16} />
        </button>

        <span className="spotlight-step-count">Paso {stepIndex + 1} de {STEPS.length}</span>
        <h3>{step.title}</h3>
        <p>{step.text}</p>

        <div className="spotlight-actions">
          <button type="button" className="spotlight-btn spotlight-btn--ghost" onClick={handleClose}>
            Omitir
          </button>
          <div className="spotlight-actions__nav">
            {!isFirst && (
              <button type="button" className="spotlight-btn spotlight-btn--secondary" onClick={handlePrev}>
                <ArrowLeft size={15} /> Atrás
              </button>
            )}
            <button type="button" className="spotlight-btn spotlight-btn--primary" onClick={handleNext}>
              {isLast ? 'Listo' : 'Siguiente'}
              {!isLast && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
