import { HfInference } from "@huggingface/inference";
import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import { execFile } from "child_process";
import * as os from "os";
import * as crypto from "crypto";

const execFilePromise = util.promisify(execFile);

export class TranscriptionService {
  private hf: HfInference;
  private apiKey: string = "";

  constructor() {
    // Initialize with an empty API key - will be set later
    this.hf = new HfInference();

    // Try to load API key from environment variable
    if (process.env.HUGGINGFACE_API_KEY) {
      this.apiKey = process.env.HUGGINGFACE_API_KEY;
      this.hf = new HfInference(this.apiKey);
    }
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.hf = new HfInference(this.apiKey);
  }

  public async transcribeVideo(
    videoPath: string,
    enableDiarization: boolean = true
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("HuggingFace API key is not set");
    }

    // Extract audio from video using ffmpeg
    const audioPath = await this.extractAudioFromVideo(videoPath);

    try {
      // Use HuggingFace's ASR model for transcription
      const audioBuffer = fs.readFileSync(audioPath);

      if (enableDiarization) {
        // For speaker diarization, we'll use pyannote/speaker-diarization@2.1
        // and then combine it with the transcription for better results
        try {
          console.log("Starting speaker diarization...");

          // First, get the transcription
          const transcription = await this.hf.automaticSpeechRecognition({
            model: "openai/whisper-large-v3",
            data: audioBuffer,
            parameters: {
              chunk_length_s: 30, // Process in 30-second chunks
              return_timestamps: true, // Get word-level timestamps
            },
          });

          // Then get the speaker diarization
          const diarization = await this.hf.audioClassification({
            model: "pyannote/speaker-diarization@2.1",
            data: audioBuffer,
          });

          // Combine transcription with speaker information
          // This is a simplified approach - in a production app,
          // you would use more sophisticated alignment between timestamps
          let result = "";
          let currentSpeaker = "";
          let speakerSegments = this.processRawDiarization(diarization);

          // If we have word timestamps from whisper, we can align them with speaker segments
          if (transcription.chunks) {
            for (const chunk of transcription.chunks) {
              const startTime = chunk.timestamp[0];
              const speakerAtTime = this.getSpeakerAtTime(
                speakerSegments,
                startTime
              );

              if (speakerAtTime !== currentSpeaker) {
                currentSpeaker = speakerAtTime;
                result += `\\n\\n[Speaker ${currentSpeaker}]: `;
              }

              result += chunk.text + " ";
            }
          } else {
            // Fallback if we don't have detailed timestamps
            result = `[No speaker information available]\\n${transcription.text}`;
          }

          return result.trim();
        } catch (diarizationError) {
          console.error(
            "Speaker diarization failed, falling back to standard transcription",
            diarizationError
          );
          // Fall back to standard transcription if diarization fails
          const transcription = await this.hf.automaticSpeechRecognition({
            model: "openai/whisper-large-v3",
            data: audioBuffer,
          });

          return `[Speaker diarization failed]\\n${transcription.text}`;
        }
      } else {
        // Standard transcription without diarization
        const transcription = await this.hf.automaticSpeechRecognition({
          model: "openai/whisper-large-v3",
          data: audioBuffer,
        });

        return transcription.text;
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw new Error(`Transcription failed: ${(error as Error).message}`);
    } finally {
      // Clean up temporary audio file
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }

  // Helper method to process raw diarization output
  private processRawDiarization(
    diarization: any
  ): Array<{ start: number; end: number; speaker: string }> {
    // This is a simplified implementation
    // In production, you'd need to parse the actual diarization format
    // from pyannote, which might be different
    const segments: Array<{ start: number; end: number; speaker: string }> = [];

    try {
      // Parse diarization output
      // Example format might be: "SPEAKER_00 0.5 1.8, SPEAKER_01 1.9 3.2, ..."
      if (Array.isArray(diarization)) {
        diarization.forEach((segment: any) => {
          if (segment.segment && segment.speaker) {
            segments.push({
              start: segment.segment.start,
              end: segment.segment.end,
              speaker: segment.speaker,
            });
          }
        });
      }
    } catch (error) {
      console.error("Error processing diarization output:", error);
    }

    return segments;
  }

  // Helper method to find which speaker is talking at a given time
  private getSpeakerAtTime(
    segments: Array<{ start: number; end: number; speaker: string }>,
    time: number
  ): string {
    for (const segment of segments) {
      if (time >= segment.start && time <= segment.end) {
        return segment.speaker;
      }
    }
    return "Unknown";
  }

  private async extractAudioFromVideo(videoPath: string): Promise<string> {
    const tempDir = os.tmpdir();
    const randomId = crypto.randomBytes(8).toString("hex");
    const audioPath = path.join(tempDir, `audio-${randomId}.mp3`);

    try {
      // Use ffmpeg to extract audio
      await execFilePromise("ffmpeg", [
        "-i",
        videoPath,
        "-q:a",
        "0",
        "-map",
        "a",
        audioPath,
      ]);

      return audioPath;
    } catch (error) {
      console.error("Error extracting audio:", error);
      throw new Error(
        "Failed to extract audio from video. Make sure ffmpeg is installed on your system."
      );
    }
  }
}
