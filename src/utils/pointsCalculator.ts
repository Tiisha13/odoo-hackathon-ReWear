export class PointsCalculator {
  static readonly POINTS_FOR_UPLOAD = 10;
  static readonly POINTS_FOR_SWAP = 20;
  static readonly POINTS_FOR_REFERRAL = 30;

  static calculateUploadPoints(): number {
    return this.POINTS_FOR_UPLOAD;
  }

  static calculateSwapPoints(): number {
    return this.POINTS_FOR_SWAP;
  }

  static calculateReferralPoints(): number {
    return this.POINTS_FOR_REFERRAL;
  }

  static calculateItemRedemptionCost(condition: string): number {
    const baseCost = 50;
    const conditionMultipliers = {
      'new': 1.5,
      'like-new': 1.2,
      'good': 1.0,
      'fair': 0.8,
    };

    const multiplier = conditionMultipliers[condition as keyof typeof conditionMultipliers] || 1.0;
    return Math.floor(baseCost * multiplier);
  }
}
