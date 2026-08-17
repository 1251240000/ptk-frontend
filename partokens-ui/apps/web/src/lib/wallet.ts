export function isConfiguredTopupAmount(options: number[], amount: number): boolean {
  return Number.isFinite(amount) && options.some((option) => option === amount)
}

export function starterPlanId<T extends { id: number; price_amount: number }>(plans: T[], hasActiveSubscription: boolean): number | null {
  if (hasActiveSubscription || plans.length === 0) return null
  return plans.reduce((cheapest, plan) => plan.price_amount < cheapest.price_amount ? plan : cheapest).id
}
