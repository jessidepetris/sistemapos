import { render, screen } from '@testing-library/react';
import QuotationsPage from './page';

describe('QuotationsPage', () => {
  it('renders heading', () => {
    global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve([]) }) as any;
    render(<QuotationsPage />);
    expect(screen.getByText('Presupuestos')).toBeInTheDocument();
  });
});
