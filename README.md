# Video Call Transcription App

An Electron-based desktop application for transcribing video calls, generating summaries using various LLM providers, and storing the results locally.

## Features

- Transcribe video files using HuggingFace's Whisper model
- Generate summaries of transcriptions using three LLM providers:
  - Anthropic Claude
  - OpenAI ChatGPT
  - Ollama (local models)
- Store transcriptions and summaries locally
- View historical transcriptions and their summaries

## Prerequisites

- Node.js (v16+)
- npm
- ffmpeg (for audio extraction from videos)
- For the Ollama integration: Ollama installed and running locally with models downloaded

## Installation

1. Clone the repository
2. Install dependencies:

```bash
cd transcription-app
npm install
```

3. Start the application in development mode:

```bash
npm run dev
```

4. To build the application for production:

```bash
npm run build
npm run dist
```

## Configuration

In the Settings page, you can configure:

- API keys for HuggingFace, Claude, and OpenAI
- Default LLM provider for summaries
- Ollama settings (base URL and model)

## How it Works

1. **Video Selection**: Select a video file from your computer
2. **Transcription**: The app extracts audio from the video using ffmpeg and sends it to HuggingFace's Whisper model
3. **Summarization**: Choose an LLM provider to generate a summary of the transcription
4. **History**: View all your transcriptions and summaries in the History page

## Technical Details

- **Framework**: Electron with TypeScript
- **UI**: React with Emotion for styling
- **State Management**: React Hooks
- **Transcription**: HuggingFace Inference API (Whisper model)
- **LLM Integration**: 
  - Anthropic Claude API
  - OpenAI ChatGPT API
  - Ollama local API

## Limitations

- Requires an internet connection for HuggingFace, Claude, and OpenAI integrations
- For long videos, transcription might take significant time
- Requires ffmpeg installed on the system

## Future Improvements

- Add speaker diarization (who is speaking)
- Implement more local transcription options
- Add video playback with transcript navigation
- Improve transcription accuracy with custom models