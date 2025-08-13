import { render, screen } from '@testing-library/react';
import ProductsPage from './page';

jest.mock('next-auth', () => ({
  getServerSession: () => Promise.resolve({ user: { role: 'ADMIN' } }),
}));

describe('ProductsPage', () => {
  it('shows product list', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve([{ id: 1, name: 'Sample', category: 'Demo', priceARS: 10, stock: 5, isComposite: false }]),
    }) as any;
    const page = await ProductsPage();
    render(page);
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText(/Sample/)).toBeInTheDocument();
  });
});
