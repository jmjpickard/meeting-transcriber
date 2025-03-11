import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { LLMService } from '../services/llm-service';
import { StorageService } from '../services/storage-service';
import { TranscriptionService } from '../services/transcription-service';

// Initialize services
const llmService = new LLMService();
const storageService = new StorageService();
const transcriptionService = new TranscriptionService();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show the window until it's ready
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      console.log('Window is ready to show');
      mainWindow.show();
    }
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('Electron app is ready');
  createWindow();

  // Load saved settings
  const settings = storageService.getSettings();
  
  // Initialize services with saved settings
  llmService.updateConfig(settings);
  
  // Set the HuggingFace API key for transcription service
  if (settings.huggingfaceApiKey) {
    transcriptionService.setApiKey(settings.huggingfaceApiKey);
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('select-video', async () => {
  if (!mainWindow) return null;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv'] }]
  });
  
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('transcribe-video', async (_, videoPath: string) => {
  try {
    // Get current settings to use for transcription
    const settings = storageService.getSettings();
    
    // Pass the diarization setting from settings
    const transcription = await transcriptionService.transcribeVideo(
      videoPath, 
      settings.enableSpeakerDiarization
    );
    
    const id = await storageService.saveTranscription(videoPath, transcription);
    return { id, transcription };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Failed to transcribe video: ${(error as Error).message}`);
  }
});

ipcMain.handle('summarize-transcription', async (_, transcription: string, provider?: string) => {
  try {
    // If no provider is specified, use the default from settings
    if (!provider) {
      const settings = storageService.getSettings();
      provider = settings.defaultLLMProvider;
      console.log(`Using default LLM provider: ${provider}`);
    }
    
    return await llmService.generateSummary(transcription, provider);
  } catch (error) {
    console.error('Summary generation error:', error);
    throw new Error(`Failed to generate summary: ${(error as Error).message}`);
  }
});

ipcMain.handle('get-transcription-history', async () => {
  return storageService.getTranscriptionHistory();
});

ipcMain.handle('get-transcription', async (_, id: string) => {
  return storageService.getTranscription(id);
});

ipcMain.handle('get-settings', async () => {
  return storageService.getSettings();
});

ipcMain.handle('save-settings', async (_, settings: any) => {
  try {
    // Update services with the new settings
    llmService.updateConfig(settings);
    
    // For transcription service, ensure HuggingFace API key is set
    if (settings.huggingfaceApiKey) {
      transcriptionService.setApiKey(settings.huggingfaceApiKey);
    }
    
    // Save settings to storage
    const result = storageService.saveSettings(settings);
    return result;
  } catch (error) {
    console.error('Error saving settings:', error);
    return {
      success: false,
      error: `Failed to apply settings: ${(error as Error).message}`
    };
  }
});
