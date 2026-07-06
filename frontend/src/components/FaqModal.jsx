import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import '@styles/faqModal.css';

const FAQS = [
  {
    question: '¿Cómo busco un arriendo?',
    answer: 'Ve a "Buscar Arriendos" en el menú lateral. Puedes filtrar por tipo de inmueble, precio y servicios incluidos (como internet).',
  },
  {
    question: '¿Cómo guardo una publicación para verla después?',
    answer: 'Toca el ícono de corazón en la esquina de cualquier aviso. Lo encontrarás después en "Mis Favoritos".',
  },
  {
    question: '¿Cómo contacto a un arrendador?',
    answer: 'Entra al detalle de la publicación que te interesa y toca "Contactar al Propietario". Se abrirá una conversación en tu bandeja de Mensajes.',
  },
  {
    question: '¿Puedo ocultar una conversación?',
    answer: 'Sí. Desde tu bandeja de Mensajes, toca el ícono de basurero junto a la conversación. Solo se oculta para ti; el otro participante la seguirá viendo.',
  },
  {
    question: '¿Cómo edito mi perfil?',
    answer: 'Ve a "Mi Perfil" en el menú lateral para actualizar tu información personal y tu foto de perfil.',
  },
];

export default function FaqModal({ open, onClose }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!open) return null;

  const toggleQuestion = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <div className="faq-bg" onClick={onClose}>
      <div className="faq-popup" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="faq-close" onClick={onClose} aria-label="Cerrar preguntas frecuentes">
          <X size={18} />
        </button>

        <h2>Preguntas frecuentes</h2>
        <p className="faq-subtitle">Resolvemos las dudas más comunes sobre ArriendU.</p>

        <div className="faq-list">
          {FAQS.map((faq, index) => {
            const isOpen = index === openIndex;
            return (
              <div key={faq.question} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                <button type="button" className="faq-question" onClick={() => toggleQuestion(index)}>
                  <span>{faq.question}</span>
                  <ChevronDown size={16} className="faq-chevron" />
                </button>
                {isOpen && <p className="faq-answer">{faq.answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
