import { render, screen } from '@testing-library/react';
import AccountPage from './page';

describe('AccountPage', () => {
  it('renders heading', () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ movements: [], balance: 0 }),
    }) as any;
    render(<AccountPage params={{ clientId: '1' }} />);
    expect(
      screen.getByText('Cuenta Corriente Cliente 1')
    ).toBeInTheDocument();
  });
});
