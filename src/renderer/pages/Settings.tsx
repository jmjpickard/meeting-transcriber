import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { LLMProvider } from "../../types";
import { SettingsSchema } from "../../services/storage-service";

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin-top: 0;
`;

const Subtitle = styled.h3`
  color: #34495e;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

const StatusMessage = styled.div<{ isError?: boolean }>`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  background-color: ${(props) => (props.isError ? "#f8d7da" : "#d4edda")};
  color: ${(props) => (props.isError ? "#721c24" : "#155724")};
`;

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsSchema>({
    huggingfaceApiKey: "",
    claudeApiKey: "",
    openaiApiKey: "",
    defaultLLMProvider: "ollama" as LLMProvider,
    enableSpeakerDiarization: true,
    ollamaSettings: {
      baseUrl: "http://localhost:11434",
      model: "llama3",
    },
  });

  const [status, setStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    // Load settings from the main process
    const loadSettings = async () => {
      try {
        const savedSettings = await window.api.getSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch (error) {
        setStatus({
          message: `Error loading settings: ${(error as Error).message}`,
          isError: true,
        });
      }
    };

    loadSettings();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const isCheckbox = type === "checkbox";
    const inputValue = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : value;

    if (name.startsWith("ollama.")) {
      const ollamaField = name.split(".")[1];
      setSettings({
        ...settings,
        ollamaSettings: {
          ...settings.ollamaSettings,
          [ollamaField]: inputValue,
        },
      });
    } else {
      setSettings({
        ...settings,
        [name]: inputValue,
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Save settings via IPC
      const result = await window.api.saveSettings(settings);

      if (result.success) {
        setStatus({
          message: "Settings saved successfully!",
          isError: false,
        });
      } else {
        setStatus({
          message: `Failed to save settings: ${result.error}`,
          isError: true,
        });
      }
    } catch (error) {
      setStatus({
        message: `Error saving settings: ${(error as Error).message}`,
        isError: true,
      });
    }

    // Clear the status message after a few seconds
    setTimeout(() => {
      setStatus(null);
    }, 3000);
  };

  return (
    <Container>
      <Card>
        <Title>Settings</Title>

        <Subtitle>API Keys</Subtitle>
        <FormGroup>
          <Label htmlFor="huggingfaceApiKey">HuggingFace API Key</Label>
          <Input
            type="password"
            id="huggingfaceApiKey"
            name="huggingfaceApiKey"
            value={settings.huggingfaceApiKey}
            onChange={handleInputChange}
            placeholder="Enter your HuggingFace API key"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="claudeApiKey">Anthropic Claude API Key</Label>
          <Input
            type="password"
            id="claudeApiKey"
            name="claudeApiKey"
            value={settings.claudeApiKey}
            onChange={handleInputChange}
            placeholder="Enter your Claude API key"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
          <Input
            type="password"
            id="openaiApiKey"
            name="openaiApiKey"
            value={settings.openaiApiKey}
            onChange={handleInputChange}
            placeholder="Enter your OpenAI API key"
          />
        </FormGroup>

        <Subtitle>Transcription Settings</Subtitle>
        <CheckboxWrapper>
          <Checkbox
            type="checkbox"
            id="enableSpeakerDiarization"
            name="enableSpeakerDiarization"
            checked={settings.enableSpeakerDiarization}
            onChange={handleInputChange}
          />
          <Label
            htmlFor="enableSpeakerDiarization"
            style={{ display: "inline", marginBottom: 0 }}
          >
            Enable speaker diarization (identify who is speaking in video calls)
          </Label>
        </CheckboxWrapper>

        <Subtitle>LLM Settings</Subtitle>
        <FormGroup>
          <Label htmlFor="defaultLLMProvider">Default LLM Provider</Label>
          <Select
            id="defaultLLMProvider"
            name="defaultLLMProvider"
            value={settings.defaultLLMProvider}
            onChange={handleInputChange}
          >
            <option value="claude">Claude</option>
            <option value="openai">OpenAI</option>
            <option value="ollama">Ollama (Local)</option>
          </Select>
        </FormGroup>

        <Subtitle>Ollama Settings</Subtitle>
        <FormGroup>
          <Label htmlFor="ollama.baseUrl">Ollama Base URL</Label>
          <Input
            type="text"
            id="ollama.baseUrl"
            name="ollama.baseUrl"
            value={settings.ollamaSettings.baseUrl}
            onChange={handleInputChange}
            placeholder="http://localhost:11434"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="ollama.model">Ollama Model</Label>
          <Input
            type="text"
            id="ollama.model"
            name="ollama.model"
            value={settings.ollamaSettings.model}
            onChange={handleInputChange}
            placeholder="llama3"
          />
        </FormGroup>

        <Button onClick={handleSaveSettings}>Save Settings</Button>

        {status && (
          <StatusMessage isError={status.isError}>
            {status.message}
          </StatusMessage>
        )}
      </Card>
    </Container>
  );
};

export default Settings;
