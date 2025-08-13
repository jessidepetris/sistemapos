import { render, screen } from '@testing-library/react';
import AuditLogsPage from './page';

jest.mock('next-auth', () => ({
  getServerSession: () => Promise.resolve({ user: { role: 'ADMIN' } }),
}));

describe('AuditLogsPage', () => {
  it('renders heading', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve([]) });
    const page = await AuditLogsPage();
    render(page);
    expect(screen.getByText('Historial de Actividad')).toBeInTheDocument();
  });
});
