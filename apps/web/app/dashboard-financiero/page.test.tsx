import { render } from '@testing-library/react';
import DashboardFinanciero from './page';

describe('DashboardFinanciero', () => {
  it('renders title', () => {
    const { getByText } = render(<DashboardFinanciero />);
    expect(getByText('Dashboard Financiero')).toBeInTheDocument();
  });
});
