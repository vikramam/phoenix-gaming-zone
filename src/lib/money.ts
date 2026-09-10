export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100)
}

export function paiseToRupees(paise: number) {
  return paise / 100
}

export function formatMoney(paise: number, symbol = '₹') {
  const rupees = paise / 100
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees)
  return `${symbol}${formatted}`
}
