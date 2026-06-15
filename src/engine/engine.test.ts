import { describe, it, expect } from 'vitest';

describe('engine setup', () => {
  it('should run tests', () => {
    // Valide juste que Vitest tourne — les vrais tests arrivent au CP 3.
    expect(2 + 2).toBe(4);
  });
});
