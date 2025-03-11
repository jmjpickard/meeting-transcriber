import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';
import TranscriptionDetail from './pages/TranscriptionDetail';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #2c3e50;
  color: white;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

const Nav = styled.nav`
  display: flex;
  gap: 1rem;
`;

const NavLink = styled(Link)<{ active?: boolean }>`
  color: ${props => props.active ? '#3498db' : 'white'};
  text-decoration: none;
  padding: 0.5rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  border-bottom: ${props => props.active ? '2px solid #3498db' : 'none'};

  &:hover {
    color: #3498db;
  }
`;

const Content = styled.main`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const App: React.FC = () => {
  const location = useLocation();

  return (
    <Container>
      <Header>
        <Title>Transcription App</Title>
        <Nav>
          <NavLink to="/" active={location.pathname === '/'}>Home</NavLink>
          <NavLink to="/history" active={location.pathname === '/history'}>History</NavLink>
          <NavLink to="/settings" active={location.pathname === '/settings'}>Settings</NavLink>
        </Nav>
      </Header>
      <Content>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/transcription/:id" element={<TranscriptionDetail />} />
        </Routes>
      </Content>
    </Container>
  );
};

export default App;