import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { TranscriptionData, LLMProvider } from '../../types';

const Container = styled.div`
  max-width: 1000px;
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

const Metadata = styled.div`
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #7f8c8d;
`;

const TranscriptionText = styled.div`
  white-space: pre-wrap;
  line-height: 1.6;
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
`;

const SummaryText = styled.div`
  white-space: pre-wrap;
  line-height: 1.6;
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 4px;
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
  margin-right: 1rem;
  margin-bottom: 1rem;

  &:hover {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
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

const StatusMessage = styled.div<{ isError?: boolean }>`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  background-color: ${props => props.isError ? '#f8d7da' : '#d4edda'};
  color: ${props => props.isError ? '#721c24' : '#155724'};
`;

const TranscriptionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [transcription, setTranscription] = useState<TranscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

  useEffect(() => {
    const fetchTranscription = async () => {
      if (!id) return;
      
      try {
        const data = await window.api.getTranscription(id);
        setTranscription(data);
      } catch (error) {
        console.error('Error fetching transcription:', error);
        setStatus({
          message: `Error fetching transcription: ${(error as Error).message}`,
          isError: true
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTranscription();
  }, [id]);

  const handleGenerateSummary = async (provider: LLMProvider) => {
    if (!transcription) return;
    
    setIsGeneratingSummary(true);
    setStatus({ message: `Generating summary with ${provider}...`, isError: false });

    try {
      const result = await window.api.summarizeTranscription(transcription.transcription, provider);
      
      if (result.success && result.summary) {
        setTranscription({
          ...transcription,
          summary: result.summary,
          summaryProvider: provider
        });
        setStatus({ message: 'Summary generated successfully!', isError: false });
      } else {
        setStatus({ message: `Summary generation failed: ${result.error}`, isError: true });
      }
    } catch (error) {
      setStatus({
        message: `Error generating summary: ${(error as Error).message}`,
        isError: true
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Container>
        <Card>
          <p>Loading transcription...</p>
        </Card>
      </Container>
    );
  }

  if (!transcription) {
    return (
      <Container>
        <Card>
          <Title>Transcription Not Found</Title>
          <p>The requested transcription could not be found.</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <Title>{transcription.fileName}</Title>
        <Metadata>
          <div>Created: {formatDate(transcription.timestamp)}</div>
        </Metadata>

        <Subtitle>Transcription</Subtitle>
        <TranscriptionText>{transcription.transcription}</TranscriptionText>
      </Card>

      <Card>
        <Subtitle>Summary</Subtitle>
        
        {transcription.summary ? (
          <>
            <Metadata>
              <div>Generated using: {transcription.summaryProvider}</div>
            </Metadata>
            <SummaryText>{transcription.summary}</SummaryText>
          </>
        ) : (
          <div>
            <p>Generate a summary using one of the following models:</p>
            
            <div>
              <Button 
                onClick={() => handleGenerateSummary('claude')} 
                disabled={isGeneratingSummary}
              >
                Use Claude {isGeneratingSummary && <LoadingSpinner />}
              </Button>
              
              <Button 
                onClick={() => handleGenerateSummary('openai')} 
                disabled={isGeneratingSummary}
              >
                Use ChatGPT {isGeneratingSummary && <LoadingSpinner />}
              </Button>
              
              <Button 
                onClick={() => handleGenerateSummary('ollama')} 
                disabled={isGeneratingSummary}
              >
                Use Ollama (Local) {isGeneratingSummary && <LoadingSpinner />}
              </Button>
            </div>
            
            {status && (
              <StatusMessage isError={status.isError}>
                {status.message}
              </StatusMessage>
            )}
          </div>
        )}
      </Card>
    </Container>
  );
};

export default TranscriptionDetail;