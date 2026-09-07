import { ClaimCase, AdditionalDocItem, MediaFile } from '../types';

/**
 * Normalizes any media item or string into a clean trimmed URL string.
 */
export function normalizeMediaUrl(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  return (raw.dataUrl || raw.url || raw.preview || '').trim();
}

/**
 * Checks whether an item represents an audio file/recording.
 */
export function isAudioMedia(item: any): boolean {
  if (!item) return false;
  const type = (item.type || item.fileType || '').toLowerCase();
  if (type === 'audio' || type.startsWith('audio/')) return true;
  const name = (item.name || item.title || item.fileName || item.docType || '').toLowerCase();
  if (name.includes('صوت') || name.includes('voice') || name.includes('audio')) return true;
  const url = normalizeMediaUrl(item).toLowerCase();
  if (url.startsWith('data:audio/')) return true;
  if (/\.(mp3|wav|ogg|webm|m4a|aac)(\?.*)?$/i.test(url) && !url.includes('video')) return true;
  return false;
}

/**
 * Checks whether an item represents a video file.
 */
export function isVideoMedia(item: any): boolean {
  if (!item) return false;
  const type = (item.type || item.fileType || '').toLowerCase();
  if (type === 'video' || type.startsWith('video/')) return true;
  const name = (item.name || item.title || item.fileName || item.docType || '').toLowerCase();
  if (name.includes('ویدیو') || name.includes('فیلم') || name.includes('video')) return true;
  const url = normalizeMediaUrl(item).toLowerCase();
  if (url.startsWith('data:video/')) return true;
  if (/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i.test(url)) return true;
  return false;
}

/**
 * Deduplicates a list of media items based on dataUrl/url and title.
 */
export function deduplicateMediaItems<T extends { url?: string; dataUrl?: string; name?: string; title?: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seenUrls = new Set<string>();
  const seenKeys = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    if (!item) continue;
    const url = normalizeMediaUrl(item);
    const title = (item.title || item.name || '').trim();
    
    if (url) {
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
    }
    
    if (title) {
      const typeTag = isAudioMedia(item) ? 'audio' : isVideoMedia(item) ? 'video' : 'img';
      const key = `${title}_${typeTag}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
    }

    result.push(item);
  }

  return result;
}

/**
 * Cleans up a ClaimCase so that its files and additionalDocs arrays contain no duplicate media items.
 */
export function sanitizeCaseMedia(claimCase: ClaimCase): ClaimCase {
  if (!claimCase) return claimCase;

  let cleanedFiles = claimCase.files;
  if (Array.isArray(cleanedFiles) && cleanedFiles.length > 0) {
    const seenUrls = new Set<string>();
    const seenNames = new Set<string>();
    cleanedFiles = cleanedFiles.filter(f => {
      if (!f) return false;
      const url = normalizeMediaUrl(f);
      const name = (f.name || f.fileName || '').trim();
      if (url && seenUrls.has(url)) return false;
      if (name && seenNames.has(name)) return false;
      if (url) seenUrls.add(url);
      if (name) seenNames.add(name);
      return true;
    });
  }

  let cleanedAdditionalDocs = claimCase.additionalDocs;
  if (Array.isArray(cleanedAdditionalDocs) && cleanedAdditionalDocs.length > 0) {
    const seenDocUrls = new Set<string>();
    const seenDocKeys = new Set<string>();
    cleanedAdditionalDocs = cleanedAdditionalDocs.filter(d => {
      if (!d) return false;
      const url = normalizeMediaUrl(d);
      const title = (d.title || d.fileName || d.docType || '').trim();
      const party = d.uploaderParty || 'ALL';
      const key = `${party}_${title}_${d.fileType || ''}`;

      if (url && seenDocUrls.has(url)) return false;
      if (title && seenDocKeys.has(key)) return false;
      if (url) seenDocUrls.add(url);
      if (title) seenDocKeys.add(key);
      return true;
    });
  }

  return {
    ...claimCase,
    files: cleanedFiles,
    additionalDocs: cleanedAdditionalDocs
  };
}
