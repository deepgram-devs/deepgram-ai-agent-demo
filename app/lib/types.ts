// Message type for Deepgram voice agent
export interface Message {
  content: string;
  role: string;
  audio?: ArrayBuffer;
  voice?: string;
  id: number | string;
}

export interface MessageMetadata extends Partial<Message> {
  start?: number;
  response?: number;
  end?: number;
  ttsModel?: string;
}
