import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import '@styles/faqModal.css';

const FAQS_ESTUDIANTE = [
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
    answer: 'Sí. Desde el chat, toca el ícono de tres puntos y elige "Ocultar chat". Solo se oculta para ti; el otro participante la seguirá viendo.',
  },
  {
    question: '¿Cómo se confirma que un arriendo se concretó?',
    answer: 'Tanto el arrendador como el estudiante deben tocar "Aceptar arriendo" desde el hilo de conversación correspondiente. El arriendo queda concretado recién cuando ambas partes aceptaron; mientras falte una, verás el mensaje de que sigue pendiente.',
  },
  {
    question: '¿Cómo edito mi perfil?',
    answer: 'Ve a "Mi Perfil" en el menú lateral para actualizar tu información personal y tu foto de perfil.',
  },
];

const FAQS_ARRENDADOR = [
  {
    question: '¿Cómo publico un inmueble?',
    answer: 'Ve a "Mis Publicaciones" en el menú lateral y toca "Publicar Inmueble". Completa título, tipo de inmueble, precio, ubicación, una foto y los servicios incluidos.',
  },
  {
    question: '¿Por qué no puedo publicar todavía?',
    answer: 'Tu cuenta debe estar verificada por un administrador antes de crear publicaciones. Revisa el estado de tu verificación desde "Mi Perfil".',
  },
  {
    question: '¿Cómo edito o elimino una publicación?',
    answer: 'Desde "Mis Publicaciones", usa los botones "Editar" o "Eliminar" en cada tarjeta. Eliminar una publicación es una acción permanente.',
  },
  {
    question: '¿Qué son las estadísticas de mi publicación?',
    answer: 'Toca "Estadísticas" en cualquiera de tus publicaciones para ver cuántas visitas, favoritos y conversaciones ha generado.',
  },
  {
    question: '¿Cómo respondo a un estudiante interesado?',
    answer: 'Ve a "Mensajes" en el menú lateral para ver y responder las conversaciones asociadas a cada una de tus publicaciones.',
  },
  {
    question: '¿Cómo se confirma que un arriendo se concretó?',
    answer: 'Tanto tú como el estudiante deben tocar "Aceptar arriendo" desde el hilo de conversación correspondiente. El arriendo queda concretado recién cuando ambas partes aceptaron.',
  },
  {
    question: '¿Cómo edito mi perfil?',
    answer: 'Ve a "Mi Perfil" en el menú lateral para actualizar tu información personal, teléfono y foto de perfil.',
  },
];

export default function FaqModal({ open, onClose, role }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!open) return null;

  const faqs = role === 'arrendador' ? FAQS_ARRENDADOR : FAQS_ESTUDIANTE;

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
          {faqs.map((faq, index) => {
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