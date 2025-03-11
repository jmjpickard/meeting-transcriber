import { contextBridge, ipcRenderer } from 'electron';
import { SettingsSchema } from '../services/storage-service';
import { SummaryResult } from '../types';

contextBridge.exposeInMainWorld('api', {
  // Video operations
  selectVideo: () => ipcRenderer.invoke('select-video'),
  transcribeVideo: (videoPath: string) => ipcRenderer.invoke('transcribe-video', videoPath),
  
  // LLM operations
  summarizeTranscription: (transcription: string, provider?: string): Promise<SummaryResult> => 
    ipcRenderer.invoke('summarize-transcription', transcription, provider),
  
  // Storage operations
  getTranscriptionHistory: () => ipcRenderer.invoke('get-transcription-history'),
  getTranscription: (id: string) => ipcRenderer.invoke('get-transcription', id),
  
  // Settings operations
  getSettings: (): Promise<SettingsSchema> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: SettingsSchema): Promise<{ success: boolean; error?: string }> => 
    ipcRenderer.invoke('save-settings', settings),
});