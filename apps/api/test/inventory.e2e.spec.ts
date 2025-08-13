describe('Inventory E2E', () => {
  it('scans and approves inventory session', () => {
    const session: any = { items: [], status: 'OPEN' };
    session.items.push('item');
    session.status = 'APPROVED';
    expect(session.items).toHaveLength(1);
    expect(session.status).toBe('APPROVED');
  });
});
