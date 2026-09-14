import type { FeeRule } from './types';

export function calculateParticipantFee(batchNumber: number, feeRules: FeeRule[]): number {
  for (const rule of feeRules) {
    if (batchNumber >= rule.batch_from && batchNumber <= rule.batch_to) {
      return rule.fee_amount;
    }
  }
  return 0;
}

export function calculateTotalFee(
  participantFee: number,
  guestCount: number,
  guestFee: number,
  gatewayChargePercentage: number,
  gatewayChargeEnabled: boolean
) {
  const guestTotal = guestCount * guestFee;
  const subtotal = participantFee + guestTotal;
  const gatewayCharge = gatewayChargeEnabled
    ? Math.round((subtotal * gatewayChargePercentage) / 100)
    : 0;
  const total = subtotal + gatewayCharge;

  return { participantFee, guestTotal, subtotal, gatewayCharge, total };
}
