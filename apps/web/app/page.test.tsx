import { render, screen } from '@testing-library/react';
import Home from './page';

jest.mock('next-auth', () => ({
  getServerSession: () => Promise.resolve({ user: { role: 'ADMIN' } }),
}));

describe('HomePage', () => {
  it('renders dashboard heading', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve([]) }) as any;
    const page = await Home();
    render(page);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});

