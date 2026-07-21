export interface PayoutInput {
  listPrice: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number | null;
  isReimbursed: boolean;
  referralFeePercent: number;
  fulfillmentFee: number;
}

export interface PayoutResult {
  buyerPaidAmount: number;
  platformReimbursement: number;
  platformFeesDeducted: number;
  finalSellerPayout: number;
}

export function calculateOrderPayout(input: PayoutInput): PayoutResult {
  const { listPrice, discountType, discountValue, maxDiscount, isReimbursed, referralFeePercent, fulfillmentFee } = input;

  let discountAmount: number;
  if (discountType === "percentage") {
    discountAmount = listPrice * (discountValue / 100);
    if (maxDiscount !== null && maxDiscount !== undefined) {
      discountAmount = Math.min(discountAmount, maxDiscount);
    }
  } else {
    discountAmount = discountValue;
  }
  discountAmount = Math.min(discountAmount, listPrice);

  const buyerPrice = listPrice - discountAmount;

  let platformFees: number;
  let platformReimbursement: number;
  let finalSellerPayout: number;

  if (isReimbursed) {
    platformFees = (listPrice * referralFeePercent) + fulfillmentFee;
    platformReimbursement = discountAmount;
    finalSellerPayout = listPrice - platformFees;
  } else {
    platformFees = (buyerPrice * referralFeePercent) + fulfillmentFee;
    platformReimbursement = 0;
    finalSellerPayout = buyerPrice - platformFees;
  }

  finalSellerPayout = Math.max(0, finalSellerPayout);

  return {
    buyerPaidAmount: Math.round(buyerPrice * 100) / 100,
    platformReimbursement: Math.round(platformReimbursement * 100) / 100,
    platformFeesDeducted: Math.round(platformFees * 100) / 100,
    finalSellerPayout: Math.round(finalSellerPayout * 100) / 100,
  };
}
