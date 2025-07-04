import Decimal from "decimal.js";

// Configure Decimal.js for financial precision
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
});

export interface NumericBalance {
  asset: string;
  available: number;
  locked: number;
  total: number;
  averageCost: number | null;
  unrealizedPnL: number | null;
  realizedPnL: number | null;
}

export interface NumericTransaction {
  type: string;
  asset: string;
  amount: number;
  price: number | null;
  fee: number | null;
  totalValue: number | null;
  createdAt: Date;
}

export interface AllocationItem {
  asset: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PortfolioTotals {
  totalValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  allocation: AllocationItem[];
}

export interface AssetPnL {
  currentValue: number;
  unrealizedPnL: number | null;
  realizedPnL: number | null;
  totalPnL: number | null;
}

export interface CostBasisResult {
  averageCost: number;
  realizedPnL: number;
  remainingQuantity: number;
}

export interface PerformanceMetrics {
  absoluteChange: number;
  percentageChange: number;
}

export function calculateTotals(
  balances: NumericBalance[],
  prices: Record<string, number>,
): PortfolioTotals {
  let totalValue = new Decimal(0);
  let totalPnL = new Decimal(0);
  const allocation: AllocationItem[] = [];

  for (const balance of balances) {
    if (balance.total <= 0) continue;

    const currentPrice = new Decimal(prices[balance.asset] || 0);
    const total = new Decimal(balance.total);
    const value = total.times(currentPrice);

    totalValue = totalValue.plus(value);

    // Calculate P&L
    const averageCost = new Decimal(balance.averageCost || 0);
    const costBasis = total.times(averageCost);
    const unrealizedPnL = value.minus(costBasis);
    const realizedPnL = new Decimal(balance.realizedPnL || 0);
    const assetPnL = unrealizedPnL.plus(realizedPnL);

    totalPnL = totalPnL.plus(assetPnL);

    allocation.push({
      asset: balance.asset,
      value: value.toNumber(),
      percentage: 0, // Will be calculated after total is known
      color: getAssetColor(balance.asset),
    });
  }

  // Calculate percentages
  allocation.forEach((item) => {
    item.percentage = totalValue.greaterThan(0)
      ? new Decimal(item.value).dividedBy(totalValue).times(100).toNumber()
      : 0;
  });

  const totalCostBasis = totalValue.minus(totalPnL);
  const totalPnLPercentage = totalCostBasis.greaterThan(0)
    ? totalPnL.dividedBy(totalCostBasis).times(100).toNumber()
    : 0;

  return {
    totalValue: totalValue.toNumber(),
    totalPnL: totalPnL.toNumber(),
    totalPnLPercentage,
    allocation: allocation.filter((item) => item.value > 0),
  };
}

export function calculateAssetPnL(
  balance: NumericBalance,
  currentPrice: number,
): AssetPnL {
  const total = new Decimal(balance.total);
  const price = new Decimal(currentPrice);
  const currentValue = total.times(price);

  let unrealizedPnL: number | null = null;
  let totalPnL: number | null = null;

  if (balance.averageCost !== null) {
    const averageCost = new Decimal(balance.averageCost);
    const costBasis = total.times(averageCost);
    unrealizedPnL = currentValue.minus(costBasis).toNumber();
  }

  const realizedPnL = balance.realizedPnL;

  if (unrealizedPnL !== null && realizedPnL !== null) {
    totalPnL = new Decimal(unrealizedPnL).plus(realizedPnL).toNumber();
  } else if (unrealizedPnL !== null) {
    totalPnL = unrealizedPnL;
  } else if (realizedPnL !== null) {
    totalPnL = realizedPnL;
  }

  return {
    currentValue: currentValue.toNumber(),
    unrealizedPnL,
    realizedPnL,
    totalPnL,
  };
}

export function calculateFIFOCostBasis(
  transactions: NumericTransaction[],
): CostBasisResult {
  const buyQueue: Array<{ quantity: Decimal; price: Decimal }> = [];
  let totalRealizedPnL = new Decimal(0);
  let remainingQuantity = new Decimal(0);
  let totalCost = new Decimal(0);

  for (const tx of transactions) {
    const amount = new Decimal(tx.amount);
    const price = new Decimal(tx.price || 0);

    if (
      tx.type === "BUY" ||
      tx.type === "DEPOSIT" ||
      tx.type === "TRANSFER_IN" ||
      tx.type === "REWARD"
    ) {
      if (price.greaterThan(0)) {
        buyQueue.push({ quantity: amount, price });
        totalCost = totalCost.plus(amount.times(price));
      }
      remainingQuantity = remainingQuantity.plus(amount);
    } else if (
      tx.type === "SELL" ||
      tx.type === "WITHDRAWAL" ||
      tx.type === "TRANSFER_OUT"
    ) {
      let sellAmount = amount;

      while (sellAmount.greaterThan(0) && buyQueue.length > 0) {
        const oldestBuy = buyQueue[0];
        const sellQuantity = Decimal.min(sellAmount, oldestBuy.quantity);

        if (price.greaterThan(0)) {
          const sellValue = sellQuantity.times(price);
          const costBasis = sellQuantity.times(oldestBuy.price);
          totalRealizedPnL = totalRealizedPnL.plus(sellValue.minus(costBasis));
        }

        oldestBuy.quantity = oldestBuy.quantity.minus(sellQuantity);
        sellAmount = sellAmount.minus(sellQuantity);
        totalCost = totalCost.minus(sellQuantity.times(oldestBuy.price));

        if (oldestBuy.quantity.equals(0)) {
          buyQueue.shift();
        }
      }

      remainingQuantity = remainingQuantity.minus(amount);
    } else if (tx.type === "FEE") {
      remainingQuantity = remainingQuantity.minus(amount);
    }
  }

  const averageCost = remainingQuantity.greaterThan(0)
    ? totalCost.dividedBy(remainingQuantity).toNumber()
    : 0;

  return {
    averageCost,
    realizedPnL: totalRealizedPnL.toNumber(),
    remainingQuantity: remainingQuantity.toNumber(),
  };
}

export function calculatePerformanceMetrics(
  currentValue: number,
  previousValue: number,
  period: string,
): PerformanceMetrics {
  const current = new Decimal(currentValue);
  const previous = new Decimal(previousValue);
  const absoluteChange = current.minus(previous);

  const percentageChange = previous.greaterThan(0)
    ? absoluteChange.dividedBy(previous).times(100)
    : new Decimal(0);

  return {
    absoluteChange: absoluteChange.toNumber(),
    percentageChange: percentageChange.toNumber(),
  };
}

export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate = 0.02,
): number {
  if (returns.length < 2) return 0;

  const returnsDecimal = returns.map((r) => new Decimal(r));
  const mean = returnsDecimal
    .reduce((sum, r) => sum.plus(r), new Decimal(0))
    .dividedBy(returns.length);

  const variance = returnsDecimal
    .reduce((sum, r) => sum.plus(r.minus(mean).pow(2)), new Decimal(0))
    .dividedBy(returns.length - 1);

  const stdDev = variance.sqrt();
  const riskFree = new Decimal(riskFreeRate).dividedBy(252); // Daily risk-free rate

  if (stdDev.equals(0)) return 0;

  const sharpe = mean.minus(riskFree).dividedBy(stdDev).times(Math.sqrt(252));
  return sharpe.toNumber();
}

export function calculateDiversificationScore(
  allocation: AllocationItem[],
): number {
  if (allocation.length <= 1) return 0;

  // Calculate Herfindahl-Hirschman Index (HHI)
  const hhi = allocation.reduce((sum, item) => {
    const weight = new Decimal(item.percentage).dividedBy(100);
    return sum.plus(weight.pow(2));
  }, new Decimal(0));

  // Convert to diversification score (0-100, where 100 is perfectly diversified)
  const maxHHI = new Decimal(1); // Completely concentrated
  const minHHI = new Decimal(1).dividedBy(allocation.length); // Perfectly diversified

  if (maxHHI.equals(minHHI)) return 100;

  const diversificationScore = new Decimal(1)
    .minus(hhi.minus(minHHI).dividedBy(maxHHI.minus(minHHI)))
    .times(100);

  return Math.max(0, Math.min(100, diversificationScore.toNumber()));
}

function getAssetColor(asset: string): string {
  const colors: Record<string, string> = {
    XLM: "#14b8a6",
    USDC: "#3b82f6",
    BTC: "#f59e0b",
    ETH: "#8b5cf6",
    ADA: "#06b6d4",
  };
  return colors[asset] || "#6b7280";
}
