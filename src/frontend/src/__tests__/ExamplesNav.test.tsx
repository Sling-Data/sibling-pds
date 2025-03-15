// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ExamplesNav } from '../components/examples/ExamplesNav';

describe('ExamplesNav', () => {
  const renderWithRouter = (path: string) => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<ExamplesNav />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders all example links', () => {
    renderWithRouter('/notification-example');
    
    expect(screen.getByText('Notification Example')).toBeInTheDocument();
    expect(screen.getByText('Form Example')).toBeInTheDocument();
    expect(screen.getByText('API Request Example')).toBeInTheDocument();
    expect(screen.getByText('Back to App')).toBeInTheDocument();
  });

  it('highlights the active link', () => {
    renderWithRouter('/notification-example');
    
    const notificationLink = screen.getByText('Notification Example');
    const formLink = screen.getByText('Form Example');
    
    expect(notificationLink.closest('a')).toHaveClass('bg-blue-500');
    expect(formLink.closest('a')).not.toHaveClass('bg-blue-500');
  });

  it('changes the active link based on the current route', () => {
    renderWithRouter('/form-example');
    
    const notificationLink = screen.getByText('Notification Example');
    const formLink = screen.getByText('Form Example');
    
    expect(notificationLink.closest('a')).not.toHaveClass('bg-blue-500');
    expect(formLink.closest('a')).toHaveClass('bg-blue-500');
  });
}); 