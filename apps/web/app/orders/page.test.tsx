import { render, screen } from '@testing-library/react';
import OrdersPage from './page';

describe('OrdersPage', () => {
  it('renders heading', () => {
    global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve([]) }) as any;
    render(<OrdersPage />);
    expect(screen.getByText('Notas de Pedido')).toBeInTheDocument();
  });
});
