import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, RefreshCw, Inbox, ArrowLeft, UserRound, Sparkles, CheckCircle, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '@context/AuthContext';
import {
  enviarMensajeAPublicacion,
  obtenerConversaciones,
  obtenerDetalleConversacion,
  responderConversacion,
} from '@services/mensaje.service.js';
import { createArriendo, listarArriendos } from '@services/rentalsAndReviews.service.js';
import { getPublicacionPorId } from '@services/publicacion.service.js';
import '@styles/mensajes.css';

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatMessageTime(value) {
  if (!value) return '';

  return new Date(value).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMessageDay(value) {
  if (!value) return '';

  return new Date(value).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isSameDay(firstValue, secondValue) {
  if (!firstValue || !secondValue) return false;

  const firstDate = new Date(firstValue);
  const secondDate = new Date(secondValue);

  return firstDate.toDateString() === secondDate.toDateString();
}

function isSameSender(firstMessage, secondMessage) {
  return String(firstMessage?.remitente?.id) === String(secondMessage?.remitente?.id);
}

function getUnreadConversationBadgeCount(conversation, userRole) {
  const unreadCount = userRole === 'arrendador'
    ? Number(conversation?.noLeidosArrendador || 0)
    : Number(conversation?.noLeidosEstudiante || 0);

  return unreadCount > 0 ? 1 : 0;
}

function getOtherParticipant(conversacion, userId, userRole) {
  if (!conversacion) return null;

  if (userRole === 'arrendador') {
    return conversacion.estudiante || null;
  }

  return conversacion.arrendador || null;
}

function getConversationTitle(conversacion) {
  if (!conversacion?.publicacion) return 'Conversación';
  return conversacion.publicacion.titulo || `Publicación #${conversacion.publicacion.id}`;
}

export default function Mensajes() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const userRole = (user?.rol || '').toString().toLowerCase();
  const publicationIdParam = searchParams.get('publicacion');
  const conversationIdParam = searchParams.get('conversacion');

  const [publicacionObjetivo, setPublicacionObjetivo] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [composeText, setComposeText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [rentalForConversation, setRentalForConversation] = useState(null);
  const [loadingRentalConfirmation, setLoadingRentalConfirmation] = useState(false);

  const publicationTargetId = publicationIdParam ? Number(publicationIdParam) : null;
  const conversationTargetId = conversationIdParam ? Number(conversationIdParam) : null;

  const fetchConversations = async () => {
    setLoadingConversations(true);
    const [data, errorResponse] = await obtenerConversaciones();

    if (errorResponse) {
      setError(errorResponse);
      setConversations([]);
      setLoadingConversations(false);
      return [];
    }

    const ordered = Array.isArray(data)
      ? [...data].sort((a, b) => new Date(b?.ultimaFechaMensaje || b?.updatedAt || 0) - new Date(a?.ultimaFechaMensaje || a?.updatedAt || 0))
      : [];

    setConversations(ordered);
    setLoadingConversations(false);
    return ordered;
  };

  const loadConversationDetail = async (conversacionId) => {
    if (!conversacionId) {
      setSelectedConversation(null);
      setMessages([]);
      return;
    }

    setLoadingDetail(true);
    setError('');

    const [data, errorResponse] = await obtenerDetalleConversacion(conversacionId);
    if (errorResponse) {
      setError(errorResponse);
      setSelectedConversation(null);
      setMessages([]);
      setLoadingDetail(false);
      return;
    }

    setSelectedConversation(data?.conversacion || null);
    setMessages(Array.isArray(data?.mensajes) ? data.mensajes : []);
    setLoadingDetail(false);
  };

  const loadRentalForConversation = useCallback(async (conversation) => {
    if (!conversation?.id || !user?.id) {
      setRentalForConversation(null);
      return null;
    }

    const [data] = await listarArriendos();
    const rentals = Array.isArray(data) ? data : [];

    const matchedRental = rentals.find((rental) => {
      const samePublication = String(rental?.publicacionId) === String(conversation?.publicacion?.id);
      const sameParticipants = Number(rental?.arrendadorId) === Number(conversation?.arrendador?.id)
        && Number(rental?.estudianteId) === Number(conversation?.estudiante?.id);

      return samePublication && sameParticipants;
    });

    setRentalForConversation(matchedRental || null);
    return matchedRental || null;
  }, [user?.id]);

  useEffect(() => {
    if (!selectedConversation) {
      setRentalForConversation(null);
      return;
    }

    loadRentalForConversation(selectedConversation);
  }, [loadRentalForConversation, selectedConversation, user?.id]);

  useEffect(() => {
    const init = async () => {
      const currentConversations = await fetchConversations();

      if (conversationTargetId) {
        setSelectedConversationId(conversationTargetId);
        await loadConversationDetail(conversationTargetId);
        return;
      }

      if (publicationTargetId) {
        const existingConversation = currentConversations.find((conversation) => String(conversation?.publicacion?.id) === String(publicationTargetId));
        if (existingConversation) {
          setSelectedConversationId(existingConversation.id);
          await loadConversationDetail(existingConversation.id);
          return;
        }
      }

      if (currentConversations.length > 0) {
        setSelectedConversationId(currentConversations[0].id);
        await loadConversationDetail(currentConversations[0].id);
      }
    };

    init();
  }, [conversationTargetId, publicationTargetId]);

  useEffect(() => {
    if (publicationTargetId) {
      const loadPublication = async () => {
        const [data, errorResponse] = await getPublicacionPorId(publicationTargetId);
        if (!errorResponse) {
          setPublicacionObjetivo(data);
        }
      };

      loadPublication();
    } else {
      setPublicacionObjetivo(null);
    }
  }, [publicationTargetId]);

  const filteredConversations = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const title = getConversationTitle(conversation).toLowerCase();
      const otherParticipant = getOtherParticipant(conversation, user?.id, userRole);
      const participantName = otherParticipant?.nombreCompleto?.toLowerCase() || '';
      const location = conversation?.publicacion?.ubicacion?.toLowerCase() || '';
      return title.includes(query) || participantName.includes(query) || location.includes(query);
    });
  }, [conversations, searchText, user?.id, userRole]);

  const selectedOtherParticipant = useMemo(
    () => getOtherParticipant(selectedConversation, user?.id, userRole),
    [selectedConversation, user?.id, userRole],
  );

  const isRentalCompleted = Boolean(rentalForConversation?.id && rentalForConversation?.status === 'COMPLETED');
  const isRentalCancelled = Boolean(rentalForConversation?.id && rentalForConversation?.status === 'CANCELLED');
  const isCurrentUserArrendador = Boolean(
    selectedConversation?.arrendador?.id && Number(user?.id) === Number(selectedConversation.arrendador.id),
  );
  const shouldShowConfirmRentalButton = Boolean(
    selectedConversation?.publicacion?.id && selectedConversation?.arrendador?.id && selectedConversation?.estudiante?.id && isCurrentUserArrendador,
  ) && !isRentalCompleted && !isRentalCancelled;

  const handleSelectConversation = async (conversationId) => {
    setSearchParams({ conversacion: String(conversationId) });
    setSelectedConversationId(conversationId);
    await loadConversationDetail(conversationId);
  };

  const handleComposeKeyDown = (event, sendHandler) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    sendHandler();
  };

  const sendStartConversationFromPublication = async () => {
    if (!publicationTargetId) return;
    if (!composeText.trim()) {
      await Swal.fire('Escribe un mensaje', 'Necesitas escribir un mensaje para iniciar la conversación.', 'info');
      return;
    }

    setSending(true);
    const [result, errorResponse] = await enviarMensajeAPublicacion(publicationTargetId, composeText.trim());
    setSending(false);

    if (errorResponse) {
      await Swal.fire('No se pudo enviar', errorResponse, 'error');
      return;
    }

    setComposeText('');
    const refreshedConversations = await fetchConversations();
    const createdConversation = refreshedConversations.find((conversation) => String(conversation?.publicacion?.id) === String(publicationTargetId));

    if (createdConversation) {
      setSelectedConversationId(createdConversation.id);
      await loadConversationDetail(createdConversation.id);
      setSearchParams({ conversacion: String(createdConversation.id) });
    } else if (result?.conversacion?.id) {
      setSelectedConversationId(result.conversacion.id);
      await loadConversationDetail(result.conversacion.id);
      setSearchParams({ conversacion: String(result.conversacion.id) });
    }
  };

  const handleStartConversationFromPublication = async (event) => {
    event?.preventDefault?.();
    await sendStartConversationFromPublication();
  };

  const sendReply = async () => {
    if (!selectedConversationId || !composeText.trim()) return;

    setSending(true);
    const [, errorMessage] = await responderConversacion(selectedConversationId, composeText.trim());
    setSending(false);

    if (errorMessage) {
      await Swal.fire('No se pudo responder', errorMessage, 'error');
      return;
    }

    setComposeText('');
    await loadConversationDetail(selectedConversationId);
    await fetchConversations();
  };

  const handleSendReply = async (event) => {
    event.preventDefault();
    await sendReply();
  };

  const handleRefresh = async () => {
    await fetchConversations();
    if (selectedConversationId) {
      await loadConversationDetail(selectedConversationId);
    }
  };

  const handleConfirmRental = async () => {
    if (!selectedConversation?.publicacion?.id || !selectedConversation?.arrendador?.id || !selectedConversation?.estudiante?.id) {
      await Swal.fire('No se puede aceptar', 'Esta conversación no tiene la información suficiente para aceptar el arriendo.', 'warning');
      return;
    }

    if (!isCurrentUserArrendador) {
      await Swal.fire('No autorizado', 'Solo el arrendador puede aceptar el arriendo desde el chat.', 'warning');
      return;
    }

    setLoadingRentalConfirmation(true);

    const [acceptedRental, errorResponse] = await createArriendo({
      arrendadorId: Number(selectedConversation.arrendador.id),
      estudianteId: Number(selectedConversation.estudiante.id),
      publicacionId: Number(selectedConversation.publicacion.id),
    });

    setLoadingRentalConfirmation(false);

    if (errorResponse) {
      await Swal.fire('No se pudo aceptar', errorResponse, 'error');
      return;
    }

    setRentalForConversation(acceptedRental || null);
    await Swal.fire('Arriendo aceptado', 'El arriendo quedó concretado y la publicación pasó a estado arrendada.', 'success');
    await loadRentalForConversation(selectedConversation);
  };

  const isContactComposerVisible = Boolean(publicationTargetId);
  const hasSelectedConversation = Boolean(selectedConversationId && selectedConversation);

  return (
    <div className="mensajes-page">
      <div className="mensajes-shell">
        <aside className="mensajes-sidebar">
          <div className="mensajes-sidebar__header">
            <div>
              <p className="mensajes-eyebrow">Mensajes</p>
              <h1>Tu bandeja</h1>
              <p className="mensajes-subtitle">Revisa conversaciones, responde y sigue el hilo de cada arriendo.</p>
            </div>
            <button type="button" className="mensajes-icon-btn" onClick={handleRefresh} title="Actualizar conversaciones">
              <RefreshCw size={18} />
            </button>
          </div>

          <label className="mensajes-search">
            <span>Buscar</span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Buscar por persona, título o ubicación"
            />
          </label>

          {isContactComposerVisible && (
            <div className="mensajes-quick-compose">
              <div className="mensajes-quick-compose__top">
                <Sparkles size={16} />
                <span>Contacto desde publicación</span>
              </div>
              <div className="mensajes-quick-compose__title">
                {publicacionObjetivo?.titulo || `Publicación #${publicationTargetId}`}
              </div>
              <p className="mensajes-quick-compose__meta">
                {publicacionObjetivo?.ubicacion || 'Escribe el primer mensaje para iniciar la conversación.'}
              </p>
            </div>
          )}

          <div className="mensajes-list">
            {loadingConversations && <div className="mensajes-empty">Cargando conversaciones...</div>}
            {!loadingConversations && filteredConversations.length === 0 && (
              <div className="mensajes-empty">
                <Inbox size={22} />
                <p>No tienes conversaciones todavía.</p>
                {isContactComposerVisible && <span>Escribe un mensaje desde una publicación para empezar.</span>}
              </div>
            )}

            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation, user?.id, userRole);
              const isSelected = String(conversation.id) === String(selectedConversationId);
              const unreadCount = getUnreadConversationBadgeCount(conversation, userRole);

              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={`mensajes-list-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="mensajes-avatar">
                    <UserRound size={18} />
                  </div>
                  <div className="mensajes-list-item__body">
                    <div className="mensajes-list-item__top">
                      <strong>{otherParticipant?.nombreCompleto || 'Sin nombre'}</strong>
                      {unreadCount > 0 && <span className="mensajes-badge mensajes-badge--unread">{unreadCount}</span>}
                    </div>
                    <span className="mensajes-list-item__title">{getConversationTitle(conversation)}</span>
                    <span className="mensajes-list-item__meta">
                      {conversation?.publicacion?.ubicacion || 'Sin ubicación'}
                    </span>
                    <span className="mensajes-list-item__date">{formatDate(conversation?.ultimaFechaMensaje || conversation?.updatedAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="mensajes-main">
          {error && <div className="mensajes-error">{error}</div>}

          {!hasSelectedConversation && !isContactComposerVisible && (
            <div className="mensajes-placeholder">
              <MessageCircle size={42} />
              <h2>Selecciona una conversación</h2>
              <p>Elige un hilo a la izquierda o abre una publicación para iniciar uno nuevo.</p>
            </div>
          )}

          {isContactComposerVisible && !hasSelectedConversation && (
            <section className="mensajes-detail">
              <button type="button" className="mensajes-back" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Volver a la publicación
              </button>
              <div className="mensajes-detail__card mensajes-detail__card--compact">
                <div className="mensajes-detail__header">
                  <div>
                    <p className="mensajes-eyebrow">Nuevo mensaje</p>
                    <h2>{publicacionObjetivo?.titulo || 'Iniciar conversación'}</h2>
                    <p className="mensajes-detail__meta">{publicacionObjetivo?.ubicacion || 'La publicación seleccionada'}</p>
                  </div>
                  <button type="button" className="mensajes-icon-btn mensajes-icon-btn--secondary" onClick={() => navigate(`/publicacion/${publicationTargetId}`)}>
                    Ver publicación
                  </button>
                </div>

                <form className="mensajes-form" onSubmit={handleStartConversationFromPublication}>
                  <label>
                    <span>Tu mensaje</span>
                    <textarea
                      rows={6}
                      value={composeText}
                      onChange={(event) => setComposeText(event.target.value)}
                      onKeyDown={(event) => handleComposeKeyDown(event, sendStartConversationFromPublication)}
                      placeholder="Hola, me interesa esta publicación..."
                    />
                  </label>

                  <div className="mensajes-form__actions">
                    <button type="submit" className="mensajes-send-btn" disabled={sending || !composeText.trim()}>
                      <Send size={18} />
                      {sending ? 'Enviando...' : 'Enviar mensaje'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {hasSelectedConversation && (
            <section className="mensajes-detail">
              <div className="mensajes-detail__card">
                <div className="mensajes-detail__header">
                  <div>
                    <p className="mensajes-eyebrow">Conversación activa</p>
                    <h2>{getConversationTitle(selectedConversation)}</h2>
                    <p className="mensajes-detail__meta">
                      Con {selectedOtherParticipant?.nombreCompleto || 'Sin participante'} · {selectedConversation?.publicacion?.ubicacion || 'Sin ubicación'}
                    </p>
                  </div>
                  <div className="mensajes-detail__header-actions">
                    <button type="button" className="mensajes-icon-btn mensajes-icon-btn--secondary" onClick={() => navigate(`/publicacion/${selectedConversation?.publicacion?.id}`)}>
                      Ver publicación
                    </button>
                    {shouldShowConfirmRentalButton && (
                      <button type="button" className="mensajes-send-btn" onClick={handleConfirmRental} disabled={loadingRentalConfirmation}>
                        {loadingRentalConfirmation ? (
                          <><RefreshCw size={18} className="spin" /> Aceptando...</>
                        ) : (
                          <><CheckCircle size={18} /> Aceptar arriendo</>
                        )}
                      </button>
                    )}
                    {isRentalCompleted && (
                      <button type="button" className="mensajes-send-btn" disabled>
                        <CheckCircle size={18} /> Arriendo aceptado
                      </button>
                    )}
                    <button type="button" className="mensajes-icon-btn" onClick={handleRefresh}>
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>

                {loadingDetail ? (
                  <div className="mensajes-empty mensajes-empty--detail">Cargando mensajes...</div>
                ) : (
                  <div className="mensajes-thread">
                    {messages.length === 0 ? (
                      <div className="mensajes-empty mensajes-empty--detail">Todavía no hay mensajes en esta conversación.</div>
                    ) : (
                      messages.map((message, index) => {
                        const isMine = String(message?.remitente?.id) === String(user?.id);
                        const previousMessage = messages[index - 1];
                        const showSenderName = !previousMessage || !isSameSender(previousMessage, message);
                        const showDateSeparator = !previousMessage || !isSameDay(previousMessage?.createdAt, message?.createdAt);

                        return (
                          <div key={message.id} className="mensajes-thread__item">
                            {showDateSeparator && (
                              <div className="mensajes-thread__separator">
                                <span>{formatMessageDay(message?.createdAt)}</span>
                              </div>
                            )}

                            <article className={`mensajes-bubble ${isMine ? 'is-mine' : 'is-other'} ${showSenderName ? 'with-name' : 'without-name'}`}>
                              <div className="mensajes-bubble__meta">
                                {showSenderName ? (
                                  <strong>{isMine ? 'Tú' : (message?.remitente?.nombreCompleto || 'Remitente')}</strong>
                                ) : <span className="mensajes-bubble__spacer" />}
                                <span>{formatMessageTime(message?.createdAt)}</span>
                              </div>
                              <p>{message.contenido}</p>
                              {message.leido && isMine && <span className="mensajes-bubble__read">Leído</span>}
                            </article>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                <form className="mensajes-form mensajes-form--reply" onSubmit={handleSendReply}>
                  <label>
                    <span>Escribe una respuesta</span>
                    <textarea
                      rows={5}
                      value={composeText}
                      onChange={(event) => setComposeText(event.target.value)}
                      onKeyDown={(event) => handleComposeKeyDown(event, sendReply)}
                      placeholder="Escribe tu respuesta..."
                    />
                  </label>
                  <div className="mensajes-form__actions">
                    <button type="submit" className="mensajes-send-btn" disabled={sending || !composeText.trim()}>
                      <Send size={18} />
                      {sending ? 'Enviando...' : 'Responder'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
