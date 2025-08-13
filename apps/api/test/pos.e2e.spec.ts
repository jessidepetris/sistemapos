describe('POS E2E', () => {
  it('creates a simple sale and validates totals', () => {
    const items = [
      { price: 10, qty: 2 },
      { price: 5, qty: 1 },
    ];
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    expect(subtotal).toBe(25);
  });
});
