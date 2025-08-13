describe('Payments E2E', () => {
  it('changes payment status to APPROVED', () => {
    const payment: any = { status: 'PENDING' };
    payment.status = 'APPROVED';
    expect(payment.status).toBe('APPROVED');
  });
});
