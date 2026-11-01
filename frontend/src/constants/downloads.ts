export const DIRECT_WINDOWS_DOWNLOAD =
  'https://github.com/Aadrit555/Marduk/releases/latest/download/MARDUK-Setup-x64.exe';

export const WIN_FILENAME = 'MARDUK-Setup-x64.exe';
export const WIN_SHA256 = '1f570b12efcdcd5e35fa28dc94c6d5109e6b3da37a596141bb0c2b4404404089';
export const WIN_FILE_SIZE = '11.09 MB';
export const APP_VERSION = 'v0.1.0';

export type OperatingSystem = 'windows' | 'macos-arm' | 'macos-intel' | 'linux';

export function detectVisitorOS(): { os: OperatingSystem; label: string } {
  if (typeof window === 'undefined') {
    return { os: 'windows', label: 'Windows x64' };
  }
  const ua = window.navigator.userAgent.toLowerCase();
  if (/macintosh|mac os x/i.test(ua)) {
    return { os: 'macos-arm', label: 'macOS Apple Silicon' };
  }
  if (/linux/i.test(ua) && !/android/i.test(ua)) {
    return { os: 'linux', label: 'Linux x86_64' };
  }
  return { os: 'windows', label: 'Windows x64' };
}
