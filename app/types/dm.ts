// app/types/dm.ts
export type DmAudio = {
  path: string;
  mime: string;
  voice: string;
  duration_ms: number;
  public_url: string;
};

export type DmResponse = {
  sessionId: string;
  messageId?: string | null;
  text: string;
  audio: DmAudio[];
};