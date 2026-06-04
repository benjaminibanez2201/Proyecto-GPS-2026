import { useEffect, useRef, useState } from 'react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import '@styles/popup.css';
import {
    getProtectedFilePreview,
    getVerificationFilename,
    isVerificationFileUrl,
} from '@services/upload.service.js';

const fieldLabels = {
    id: 'ID',
    nombreCompleto: 'Nombre completo',
    rut: 'RUT',
    email: 'Correo electrónico',
    rol: 'Rol',
    estadoVerificacion: 'Estado de verificación',
    telefono: 'Teléfono',
    universidad: 'Universidad',
    carrera: 'Carrera',
    createdAt: 'Creado',
    updatedAt: 'Actualizado',
    ultimoLogin: 'Último acceso',
    fotoPerfil: 'Foto de perfil',
    documentoResidencia: 'Comprobante de residencia',
    documentoVerificacion: 'Documento de verificación',
};

const statusColors = {
    aprobado: '#0f766e',
    pendiente: '#b45309',
    rechazado: '#b91c1c',
};

function formatValue(value) {
    if (value === null || value === undefined || value === '') {
        return 'No registrado';
    }

    return value;
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

                    pageLabel.textContent = `Pagina ${pageNumber} de ${pdf.numPages}`;
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

    if (error) {
        return <span style={{ color: '#b91c1c' }}>{error}</span>;
    }

    return (
        <div
            style={{
                ...(isExpanded
                    ? {
                        position: 'fixed',
                        inset: '24px',
                        zIndex: 1800,
                        width: 'auto',
                        maxHeight: 'calc(100vh - 48px)',
                        padding: '16px',
                        borderRadius: '14px',
                        border: '1px solid #d7eeee',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
                    }
                    : {
                        width: 'min(440px, 100%)',
                    }),
                boxSizing: 'border-box',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 700 }}>
                    {isRendering ? 'Cargando PDF...' : 'Previsualizacion PDF'}
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
                    {isExpanded ? 'Contraer' : 'Expandir'}
                </button>
            </div>
            <div
                ref={pagesRef}
                aria-label={`Previsualizacion de ${preview.filename}`}
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
                    border: 'none',
                    padding: 0,
                    backgroundColor: 'transparent',
                    cursor: 'zoom-in',
                    textAlign: 'left',
                }}
            >
                <img
                    src={preview.url}
                    alt={preview.filename}
                    style={{
                        width: 'min(240px, 100%)',
                        maxHeight: '180px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #d7eeee',
                        display: 'block',
                    }}
                />
            </button>

            {isExpanded && (
                <div
                    style={{
                        position: 'fixed',
                        inset: '24px',
                        zIndex: 1900,
                        padding: '16px',
                        borderRadius: '14px',
                        border: '1px solid #d7eeee',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
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

    const isImage = preview.contentType?.startsWith('image/');
    const isPdf = preview.contentType === 'application/pdf';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
            {isImage && (
                <ImageFilePreview preview={preview} />
            )}
            {isPdf && (
                <PdfFilePreview preview={preview} />
            )}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {!isPdf && (
                    <a
                        href={preview.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            color: '#008080',
                            fontWeight: 800,
                            textDecoration: 'none',
                        }}
                    >
                        Abrir archivo
                    </a>
                )}
                <span style={{ color: '#64748b', fontSize: '13px' }}>
                    {getVerificationFilename(value)}
                </span>
            </div>
        </div>
    );
}

export default function UserDetailsModal({ show, setShow, user }) {
    if (!show) return null;

    const normalizedStatus = (user?.estadoVerificacion || 'pendiente').toString().toLowerCase();
    const normalizedRole = (user?.rol || '').toString().toLowerCase();
    const verificationDocumentLabel = normalizedRole === 'estudiante'
        ? 'Certificado de alumno regular'
        : 'Carnet de identidad';
    const documentFieldLabels = {
        documentoResidencia: fieldLabels.documentoResidencia,
        documentoVerificacion: verificationDocumentLabel,
    };
    const initials = (user?.nombreCompleto || 'Usuario')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

    const detailFields = [
        'id',
        'rut',
        'email',
        'rol',
        'estadoVerificacion',
        'telefono',
        'universidad',
        'carrera',
        'createdAt',
        'updatedAt',
        'ultimoLogin',
        'documentoVerificacion',
        'documentoResidencia',
        'fotoPerfil',
    ];

    return (
        <div
            className="bg"
            style={{ position: 'fixed', inset: 0, zIndex: 1200, alignItems: 'center', justifyContent: 'center', padding: '24px 16px 56px' }}
            onClick={() => setShow(false)}
        >
            <div
                className="popup"
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
                        className="close"
                        onClick={() => setShow(false)}
                        aria-label="Cerrar"
                        style={{ zIndex: 2 }}
                    >
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
                                        <span style={{ fontSize: '14px', lineHeight: 1.5, color: '#0f172a', wordBreak: 'break-word' }}>
                                            {field === 'documentoResidencia' || field === 'documentoVerificacion' || field === 'fotoPerfil'
                                                ? <VerificationFilePreview value={user?.[field]} />
                                                : formatValue(user?.[field])}
                                        </span>
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
