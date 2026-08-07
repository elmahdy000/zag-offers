const MAX_IMAGE_DIMENSION = 1600;
const COMPRESSION_THRESHOLD = 350 * 1024;

export async function optimizeUploadFormData(data: FormData): Promise<FormData> {
  if (typeof window === 'undefined' || typeof File === 'undefined') return data;

  const value = data.get('file');
  if (!(value instanceof File) || !value.type.startsWith('image/') || value.size < COMPRESSION_THRESHOLD) {
    return data;
  }

  try {
    const bitmap = await createImageBitmap(value, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d', { alpha: true })?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
    if (!blob || blob.size >= value.size) return data;

    const optimized = new File([blob], `${value.name.replace(/\.[^.]+$/, '') || 'upload'}.webp`, {
      type: 'image/webp',
      lastModified: value.lastModified,
    });
    data.set('file', optimized);
  } catch {
    // Older browsers can safely fall back to the original file.
  }

  return data;
}
