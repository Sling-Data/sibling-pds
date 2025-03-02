import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../../src/frontend/src/App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen).toBeDefined();
  });
});
