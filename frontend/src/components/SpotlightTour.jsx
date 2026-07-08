import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { getPublicaciones } from '@services/publicacion.service.js';
import { getMisPublicaciones } from '@services/user.service.js';
import '@styles/spotlightTour.css';

const POLL_INTERVAL_MS = 150;
const POLL_TIMEOUT_MS = 6000;
const TOOLTIP_WIDTH = 320;
const VIEWPORT_MARGIN = 16;

export const ESTUDIANTE_STEPS = [
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
    id: 'comparar',
    route: '/buscar',
    selector: '[data-tour="comparar-btn"]',
    title: 'Compara publicaciones',
    text: 'Selecciona hasta tres publicaciones con este ícono y compáralas lado a lado antes de decidir.',
  },
  {
    id: 'contacto',
    dynamic: true,
    selector: '[data-tour="contactar-btn"]',
    title: 'Contacto seguro',
    text: 'Agenda una visita o habla directamente con el arrendador desde la plataforma.',
  },
];

export const ARRENDADOR_STEPS = [
  {
    id: 'publicar',
    route: '/mis-publicaciones',
    selector: '[data-tour="publicar-btn"]',
    title: 'Publica tu primer inmueble',
    text: 'Crea una publicación con fotos, precio y servicios incluidos para que los estudiantes te encuentren.',
  },
  {
    id: 'editar',
    route: '/mis-publicaciones',
    selector: '[data-tour="editar-btn"]',
    title: 'Edita cuando quieras',
    text: 'Actualiza el precio, las fotos o los datos de tu publicación en cualquier momento.',
    checkExists: async () => {
      const data = await getMisPublicaciones();
      return Array.isArray(data) && data.length > 0;
    },
  },
  {
    id: 'patrocinar',
    route: '/mis-publicaciones',
    selector: '[data-tour="patrocinar-btn"]',
    title: 'Destaca tu publicación',
    text: 'Patrocina tu aviso para que aparezca primero en las búsquedas. Elige entre 1 día, 1 semana o 1 mes de destaque.',
    checkExists: async () => {
      const data = await getMisPublicaciones();
      return Array.isArray(data) && data.length > 0;
    },
  },
  {
    id: 'eliminar',
    route: '/mis-publicaciones',
    selector: '[data-tour="eliminar-btn"]',
    title: 'Elimina si ya no está disponible',
    text: 'Si arrendaste la propiedad o ya no quieres publicarla, puedes eliminarla desde aquí. Esta acción no se puede deshacer.',
    checkExists: async () => {
      const data = await getMisPublicaciones();
      return Array.isArray(data) && data.length > 0;
    },
  },
  {
    id: 'estadisticas',
    route: '/mis-publicaciones',
    selector: '[data-tour="estadisticas-btn"]',
    title: 'Revisa tu desempeño',
    text: 'Consulta cuántas visitas, favoritos y conversaciones ha generado tu publicación.',
    checkExists: async () => {
      const data = await getMisPublicaciones();
      return Array.isArray(data) && data.length > 0;
    },
  },
  {
    id: 'mensajes',
    route: '/mis-publicaciones',
    selector: '[data-tour="mensajes-nav"]',
    title: 'Habla con tus interesados',
    text: 'Aquí verás y responderás los mensajes de los estudiantes interesados en tus propiedades.',
  },
  {
    id: 'historial',
    route: '/mis-publicaciones',
    selector: '[data-tour="historial-nav"]',
    title: 'Historial de arriendos',
    text: 'Aquí puedes ver el registro de todos los arriendos que has concretado en la plataforma.',
  },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function SpotlightTour({ active, onClose, onFinish, steps = ESTUDIANTE_STEPS }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [contactoPath, setContactoPath] = useState(null);
  const [pasosOmitidosIds, setPasosOmitidosIds] = useState([]);
  const cancelledRef = useRef(false);
  const directionRef = useRef(1); 

  useEffect(() => {
    if (active) {
      setStepIndex(0);
      setContactoPath(null);
      setPasosOmitidosIds([]);
      directionRef.current = 1;
    }
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;

    cancelledRef.current = false;
    setRect(null);
    const step = steps[stepIndex];
    if (!step) return undefined;

    const measure = (el) => {
      const box = el.getBoundingClientRect();
      setRect({
        top: box.top - 8,
        left: box.left - 8,
        width: box.width + 16,
        height: box.height + 16,
      });
    };

    const moverEnDireccion = () => {
      const siguienteIndice = stepIndex + directionRef.current;

      if (siguienteIndice < 0) {
        return;
      }

      if (siguienteIndice >= steps.length) {
        handleFinishTour();
        return;
      }

      setStepIndex(siguienteIndice);
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
        moverEnDireccion();
        return;
      }

      window.setTimeout(() => pollForElement(startedAt), POLL_INTERVAL_MS);
    };

    const prepareStep = async () => {
      if (step.checkExists) {
        const existe = await step.checkExists();
        if (cancelledRef.current) return;
          if (!existe) {
            setPasosOmitidosIds((prev) => (prev.includes(step.id) ? prev : [...prev, step.id]));
            moverEnDireccion();
            return;
          }
        }

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
      } else if (step.route && location.pathname !== step.route) {
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
  }, [active, stepIndex, location.pathname, steps]);

  useEffect(() => {
    if (!rect) return undefined;

    const step = steps[stepIndex];
    if (!step) return undefined;

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
  }, [Boolean(rect), stepIndex, steps]);

  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;

  const handleNext = () => {
    directionRef.current = 1;
    if (isLast) {
      handleFinishTour();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    directionRef.current = -1;
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

  const step = steps[stepIndex];
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

        <span className="spotlight-step-count">Paso {stepIndex + 1} de {steps.length}</span>
        <h3>{step.title}</h3>
        <p>{step.text}</p>

        {pasosOmitidosIds.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '10px 12px',
              marginTop: '4px',
              marginBottom: '4px',
            }}
          >
            <Info size={15} color="#b45309" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '12.5px', lineHeight: 1.4, color: '#92400e' }}>
              Se {pasosOmitidosIds.length === 1 ? 'omitió 1 paso' : `omitieron ${pasosOmitidosIds.length} pasos`} porque aún no tienes publicaciones. Podrás verlo{pasosOmitidosIds.length === 1 ? '' : 's'} cuando publiques tu primer inmueble.
            </span>
          </div>
        )}

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