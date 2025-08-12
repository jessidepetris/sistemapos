import { render, screen } from '@testing-library/react';
import ProductsPage from './page';

jest.mock('next-auth', () => ({
  getServerSession: () => Promise.resolve({ user: { role: 'ADMIN' } }),
}));

describe('ProductsPage', () => {
  it('renders heading', async () => {
    // mock fetch used in getProducts
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve([]),
    }) as any;
    const page = await ProductsPage();
    render(page);
    expect(screen.getByText('Products')).toBeInTheDocument();
  });
});
