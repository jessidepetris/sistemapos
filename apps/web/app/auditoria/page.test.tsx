import { render, screen } from '@testing-library/react';
import AuditoriaPage from './page';

describe('AuditoriaPage', () => {
  it('renders heading', () => {
    render(<AuditoriaPage />);
    expect(screen.getByText('Auditoría')).toBeInTheDocument();
  });
});
