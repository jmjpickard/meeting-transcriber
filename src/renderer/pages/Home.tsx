import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  color: #2c3e50;
  margin-top: 0;
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const FileInput = styled.div`
  margin-bottom: 1rem;
`;

const StatusMessage = styled.div<{ isError?: boolean }>`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  background-color: ${props => props.isError ? '#f8d7da' : '#d4edda'};
  color: ${props => props.isError ? '#721c24' : '#155724'};
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-left: 10px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

  const handleSelectVideo = async () => {
    try {
      const filePath = await window.api.selectVideo();
      if (filePath) {
        setSelectedFile(filePath);
        setStatus(null);
      }
    } catch (error) {
      setStatus({
        message: `Error selecting video: ${(error as Error).message}`,
        isError: true
      });
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;

    setIsTranscribing(true);
    setStatus({ message: 'Transcribing video...', isError: false });

    try {
      const result = await window.api.transcribeVideo(selectedFile);
      
      if (result.success) {
        setStatus({ message: 'Transcription completed successfully!', isError: false });
        // Navigate to the transcription detail page
        navigate(`/transcription/${result.path}`);
      } else {
        setStatus({ message: `Transcription failed: ${result.error}`, isError: true });
      }
    } catch (error) {
      setStatus({
        message: `Error during transcription: ${(error as Error).message}`,
        isError: true
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Container>
      <Card>
        <Title>Transcribe a Video Call</Title>
        <p>Select a video file of your call to transcribe. The app will distinguish between different speakers in the recording. The transcription will be saved and can be viewed in your history.</p>
        
        <FileInput>
          <Button onClick={handleSelectVideo} disabled={isTranscribing}>
            Select Video
          </Button>
          {selectedFile && (
            <p>Selected: {selectedFile}</p>
          )}
        </FileInput>

        <Button 
          onClick={handleTranscribe} 
          disabled={!selectedFile || isTranscribing}
        >
          Transcribe {isTranscribing && <LoadingSpinner />}
        </Button>

        {status && (
          <StatusMessage isError={status.isError}>
            {status.message}
          </StatusMessage>
        )}
      </Card>
    </Container>
  );
};

export default Home;