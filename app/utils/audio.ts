// app/utils/audio.ts
// This utility is no longer needed as we handle audio parsing directly in the chat screen
// Keeping for backward compatibility if needed elsewhere
export function pickFirstAudioUri(payload: any): string | null {
  if (!payload) return null;

  // If payload has top-level audio array with public_url
  if (Array.isArray(payload.audio) && payload.audio.length) {
    const first = payload.audio.find((c: any) => c?.public_url) || payload.audio[0];
    return first?.public_url || null;
  }

  // If payload is a single message with an audioUri
  return payload.audioUri || payload.url || null;
}