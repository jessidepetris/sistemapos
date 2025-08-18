import { render, screen } from '@testing-library/react';
import AuditLogsPage from './page';

vi.mock('next-auth', () => ({
  getServerSession: () => Promise.resolve({ user: { role: 'ADMIN' } }),
}));

describe('AuditLogsPage', () => {
  it('renders heading', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve([]) });
    const page = await AuditLogsPage();
    render(page);
    expect(screen.getByText('Historial de Actividad')).toBeInTheDocument();
  });
});
