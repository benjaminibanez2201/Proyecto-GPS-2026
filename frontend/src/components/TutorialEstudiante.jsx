import { useEffect, useState } from 'react';
import { Rocket, Home, Heart, MessageCircle, History, User, X, ArrowRight, ArrowLeft } from 'lucide-react';
import '@styles/tutorial.css';

const STEPS = [
  {
    icon: Rocket,
    title: '¡Bienvenido a ArriendU!',
    description: 'Te mostramos rápidamente las secciones clave para que encuentres tu próximo arriendo sin complicaciones.',
  },
  {
    icon: Home,
    title: 'Buscar Arriendos',
    description: 'Explora publicaciones disponibles, filtra por ubicación y compara opciones desde "Buscar Arriendos" en el menú.',
  },
  {
    icon: Heart,
    title: 'Mis Favoritos',
    description: 'Guarda las publicaciones que te interesan para revisarlas más tarde sin perderlas de vista.',
  },
  {
    icon: MessageCircle,
    title: 'Mensajes',
    description: 'Contacta directamente al arrendador de una publicación y conversa sobre los detalles del arriendo.',
  },
  {
    icon: History,
    title: 'Historial de Arriendos',
    description: 'Revisa el estado de tus arriendos confirmados y las calificaciones asociadas.',
  },
  {
    icon: User,
    title: 'Mi Perfil',
    description: 'Mantén actualizada tu información personal y tu foto de perfil.',
  },
];

export default function TutorialEstudiante({ open, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const Icon = step.icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (isFirst) return;
    setStepIndex((prev) => prev - 1);
  };

  return (
    <div className="tutorial-bg">
      <div className="tutorial-popup">
        <button type="button" className="tutorial-close" onClick={onClose} aria-label="Cerrar tutorial">
          <X size={18} />
        </button>

        <div className="tutorial-icon">
          <Icon size={32} />
        </div>

        <h2>{step.title}</h2>
        <p>{step.description}</p>

        <div className="tutorial-dots">
          {STEPS.map((_, index) => (
            <span key={index} className={`tutorial-dot ${index === stepIndex ? 'is-active' : ''}`} />
          ))}
        </div>

        <div className="tutorial-actions">
          <button type="button" className="tutorial-btn tutorial-btn--ghost" onClick={onClose}>
            Omitir
          </button>
          <div className="tutorial-actions__nav">
            {!isFirst && (
              <button type="button" className="tutorial-btn tutorial-btn--secondary" onClick={handlePrev}>
                <ArrowLeft size={16} /> Atrás
              </button>
            )}
            <button type="button" className="tutorial-btn tutorial-btn--primary" onClick={handleNext}>
              {isLast ? 'Empezar' : 'Siguiente'}
              {!isLast && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
