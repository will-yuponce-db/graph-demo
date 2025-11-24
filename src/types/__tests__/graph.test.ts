import { describe, it, expect } from 'vitest';
import { ChangeStatus, getColorForType } from '../graph';

describe('graph types', () => {
  describe('ChangeStatus', () => {
    it('has correct enum values', () => {
      expect(ChangeStatus.NEW).toBe('new');
      expect(ChangeStatus.EXISTING).toBe('existing');
    });
  });

  describe('getColorForType', () => {
    it('returns consistent colors for the same type', () => {
      const color1 = getColorForType('Person', false);
      const color2 = getColorForType('Person', false);
      expect(color1).toBe(color2);
    });

    it('returns different colors for different types', () => {
      const personColor = getColorForType('Person', false);
      const companyColor = getColorForType('Company', false);
      expect(personColor).not.toBe(companyColor);
    });

    it('returns different colors for light and dark modes', () => {
      const lightColor = getColorForType('Person', false);
      const darkColor = getColorForType('Person', true);
      expect(lightColor).not.toBe(darkColor);
    });

    it('returns valid hex color codes', () => {
      const color = getColorForType('Test', false);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('handles various node type strings', () => {
      const types = ['Person', 'Company', 'Location', 'Event', 'Product'];
      types.forEach((type) => {
        const color = getColorForType(type, false);
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });
});
