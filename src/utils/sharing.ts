export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'manual';

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

/** The current page URL without the hash, so shares always open at the start. */
export function currentInvitationUrl(): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Native share sheet where supported, clipboard otherwise.
 * Returns 'manual' when neither works so the UI can show the link to copy by hand.
 */
export async function shareInvitation(payload: SharePayload): Promise<ShareResult> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Any other failure: fall back to copying.
    }
  }
  return (await copyText(payload.url)) ? 'copied' : 'manual';
}
