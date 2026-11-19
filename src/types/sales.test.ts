import { describe, it, expect } from 'vitest';
import { salesRepresentativeFormSchema, serviceAreaAssignmentSchema } from './sales';

describe('Sales Validation Schemas', () => {
  describe('salesRepresentativeFormSchema', () => {
    const validData = {
      dealershipId: 'd1111111-1111-4111-a111-111111111111',
      name: 'Andi Pratama',
      whatsappNumber: '081234567890',
      position: 'Senior Sales Consultant',
      photoUrl: 'https://example.com/photos/andi.webp',
      isActive: true,
      sortOrder: 1,
    };

    it('validates a complete, valid sales representative record', () => {
      const result = salesRepresentativeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Andi Pratama');
        expect(result.data.whatsappNumber).toBe('081234567890');
      }
    });

    it('accepts +62 and 62 prefixed Indonesian WhatsApp numbers', () => {
      expect(
        salesRepresentativeFormSchema.safeParse({
          ...validData,
          whatsappNumber: '+62 812-3456-7890',
        }).success
      ).toBe(true);
      expect(
        salesRepresentativeFormSchema.safeParse({ ...validData, whatsappNumber: '6281234567890' })
          .success
      ).toBe(true);
    });

    it('rejects invalid or non-Indonesian phone numbers', () => {
      expect(
        salesRepresentativeFormSchema.safeParse({ ...validData, whatsappNumber: '12345' }).success
      ).toBe(false);
      expect(
        salesRepresentativeFormSchema.safeParse({ ...validData, whatsappNumber: 'not-a-number' })
          .success
      ).toBe(false);
      expect(
        salesRepresentativeFormSchema.safeParse({ ...validData, whatsappNumber: '' }).success
      ).toBe(false);
    });

    it('rejects invalid UUID for dealershipId', () => {
      const result = salesRepresentativeFormSchema.safeParse({
        ...validData,
        dealershipId: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short or empty name', () => {
      expect(salesRepresentativeFormSchema.safeParse({ ...validData, name: '' }).success).toBe(
        false
      );
      expect(salesRepresentativeFormSchema.safeParse({ ...validData, name: 'A' }).success).toBe(
        false
      );
    });

    it('allows null or omitted photoUrl and position', () => {
      const result = salesRepresentativeFormSchema.safeParse({
        dealershipId: 'd1111111-1111-4111-a111-111111111111',
        name: 'Budi Santoso',
        whatsappNumber: '085711223344',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('serviceAreaAssignmentSchema', () => {
    it('validates a correct service area assignment', () => {
      const result = serviceAreaAssignmentSchema.safeParse({
        dealershipId: 'd1111111-1111-4111-a111-111111111111',
        regencyId: 'kab-sidoarjo',
        isActive: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid dealership UUID or missing regencyId', () => {
      expect(
        serviceAreaAssignmentSchema.safeParse({
          dealershipId: 'not-a-uuid',
          regencyId: 'kab-sidoarjo',
        }).success
      ).toBe(false);

      expect(
        serviceAreaAssignmentSchema.safeParse({
          dealershipId: 'd1111111-1111-4111-a111-111111111111',
          regencyId: '',
        }).success
      ).toBe(false);
    });
  });
});
