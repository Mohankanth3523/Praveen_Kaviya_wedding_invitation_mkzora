export interface DeviceProfile {
  webgl: boolean;
  /** Use the CSS stage instead of WebGL. */
  useFallback: boolean;
  /** Lighter WebGL: lower DPR, no shadows, fewer particles. */
  lowPower: boolean;
  reason?: string;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectDevice(): DeviceProfile {
  const params = new URLSearchParams(window.location.search);
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const saveData = nav.connection?.saveData === true;
  const webgl = hasWebGL();
  if (params.has('lite')) return { webgl, useFallback: true, lowPower: true, reason: 'lite mode requested' };
  if (!webgl) return { webgl, useFallback: true, lowPower: true, reason: 'WebGL unavailable' };
  if (memory <= 2) return { webgl, useFallback: true, lowPower: true, reason: 'low-memory device' };
  return { webgl, useFallback: false, lowPower: saveData || memory <= 4 || cores <= 4 };
}
