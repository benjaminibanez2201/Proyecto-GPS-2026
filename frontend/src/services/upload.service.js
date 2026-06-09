import axios from './root.service.js';

export function isVerificationFileUrl(value) {
    return typeof value === 'string' && value.startsWith('/api/uploads/verifications/');
}

export function getVerificationFilename(value) {
    if (!isVerificationFileUrl(value)) return value;

    const filename = value.split('/').pop();
    return decodeURIComponent(filename || '');
}

export async function getProtectedFilePreview(value) {
    const apiPath = value.startsWith('/api/') ? value.slice(4) : value;
    const response = await axios.get(apiPath, { responseType: 'blob' });

    return {
        contentType: response.headers['content-type'] || response.data.type,
        filename: getVerificationFilename(value),
        url: URL.createObjectURL(response.data),
    };
}
