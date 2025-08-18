import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import POSPage from './page';

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: vi.fn() },
}));

describe('POSPage', () => {
  it('renders and adds item calculating total', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve([{ id: 1 }]) })
      .mockResolvedValueOnce({
        json: () => Promise.resolve([{ id: 1, name: 'Test Product', priceARS: 10, barcodes: [] }]),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) }) as any;

    render(<POSPage />);
    const input = await screen.findByPlaceholderText('Buscar producto o código');
    await userEvent.type(input, 'Test');
    const option = await screen.findByText('Test Product');
    await userEvent.click(option);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('10.00')).toBeInTheDocument();
  });
});
