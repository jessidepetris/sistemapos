import { render, screen } from '@testing-library/react';
import ImportarProductosPage from './page';

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { role: 'ADMIN' } } }),
}));

describe('ImportarProductosPage', () => {
  it('renders heading', () => {
    render(<ImportarProductosPage />);
    expect(screen.getByText('Importar productos')).toBeInTheDocument();
  });
});
