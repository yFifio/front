const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[\\/:*?"<>|]+/g, '_').trim();

const triggerAnchorDownload = (url: string, fileName: string) => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sanitizeFileName(fileName);
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

export const downloadFileToDevice = async (url: string, fileName = 'arquivo') => {
  if (!url) {
    throw new Error('Arquivo indisponível para download.');
  }

  if (url.startsWith('data:')) {
    triggerAnchorDownload(url, fileName);
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Não foi possível baixar o arquivo.');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    triggerAnchorDownload(blobUrl, fileName);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    triggerAnchorDownload(url, fileName);
  }
};
