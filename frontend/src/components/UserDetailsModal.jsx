import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import '@styles/popup.css';
import {
    getProtectedFilePreview,
    getVerificationFilename,
    isVerificationFileUrl,
} from '@services/upload.service.js';

const fieldLabels = {
    nombreCompleto: 'Nombre completo',
    rut: 'RUT',
    email: 'Correo electrónico',
    rol: 'Rol',
    estadoVerificacion: 'Estado de verificación',
    comentarioVerificacion: 'Comentario de revisión',
    motivoRechazo: 'Motivo de rechazo',
    solicitudAntecedentes: 'Antecedentes solicitados',
    verificacionRevisadaEn: 'Fecha de revisión',
    verificacionRevisadaPorId: 'Revisado por',
    telefono: 'Teléfono',
    universidad: 'Universidad',
    carrera: 'Carrera',
    createdAt: 'Creado',
    updatedAt: 'Actualizado',
    fotoPerfil: 'Foto de perfil',
    documentoResidencia: 'Comprobante de residencia',
    documentoVerificacion: 'Documento de verificación',
    documentoVerificacionReverso: 'Documento de verificación posterior',
    carnetIdentidadFrontal: 'Carnet de identidad (frontal)',
    carnetIdentidadReverso: 'Carnet de identidad (posterior)',
};

const statusColors = {
    aprobado: '#0f766e',
    pendiente: '#b45309',
    rechazado: '#b91c1c',
};

const requiredVerificationFields = {
    estudiante: ['documentoVerificacion', 'carnetIdentidadFrontal', 'carnetIdentidadReverso'],
    arrendador: ['documentoVerificacion', 'documentoVerificacionReverso', 'documentoResidencia', 'fotoPerfil'],
};

const identityDocumentFields = [
    'documentoVerificacion',
    'documentoVerificacionReverso',
    'carnetIdentidadFrontal',
    'carnetIdentidadReverso',
];

const identityQuickRejectionReasons = [
    {
        label: 'Foto poco visible',
        buildComment: (document) => `${document.label}: foto poco visible.`,
    },
    {
        label: 'Expirado',
        buildComment: (document) => `${document.label}: documento expirado.`,
    },
    {
        label: 'Persona no coincide',
        buildComment: (document) => `${document.label}: la persona del documento no coincide con los datos de la cuenta.`,
    },
];

const profilePhotoQuickRejectionReasons = [
    {
        label: 'Foto poco visible',
        buildComment: (document) => `${document.label}: foto poco visible.`,
    },
    {
        label: 'Persona no coincide',
        buildComment: (document) => `${document.label}: la persona de la foto no coincide con los datos de la cuenta.`,
    },
    {
        label: 'No corresponde',
        buildComment: (document) => `${document.label}: el archivo no corresponde a una foto de perfil.`,
    },
];

const generalQuickRejectionReasons = [
    {
        label: 'Poco legible',
        buildComment: (document) => `${document.label}: documento poco legible.`,
    },
    {
        label: 'No vigente',
        buildComment: (document) => `${document.label}: documento no vigente.`,
    },
    {
        label: 'No corresponde',
        buildComment: (document) => `${document.label}: el archivo no corresponde al antecedente solicitado.`,
    },
];

function getQuickReasonsForDocument(document) {
    if (document.field === 'fotoPerfil') return profilePhotoQuickRejectionReasons;
    if (identityDocumentFields.includes(document.field)) return identityQuickRejectionReasons;
    return generalQuickRejectionReasons;
}

function formatValue(value) {
    if (value === null || value === undefined || value === '') {
        return 'No registrado';
    }

    return value;
}

function getFileExtension(filename = '') {
    return filename.split('.').pop()?.toLowerCase() || '';
}

function isImagePreview(preview) {
    const contentType = (preview.contentType || '').toLowerCase();
    const extension = getFileExtension(preview.filename);

    return contentType.startsWith('image/')
        || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(extension);
}

function isPdfPreview(preview) {
    const contentType = (preview.contentType || '').toLowerCase();
    const extension = getFileExtension(preview.filename);

    return contentType.includes('application/pdf') || extension === 'pdf';
}

function PdfFilePreview({ preview }) {
    const pagesRef = useRef(null);
    const [error, setError] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRendering, setIsRendering] = useState(true);

    useEffect(() => {
        let cancelled = false;
        let loadingTask = null;
        const renderTasks = [];
        const pagesContainer = pagesRef.current;

        setError('');
        setIsRendering(true);

        async function renderPdf() {
            try {
                if (!pagesContainer) return;

                pagesContainer.innerHTML = '';

                const response = await fetch(preview.url);
                const data = new Uint8Array(await response.arrayBuffer());
                const { GlobalWorkerOptions, getDocument } = await import('pdfjs-dist');

                GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
                loadingTask = getDocument({ data });
                const pdf = await loadingTask.promise;
                const targetWidth = isExpanded ? 800 : 420;
                const maxScale = isExpanded ? 1.65 : 1.15;

                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
                    if (cancelled) return;

                    const page = await pdf.getPage(pageNumber);
                    const baseViewport = page.getViewport({ scale: 1 });
                    const scale = Math.min(maxScale, targetWidth / baseViewport.width);
                    const viewport = page.getViewport({ scale });
                    const pageWrap = document.createElement('div');
                    const pageLabel = document.createElement('span');
                    const canvas = document.createElement('canvas');

                    pageWrap.style.display = 'flex';
                    pageWrap.style.flexDirection = 'column';
                    pageWrap.style.alignItems = 'center';
                    pageWrap.style.gap = '8px';
                    pageWrap.style.marginBottom = pageNumber === pdf.numPages ? '0' : '18px';

                    pageLabel.textContent = `Página ${pageNumber} de ${pdf.numPages}`;
                    pageLabel.style.alignSelf = 'flex-start';
                    pageLabel.style.color = '#64748b';
                    pageLabel.style.fontSize = '12px';
                    pageLabel.style.fontWeight = '700';

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    canvas.style.width = '100%';
                    canvas.style.maxWidth = `${Math.floor(viewport.width)}px`;
                    canvas.style.height = 'auto';
                    canvas.style.borderRadius = '8px';
                    canvas.style.border = '1px solid #d7eeee';
                    canvas.style.backgroundColor = '#ffffff';

                    pageWrap.appendChild(pageLabel);
                    pageWrap.appendChild(canvas);
                    pagesContainer.appendChild(pageWrap);

                    const renderTask = page.render({
                        canvasContext: canvas.getContext('2d'),
                        viewport,
                    });

                    renderTasks.push(renderTask);
                    await renderTask.promise;
                }
            } catch (renderError) {
                if (!cancelled && renderError?.name !== 'RenderingCancelledException') {
                    setError('No se pudo previsualizar el PDF.');
                }
            } finally {
                if (!cancelled) setIsRendering(false);
            }
        }

        renderPdf();

        return () => {
            cancelled = true;
            renderTasks.forEach((renderTask) => renderTask.cancel?.());
            loadingTask?.destroy?.();
            if (pagesContainer) pagesContainer.innerHTML = '';
        };
    }, [isExpanded, preview.url]);

    useEffect(() => {
        if (!isExpanded) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setIsExpanded(false);
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isExpanded]);

    if (error) {
        return <span style={{ color: '#b91c1c' }}>{error}</span>;
    }

    const previewPanel = (
        <div
            style={{
                width: isExpanded ? 'min(960px, calc(100vw - 48px))' : 'min(440px, 100%)',
                maxHeight: isExpanded ? 'calc(100vh - 48px)' : 'none',
                padding: isExpanded ? '16px' : 0,
                borderRadius: isExpanded ? '14px' : 0,
                border: isExpanded ? '1px solid #d7eeee' : 'none',
                backgroundColor: isExpanded ? '#ffffff' : 'transparent',
                boxShadow: isExpanded ? '0 24px 70px rgba(15, 23, 42, 0.32)' : 'none',
                boxSizing: 'border-box',
            }}
            onClick={(event) => event.stopPropagation()}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 700 }}>
                    {isRendering ? 'Cargando PDF...' : 'Previsualización PDF'}
                </span>
                <button
                    type="button"
                    onClick={() => setIsExpanded((current) => !current)}
                    style={{
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#008080',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontWeight: 800,
                    }}
                >
                    {isExpanded ? 'Cerrar' : 'Expandir'}
                </button>
            </div>
            <div
                ref={pagesRef}
                aria-label={`Previsualización de ${preview.filename}`}
                style={{
                    width: '100%',
                    maxHeight: isExpanded ? 'calc(100vh - 138px)' : '360px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #d7eeee',
                    backgroundColor: '#f8fafc',
                    boxSizing: 'border-box',
                }}
            />
        </div>
    );

    if (!isExpanded) {
        return previewPanel;
    }

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2200,
                padding: '24px',
                backgroundColor: 'rgba(15, 23, 42, 0.64)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
            }}
            onClick={() => setIsExpanded(false)}
        >
            {previewPanel}
        </div>,
        document.body,
    );
}

function ImageFilePreview({ preview }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [zoom, setZoom] = useState(1);

    const closePreview = () => {
        setIsExpanded(false);
        setZoom(1);
    };

    const decreaseZoom = () => {
        setZoom((current) => Math.max(0.75, Number((current - 0.25).toFixed(2))));
    };

    const increaseZoom = () => {
        setZoom((current) => Math.min(3, Number((current + 0.25).toFixed(2))));
    };

    const resetZoom = () => {
        setZoom(1);
    };

    useEffect(() => {
        if (!isExpanded) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closePreview();
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isExpanded]);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsExpanded(true)}
                aria-label={`Ampliar ${preview.filename}`}
                title="Ampliar imagen"
                style={{
                    display: 'block',
                    width: 'min(320px, 100%)',
                    border: '1px solid #d7eeee',
                    borderRadius: '10px',
                    padding: 0,
                    backgroundColor: '#f8fafc',
                    cursor: 'zoom-in',
                    overflow: 'hidden',
                    textAlign: 'left',
                }}
            >
                <img
                    src={preview.url}
                    alt={preview.filename}
                    style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'contain',
                        display: 'block',
                        backgroundColor: '#ffffff',
                    }}
                />
            </button>

            {isExpanded && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 2300,
                        padding: '24px',
                        backgroundColor: 'rgba(15, 23, 42, 0.64)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                    }}
                    onClick={closePreview}
                >
                    <div
                        style={{
                            width: 'min(1040px, calc(100vw - 48px))',
                            maxHeight: 'calc(100vh - 48px)',
                            padding: '16px',
                            borderRadius: '14px',
                            border: '1px solid #d7eeee',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 24px 70px rgba(15, 23, 42, 0.32)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            boxSizing: 'border-box',
                        }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 700, wordBreak: 'break-word' }}>
                                {preview.filename}
                            </span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={decreaseZoom}
                                    aria-label="Reducir zoom"
                                    style={{
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        backgroundColor: '#e2f4f4',
                                        color: '#005f5f',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                    }}
                                >
                                    -
                                </button>
                                <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 800, minWidth: '48px', textAlign: 'center' }}>
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={increaseZoom}
                                    aria-label="Aumentar zoom"
                                    style={{
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        backgroundColor: '#e2f4f4',
                                        color: '#005f5f',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                    }}
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    onClick={resetZoom}
                                    style={{
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        backgroundColor: '#edf2f7',
                                        color: '#334155',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                    }}
                                >
                                    Restablecer
                                </button>
                                <button
                                    type="button"
                                    onClick={closePreview}
                                    style={{
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        backgroundColor: '#008080',
                                        color: '#ffffff',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                    }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                        <div
                            style={{
                                minHeight: 0,
                                flex: 1,
                                overflow: 'auto',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid #d7eeee',
                                backgroundColor: '#f8fafc',
                                textAlign: 'center',
                            }}
                        >
                            <img
                                src={preview.url}
                                alt={preview.filename}
                                style={{
                                    width: zoom === 1 ? 'min(900px, 100%)' : `${Math.round(900 * zoom)}px`,
                                    maxWidth: zoom === 1 ? '100%' : 'none',
                                    height: 'auto',
                                    borderRadius: '10px',
                                    border: '1px solid #d7eeee',
                                    backgroundColor: '#ffffff',
                                }}
                            />
                        </div>
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}

function VerificationFilePreview({ value }) {
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let objectUrl = null;
        let cancelled = false;

        setPreview(null);
        setError('');

        if (!isVerificationFileUrl(value)) return undefined;

        getProtectedFilePreview(value)
            .then((filePreview) => {
                if (cancelled) {
                    URL.revokeObjectURL(filePreview.url);
                    return;
                }

                objectUrl = filePreview.url;
                setPreview(filePreview);
            })
            .catch(() => {
                if (!cancelled) setError('No se pudo cargar el archivo.');
            });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [value]);

    if (!isVerificationFileUrl(value)) {
        return <span>{formatValue(value)}</span>;
    }

    if (error) {
        return <span style={{ color: '#b91c1c' }}>{error}</span>;
    }

    if (!preview) {
        return <span>Cargando archivo...</span>;
    }

    const isImage = isImagePreview(preview);
    const isPdf = isPdfPreview(preview);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start', width: '100%' }}>
            {isImage && (
                <ImageFilePreview preview={preview} />
            )}
            {isPdf && (
                <PdfFilePreview preview={preview} />
            )}
            {!isImage && !isPdf && (
                <span style={{ color: '#b45309', fontSize: '13px', fontWeight: 700 }}>
                    Vista previa no disponible para este tipo de archivo.
                </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '100%' }}>
                <span style={{ color: '#0f766e', fontSize: '12px', fontWeight: 800 }}>
                    Nombre del archivo
                </span>
                <span style={{ color: '#64748b', fontSize: '13px', wordBreak: 'break-word' }}>
                    {getVerificationFilename(value)}
                </span>
            </div>
        </div>
    );
}

export default function UserDetailsModal({ show, setShow, user, onVerificationAction }) {
    const [reviewComment, setReviewComment] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const reviewCommentRef = useRef(null);

    useEffect(() => {
        if (!show) return;

        setReviewComment('');
        setReviewError('');
        setIsSubmittingReview(false);
    }, [show, user?.id]);

    if (!show) return null;

    const normalizedStatus = (user?.estadoVerificacion || 'pendiente').toString().toLowerCase();
    const normalizedRole = (user?.rol || '').toString().toLowerCase();
    const verificationDocumentLabel = normalizedRole === 'estudiante'
        ? 'Certificado de alumno regular'
        : 'Carnet de identidad (frontal)';
    const documentFieldLabels = {
        documentoResidencia: fieldLabels.documentoResidencia,
        documentoVerificacion: verificationDocumentLabel,
        documentoVerificacionReverso: 'Carnet de identidad (posterior)',
        carnetIdentidadFrontal: fieldLabels.carnetIdentidadFrontal,
        carnetIdentidadReverso: fieldLabels.carnetIdentidadReverso,
    };
    const requiredDocuments = (requiredVerificationFields[normalizedRole] || []).map((field) => ({
        field,
        isPresent: Boolean(user?.[field]),
        label: documentFieldLabels[field] || fieldLabels[field] || field,
    }));
    const hasMissingRequiredDocs = requiredDocuments.some((document) => !document.isPresent);
    const canReview = Boolean(onVerificationAction) && ['estudiante', 'arrendador'].includes(normalizedRole);
    const hasPendingInfoRequest = Boolean(String(user?.solicitudAntecedentes || '').trim());
    const shouldShowVerificationReview = canReview && normalizedStatus === 'pendiente' && !hasPendingInfoRequest;
    const quickReasonDocuments = requiredDocuments.filter((document) => document.isPresent);

    const applyQuickReason = (comment, keepCursor = false) => {
        setReviewComment((current) => {
            if (keepCursor) return `${current}${comment}`;
            const trimmed = current.trim();
            return trimmed ? `${trimmed}\n${comment}` : comment;
        });
        setReviewError('');
        requestAnimationFrame(() => {
            reviewCommentRef.current?.focus();
        });
    };

    const submitVerificationAction = async (actionType) => {
        if (!shouldShowVerificationReview) return;

        const trimmedComment = reviewComment.trim();
        let payload = null;

        if (actionType === 'approve') {
            if (hasMissingRequiredDocs) {
                setReviewError('No puedes aprobar una cuenta con antecedentes obligatorios faltantes.');
                return;
            }

            payload = {
                estadoVerificacion: 'aprobado',
                comentarioRevision: trimmedComment || 'Documentos verificados correctamente.',
            };
        }

        if (actionType === 'reject') {
            if (!trimmedComment) {
                setReviewError('Ingresa un comentario para rechazar la solicitud.');
                return;
            }

            payload = {
                estadoVerificacion: 'rechazado',
                motivoRechazo: trimmedComment,
            };
        }

        if (actionType === 'request-info') {
            if (!trimmedComment) {
                setReviewError('Indica qué antecedentes adicionales debe enviar el usuario.');
                return;
            }

            payload = {
                estadoVerificacion: 'pendiente',
                solicitudAntecedentes: trimmedComment,
            };
        }

        if (!payload) return;

        setReviewError('');
        setIsSubmittingReview(true);

        try {
            await onVerificationAction(user, payload);
            setReviewComment('');
        } catch (error) {
            setReviewError(error?.message || 'No se pudo completar la revisión.');
        } finally {
            setIsSubmittingReview(false);
        }
    };
    const initials = (user?.nombreCompleto || 'Usuario')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
    const modalScrollClassName = 'user-details-modal-scroll';

    const detailFields = [
        'rut',
        'email',
        'rol',
        ...(user?.comentarioVerificacion ? ['comentarioVerificacion'] : []),
        ...(user?.motivoRechazo ? ['motivoRechazo'] : []),
        ...(user?.solicitudAntecedentes ? ['solicitudAntecedentes'] : []),
        ...(user?.verificacionRevisadaEn ? ['verificacionRevisadaEn'] : []),
        ...(user?.verificacionRevisadaPorId ? ['verificacionRevisadaPorId'] : []),
        'telefono',
        ...(normalizedRole === 'estudiante' ? ['universidad', 'carrera'] : []),
        'createdAt',
        'updatedAt',
        'documentoVerificacion',
        ...(normalizedRole === 'estudiante' ? ['carnetIdentidadFrontal', 'carnetIdentidadReverso'] : []),
        ...(normalizedRole === 'arrendador' ? ['documentoVerificacionReverso', 'documentoResidencia', 'fotoPerfil'] : []),
    ];

    return (
        <div
            className="bg"
            style={{ position: 'fixed', inset: 0, zIndex: 1200, alignItems: 'center', justifyContent: 'center', padding: '24px 16px 56px' }}
            onClick={() => setShow(false)}
        >
            <style>
                {`
                    .verification-quick-reasons {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        margin: 0 0 14px;
                        padding: 12px;
                        border-radius: 12px;
                        background: #ffffff;
                        border: 1px solid #dbeafe;
                    }

                    .verification-quick-reasons__title {
                        color: #334155;
                        font-size: 12px;
                        font-weight: 800;
                    }

                    .verification-quick-reasons__row {
                        display: grid;
                        grid-template-columns: minmax(130px, 0.65fr) minmax(0, 1fr);
                        gap: 8px;
                        align-items: start;
                    }

                    .verification-quick-reasons__doc {
                        color: #0f766e;
                        font-size: 12px;
                        font-weight: 800;
                        line-height: 1.35;
                    }

                    .verification-quick-reasons__actions {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                    }

                    .verification-quick-reasons__chip {
                        border: 1px solid #99d7d2;
                        border-radius: 999px;
                        padding: 5px 9px;
                        background: #f8fbfb;
                        color: #0f766e;
                        font-size: 12px;
                        font-weight: 800;
                        cursor: pointer;
                    }

                    .verification-quick-reasons__chip:hover,
                    .verification-quick-reasons__chip:focus-visible {
                        border-color: #0f766e;
                        background: #e7f6f2;
                        outline: none;
                    }

                    @media (max-width: 620px) {
                        .verification-quick-reasons__row {
                            grid-template-columns: 1fr;
                        }
                    }

                    .${modalScrollClassName} {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(15, 118, 110, 0.55) transparent;
                    }

                    .${modalScrollClassName}::-webkit-scrollbar {
                        width: 8px;
                    }

                    .${modalScrollClassName}::-webkit-scrollbar-track {
                        background: transparent;
                    }

                    .${modalScrollClassName}::-webkit-scrollbar-thumb {
                        background: rgba(15, 118, 110, 0.46);
                        border-radius: 999px;
                        border: 2px solid transparent;
                        background-clip: padding-box;
                    }

                    .${modalScrollClassName}::-webkit-scrollbar-thumb:hover {
                        background: rgba(15, 118, 110, 0.72);
                        background-clip: padding-box;
                    }
                `}
            </style>
            <div
                className={`popup ${modalScrollClassName}`}
                style={{
                    width: 'min(760px, calc(100vw - 32px))',
                    height: 'auto',
                    maxHeight: 'calc(100vh - 80px)',
                    overflow: 'auto',
                    padding: '0',
                    borderRadius: '22px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.22)',
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <div style={{ position: 'relative' }}>
                    <button
                        type="button"
                        onClick={() => setShow(false)}
                        aria-label="Cerrar"
                        title="Cerrar"
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            zIndex: 3,
                            width: '34px',
                            height: '34px',
                            border: '1px solid rgba(255, 255, 255, 0.22)',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.22)',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backdropFilter: 'blur(6px)',
                            fontSize: 0,
                        }}
                    >
                        <X size={18} strokeWidth={2.4} />
                        ×
                    </button>

                    <div style={{ padding: '0' }}>
                        <section style={{ background: 'linear-gradient(135deg, #008080 0%, #0b6b7a 45%, #163d4f 100%)', color: '#ffffff', padding: '28px 32px 26px', borderTopLeftRadius: '22px', borderTopRightRadius: '22px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                                <div style={{ maxWidth: 'calc(100% - 90px)' }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>
                                        Vista detallada
                                    </p>
                                    <h2 style={{ margin: 0, fontSize: '26px', lineHeight: 1.1 }}>
                                        {user?.nombreCompleto || 'Usuario sin nombre'}
                                    </h2>
                                    <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.88)', lineHeight: 1.55, maxWidth: '60ch' }}>
                                        Información completa del usuario para revisar su perfil antes de editar o eliminar.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                    <div
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '18px',
                                            backgroundColor: statusColors[normalizedStatus] || 'rgba(255,255,255,0.14)',
                                            color: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '18px',
                                            border: '1px solid rgba(255,255,255,0.16)',
                                        }}
                                    >
                                        {initials || 'U'}
                                    </div>

                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '6px 12px',
                                            borderRadius: '999px',
                                            backgroundColor: 'rgba(255,255,255,0.14)',
                                            color: '#ffffff',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            textTransform: 'capitalize',
                                            border: '1px solid rgba(255,255,255,0.16)',
                                        }}
                                    >
                                        {formatValue(user?.estadoVerificacion)}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section style={{ padding: '24px 32px 56px', backgroundColor: '#ffffff', borderBottomLeftRadius: '22px', borderBottomRightRadius: '22px' }}>
                            {shouldShowVerificationReview && (
                                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '14px', border: '1px solid #d7eeee', backgroundColor: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        <div>
                                            <p style={{ margin: '0 0 6px', color: '#0f766e', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                Revisión de antecedentes
                                            </p>
                                            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', lineHeight: 1.25 }}>
                                                Documentos de {normalizedRole}
                                            </h3>
                                        </div>
                                        <span style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: hasMissingRequiredDocs ? '#fef2f2' : '#ecfdf5', color: hasMissingRequiredDocs ? '#b91c1c' : '#0f766e', fontSize: '12px', fontWeight: 800 }}>
                                            {hasMissingRequiredDocs ? 'Incompleto' : 'Completo'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 18px', marginBottom: '14px' }}>
                                        {requiredDocuments.map((document) => (
                                            <div key={document.field} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '24px' }}>
                                                <span
                                                    style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '999px',
                                                        backgroundColor: document.isPresent ? '#0f766e' : '#b91c1c',
                                                        boxShadow: document.isPresent
                                                            ? '0 0 0 3px rgba(15, 118, 110, 0.12)'
                                                            : '0 0 0 3px rgba(185, 28, 28, 0.12)',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                <span style={{ color: '#334155', fontSize: '13px', lineHeight: 1.35, maxWidth: '220px' }}>
                                                    {document.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {quickReasonDocuments.length > 0 && (
                                        <div className="verification-quick-reasons">
                                            <span className="verification-quick-reasons__title">
                                                Motivos sugeridos
                                            </span>
                                            {quickReasonDocuments.map((document) => (
                                                <div key={`quick-${document.field}`} className="verification-quick-reasons__row">
                                                    <span className="verification-quick-reasons__doc">
                                                        {document.label}
                                                    </span>
                                                    <div className="verification-quick-reasons__actions">
                                                        {getQuickReasonsForDocument(document).map((reason) => (
                                                            <button
                                                                key={`${document.field}-${reason.label}`}
                                                                type="button"
                                                                className="verification-quick-reasons__chip"
                                                                onClick={() => applyQuickReason(reason.buildComment(document))}
                                                            >
                                                                {reason.label}
                                                            </button>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            className="verification-quick-reasons__chip"
                                                            onClick={() => applyQuickReason(`${document.label}: `, true)}
                                                        >
                                                            Otro
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '12px' }}>
                                        <span style={{ color: '#334155', fontSize: '13px', fontWeight: 800 }}>
                                            Comentario para rechazo o solicitud de antecedentes
                                        </span>
                                        <textarea
                                            ref={reviewCommentRef}
                                            value={reviewComment}
                                            onChange={(event) => setReviewComment(event.target.value)}
                                            rows={4}
                                            maxLength={1000}
                                            placeholder="Ej: El documento está borroso; por favor envía una imagen legible del reverso del carnet."
                                            style={{
                                                width: '100%',
                                                resize: 'vertical',
                                                boxSizing: 'border-box',
                                                borderRadius: '10px',
                                                border: '1px solid #cbd5e1',
                                                padding: '10px 12px',
                                                color: '#0f172a',
                                                backgroundColor: '#ffffff',
                                                outline: 'none',
                                                lineHeight: 1.5,
                                            }}
                                        />
                                    </label>

                                    {reviewError && (
                                        <p style={{ margin: '0 0 12px', color: '#b91c1c', fontSize: '13px', fontWeight: 700 }}>
                                            {reviewError}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={() => submitVerificationAction('approve')}
                                            disabled={isSubmittingReview || hasMissingRequiredDocs}
                                            style={{
                                                border: 'none',
                                                borderRadius: '10px',
                                                padding: '10px 14px',
                                                backgroundColor: '#0f766e',
                                                color: '#ffffff',
                                                cursor: isSubmittingReview || hasMissingRequiredDocs ? 'not-allowed' : 'pointer',
                                                opacity: isSubmittingReview || hasMissingRequiredDocs ? 0.55 : 1,
                                                fontWeight: 800,
                                            }}
                                        >
                                            Aprobar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => submitVerificationAction('reject')}
                                            disabled={isSubmittingReview}
                                            style={{
                                                border: 'none',
                                                borderRadius: '10px',
                                                padding: '10px 14px',
                                                backgroundColor: '#b91c1c',
                                                color: '#ffffff',
                                                cursor: isSubmittingReview ? 'not-allowed' : 'pointer',
                                                opacity: isSubmittingReview ? 0.55 : 1,
                                                fontWeight: 800,
                                            }}
                                        >
                                            Rechazar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => submitVerificationAction('request-info')}
                                            disabled={isSubmittingReview}
                                            style={{
                                                border: '1px solid #0f766e',
                                                borderRadius: '10px',
                                                padding: '10px 14px',
                                                backgroundColor: '#ffffff',
                                                color: '#0f766e',
                                                cursor: isSubmittingReview ? 'not-allowed' : 'pointer',
                                                opacity: isSubmittingReview ? 0.55 : 1,
                                                fontWeight: 800,
                                            }}
                                        >
                                            Solicitar antecedentes
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {detailFields.map((field, index) => (
                                    <div
                                        key={field}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '170px 1fr',
                                            gap: '14px',
                                            paddingBottom: '12px',
                                            borderBottom: index === detailFields.length - 1 ? 'none' : '1px solid #e2e8f0',
                                        }}
                                    >
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f766e' }}>
                                            {documentFieldLabels[field]
                                                ? documentFieldLabels[field]
                                                : fieldLabels[field] || field}
                                        </span>
                                        <div style={{ fontSize: '14px', lineHeight: 1.5, color: '#0f172a', wordBreak: 'break-word', minWidth: 0 }}>
                                            {field === 'documentoResidencia' || field === 'documentoVerificacion' || field === 'documentoVerificacionReverso' || field === 'carnetIdentidadFrontal' || field === 'carnetIdentidadReverso' || field === 'fotoPerfil'
                                                ? <VerificationFilePreview value={user?.[field]} />
                                                : formatValue(user?.[field])}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
