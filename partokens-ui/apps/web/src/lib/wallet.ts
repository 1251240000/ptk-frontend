export function isConfiguredTopupAmount(options: number[], amount: number): boolean {
  return Number.isFinite(amount) && options.some((option) => option === amount)
}
