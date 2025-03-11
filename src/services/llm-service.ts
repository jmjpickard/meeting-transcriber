import { LLMConfig, LLMProvider } from "../types";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import axios from "axios";

import { SettingsSchema } from "./storage-service";

export class LLMService {
  private configs: Record<LLMProvider, LLMConfig> = {
    claude: {
      provider: "claude",
      model: "claude-3-haiku-20240307",
    },
    openai: {
      provider: "openai",
      model: "gpt-3.5-turbo",
    },
    ollama: {
      provider: "ollama",
      model: "llama3",
      baseUrl: "http://localhost:11434",
    },
  };

  public updateConfig(settings: SettingsSchema): void {
    // Update Claude config if API key is provided
    if (settings.claudeApiKey) {
      this.setConfig("claude", { apiKey: settings.claudeApiKey });
    }

    // Update OpenAI config if API key is provided
    if (settings.openaiApiKey) {
      this.setConfig("openai", { apiKey: settings.openaiApiKey });
    }

    // Update Ollama config 
    if (settings.ollamaSettings) {
      this.setConfig("ollama", { 
        baseUrl: settings.ollamaSettings.baseUrl,
        model: settings.ollamaSettings.model
      });
    }
    
    // Set default provider if available
    if (settings.defaultLLMProvider) {
      // Validate that the provider is one of the allowed types
      const provider = settings.defaultLLMProvider as LLMProvider;
      if (this.configs[provider]) {
        // Default provider is valid
        console.log(`Default LLM provider set to: ${provider}`);
      } else {
        console.warn(`Invalid LLM provider: ${settings.defaultLLMProvider}, using ollama as fallback`);
      }
    }
  }

  public setConfig(provider: LLMProvider, config: Partial<LLMConfig>): void {
    this.configs[provider] = { ...this.configs[provider], ...config };
  }

  public async generateSummary(
    transcription: string,
    provider: string
  ): Promise<string> {
    const llmProvider = provider as LLMProvider;

    if (!this.configs[llmProvider]) {
      throw new Error(`Unknown LLM provider: ${provider}`);
    }

    const config = this.configs[llmProvider];

    switch (llmProvider) {
      case "claude":
        return this.generateClaudeSummary(transcription, config);
      case "openai":
        return this.generateOpenAISummary(transcription, config);
      case "ollama":
        return this.generateOllamaSummary(transcription, config);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  private async generateClaudeSummary(
    transcription: string,
    config: LLMConfig
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error("Claude API key is not set");
    }

    const anthropic = new Anthropic({
      apiKey: config.apiKey,
    });

    const prompt = `Below is a transcript of a video call. Please summarize the key points, main topics discussed, and any decisions or action items mentioned.

Transcript:
${transcription}

Summary:`;

    try {
      const response = await anthropic.messages.create({
        model: config.model || "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });

      // Type guard to handle different content block types
      if (response.content[0].type === "text") {
        return response.content[0].text;
      } else {
        // Handle other content types or return an empty string
        console.warn(
          "Unexpected content type from Claude API:",
          response.content[0].type
        );
        return "";
      }
    } catch (error) {
      console.error("Claude API error:", error);
      throw new Error(`Claude API error: ${(error as Error).message}`);
    }
  }

  private async generateOpenAISummary(
    transcription: string,
    config: LLMConfig
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error("OpenAI API key is not set");
    }

    const openai = new OpenAI({
      apiKey: config.apiKey,
    });

    const prompt = `Below is a transcript of a video call. Please summarize the key points, main topics discussed, and any decisions or action items mentioned.

Transcript:
${transcription}

Summary:`;

    try {
      const response = await openai.chat.completions.create({
        model: config.model || "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      });

      return response.choices[0].message.content || "No summary generated";
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${(error as Error).message}`);
    }
  }

  private async generateOllamaSummary(
    transcription: string,
    config: LLMConfig
  ): Promise<string> {
    const baseUrl = config.baseUrl || "http://localhost:11434";
    const model = config.model || "llama3";

    const prompt = `Below is a transcript of a video call. Please summarize the key points, main topics discussed, and any decisions or action items mentioned.

Transcript:
${transcription}

Summary:`;

    try {
      const response = await axios.post(`${baseUrl}/api/generate`, {
        model,
        prompt,
        stream: false,
      });

      return response.data.response;
    } catch (error) {
      console.error("Ollama API error:", error);
      throw new Error(`Ollama API error: ${(error as Error).message}`);
    }
  }
}
