import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { TranscriptionRecord } from '../../types';

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

const List = styled.ul`
  list-style: none;
  padding: 0;
`;

const ListItem = styled.li`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
`;

const ItemLink = styled(Link)`
  color: #3498db;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const ItemDate = styled.span`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const Badge = styled.span`
  background-color: #2ecc71;
  color: white;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: #7f8c8d;
  padding: 2rem 0;
`;

const History: React.FC = () => {
  const [transcriptions, setTranscriptions] = useState<TranscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranscriptions = async () => {
      try {
        const history = await window.api.getTranscriptionHistory();
        setTranscriptions(history);
      } catch (error) {
        console.error('Error fetching transcription history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranscriptions();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Container>
      <Card>
        <Title>Transcription History</Title>
        
        {loading ? (
          <p>Loading transcription history...</p>
        ) : transcriptions.length > 0 ? (
          <List>
            {transcriptions.map(item => (
              <ListItem key={item.id}>
                <div>
                  <ItemLink to={`/transcription/${item.id}`}>
                    {item.fileName}
                    {item.hasSummary && <Badge>Summarized</Badge>}
                  </ItemLink>
                  <div>
                    <ItemDate>{formatDate(item.timestamp)}</ItemDate>
                  </div>
                </div>
              </ListItem>
            ))}
          </List>
        ) : (
          <EmptyMessage>
            No transcriptions yet. Go to the home page to create your first transcription.
          </EmptyMessage>
        )}
      </Card>
    </Container>
  );
};

export default History;