import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import ElectronStore from "electron-store";
import { app } from "electron";
import { TranscriptionData, TranscriptionRecord } from "../types";

export interface SettingsSchema {
  huggingfaceApiKey: string;
  claudeApiKey: string;
  openaiApiKey: string;
  defaultLLMProvider: string;
  enableSpeakerDiarization: boolean;
  ollamaSettings: {
    baseUrl: string;
    model: string;
  };
}

// Define the store schema interface
interface StoreSchema {
  transcriptions: Record<string, TranscriptionData>;
  settings: SettingsSchema;
}

export class StorageService {
  private store: any; // Use any temporarily to bypass type checking
  private storageDir: string;

  constructor() {
    this.store = new ElectronStore<StoreSchema>({
      name: "transcription-data",
      defaults: {
        transcriptions: {},
        settings: {
          huggingfaceApiKey: "",
          claudeApiKey: "",
          openaiApiKey: "",
          defaultLLMProvider: "ollama",
          enableSpeakerDiarization: true,
          ollamaSettings: {
            baseUrl: "http://localhost:11434",
            model: "llama3",
          },
        },
      },
    });

    // Create storage directory for transcription files
    const userDataPath = app.getPath("userData");
    this.storageDir = path.join(userDataPath, "transcriptions");

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public async saveTranscription(
    fileName: string,
    transcription: string
  ): Promise<string> {
    const id = crypto.randomBytes(16).toString("hex");
    const timestamp = new Date().toISOString();

    // Save transcription to file
    const filePath = path.join(this.storageDir, `${id}.txt`);
    await fs.promises.writeFile(filePath, transcription, "utf-8");

    // Save metadata in the store
    const transcriptionData: TranscriptionData = {
      id,
      fileName,
      timestamp,
      transcription,
    };

    const transcriptions = this.store.get("transcriptions") as Record<
      string,
      TranscriptionData
    >;
    transcriptions[id] = transcriptionData;
    this.store.set("transcriptions", transcriptions);

    return id;
  }

  public async saveSummary(
    transcriptionId: string,
    summary: string,
    provider: string
  ): Promise<void> {
    const transcriptions = this.store.get("transcriptions") as Record<
      string,
      TranscriptionData
    >;

    if (!transcriptions[transcriptionId]) {
      throw new Error(`Transcription with ID ${transcriptionId} not found`);
    }

    transcriptions[transcriptionId].summary = summary;
    transcriptions[transcriptionId].summaryProvider = provider;

    this.store.set("transcriptions", transcriptions);
  }

  public async getTranscriptionHistory(): Promise<TranscriptionRecord[]> {
    const transcriptions = this.store.get("transcriptions") as Record<
      string,
      TranscriptionData
    >;

    return Object.values(transcriptions)
      .map((t) => ({
        id: t.id,
        fileName: t.fileName,
        timestamp: t.timestamp,
        hasSummary: !!t.summary,
      }))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  public async getTranscription(id: string): Promise<TranscriptionData | null> {
    const transcriptions = this.store.get("transcriptions") as Record<
      string,
      TranscriptionData
    >;
    return transcriptions[id] || null;
  }

  public getSettings(): SettingsSchema {
    return this.store.get("settings");
  }

  public saveSettings(settings: SettingsSchema): {
    success: boolean;
    error?: string;
  } {
    try {
      this.store.set("settings", settings);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save settings: ${(error as Error).message}`,
      };
    }
  }
}
