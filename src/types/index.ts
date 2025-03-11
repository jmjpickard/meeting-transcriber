import { SettingsSchema } from "../services/storage-service";

// API Window interface
export interface API {
  selectVideo: () => Promise<string | null>;
  transcribeVideo: (videoPath: string) => Promise<TranscriptionResult>;
  summarizeTranscription: (
    transcription: string,
    provider: string
  ) => Promise<SummaryResult>;
  getTranscriptionHistory: () => Promise<TranscriptionRecord[]>;
  getTranscription: (id: string) => Promise<TranscriptionData | null>;
  getSettings: () => Promise<SettingsSchema>;
  saveSettings: (
    settings: SettingsSchema
  ) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    api: API;
  }
}

// Transcription interfaces
export interface TranscriptionResult {
  success: boolean;
  transcription?: string;
  path?: string;
  error?: string;
}

export interface TranscriptionData {
  id: string;
  fileName: string;
  timestamp: string;
  transcription: string;
  summary?: string;
  summaryProvider?: string;
}

export interface TranscriptionRecord {
  id: string;
  fileName: string;
  timestamp: string;
  hasSummary: boolean;
}

// LLM interfaces
export interface SummaryResult {
  success: boolean;
  summary?: string;
  error?: string;
}

export type LLMProvider = "claude" | "openai" | "ollama";

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}
