/**
 * Image and media compression utilities to prevent localStorage quota exhaustion.
 */

export async function compressImageFile(
  file: File,
  maxDimension = 1000,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // If it's not an image (e.g. PDF or audio), read as data URL with size safeguard
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve((e.target?.result as string) || '');
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || '');
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export function sanitizeMediaForStorage<T>(data: T, maxDataUrlLength = 80000): T {
  if (!data) return data;

  try {
    const jsonStr = JSON.stringify(data, (key, value) => {
      // If string is an enormous data URL or base64
      if (typeof value === 'string') {
        if (value.startsWith('data:') && value.length > maxDataUrlLength) {
          // If it's an audio or video data URL that is huge, truncate or provide fallback
          if (value.startsWith('data:audio/') || value.startsWith('data:video/')) {
            return value.slice(0, 500) + '...[audio_truncated_for_storage]';
          }
          // For huge images, we truncate excessive base64 in emergency fallback
          return value.slice(0, maxDataUrlLength) + '...';
        }
      }
      return value;
    });

    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Error during media sanitization:', e);
    return data;
  }
}
