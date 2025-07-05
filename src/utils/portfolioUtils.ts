import type { AssetBalanceDto } from "../dto/PortfolioDto";

// Interface for portfolio calculations that extends the DTO with computed properties
export interface AssetBalance extends AssetBalanceDto {
  totalValue: number;
  unrealizedPnLPercentage: number;
}

/**
 * Calculate portfolio totals with memoization support
 */
export function calculateTotals(balances: AssetBalance[]): {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercentage: number;
} {
  if (!balances || balances.length === 0) {
    return {
      totalValue: 0,
      totalCost: 0,
      totalPnL: 0,
      totalPnLPercentage: 0,
    };
  }

  const totalValue = balances.reduce((sum, balance) => {
    return sum + (balance.totalValue || 0);
  }, 0);

  const totalCost = balances.reduce((sum, balance) => {
    return sum + balance.total * (balance.averageCost || 0);
  }, 0);

  const totalPnL = totalValue - totalCost;
  const totalPnLPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  return {
    totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
    totalCost: Math.round(totalCost * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    totalPnLPercentage: Math.round(totalPnLPercentage * 100) / 100,
  };
}

/**
 * Calculate allocation percentages for pie chart
 */
export function calculateAllocation(balances: AssetBalance[]): Array<{
  asset: string;
  value: number;
  percentage: number;
  color?: string;
}> {
  if (!balances || balances.length === 0) {
    return [];
  }

  const totalValue = balances.reduce(
    (sum, balance) => sum + balance.totalValue,
    0,
  );

  if (totalValue === 0) {
    return [];
  }

  // Predefined colors for common assets
  const assetColors: Record<string, string> = {
    XLM: "#00D4FF",
    USDC: "#2775CA",
    BTC: "#F7931A",
    ETH: "#627EEA",
    ADA: "#0033AD",
    DOT: "#E6007A",
  };

  return balances
    .filter((balance) => balance.totalValue > 0)
    .map((balance, index) => ({
      asset: balance.asset,
      value: Math.round(balance.totalValue * 100) / 100,
      percentage: Math.round((balance.totalValue / totalValue) * 10000) / 100, // Round to 2 decimal places
      color:
        assetColors[balance.asset] || `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending
}

/**
 * Format currency values for display
 */
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage values for display
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format asset amounts for display
 */
export function formatAssetAmount(amount: number, asset: string): string {
  // Different precision for different assets
  const precision: Record<string, number> = {
    BTC: 8,
    ETH: 6,
    XLM: 4,
    USDC: 2,
  };

  const decimals = precision[asset] || 4;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Check if portfolio is empty (no holdings)
 */
export function isPortfolioEmpty(balances: AssetBalance[]): boolean {
  return (
    !balances ||
    balances.length === 0 ||
    balances.every((balance) => balance.total === 0)
  );
}

/**
 * Get portfolio performance metrics
 */
export function getPerformanceMetrics(balances: AssetBalance[]): {
  bestPerformer: AssetBalance | null;
  worstPerformer: AssetBalance | null;
  totalAssets: number;
  profitableAssets: number;
} {
  if (!balances || balances.length === 0) {
    return {
      bestPerformer: null,
      worstPerformer: null,
      totalAssets: 0,
      profitableAssets: 0,
    };
  }

  const assetsWithHoldings = balances.filter((balance) => balance.total > 0);

  let bestPerformer: AssetBalance | null = null;
  let worstPerformer: AssetBalance | null = null;
  let profitableAssets = 0;

  for (const balance of assetsWithHoldings) {
    if ((balance.unrealizedPnL || 0) > 0) {
      profitableAssets++;
    }

    if (
      !bestPerformer ||
      balance.unrealizedPnLPercentage > bestPerformer.unrealizedPnLPercentage
    ) {
      bestPerformer = balance;
    }

    if (
      !worstPerformer ||
      balance.unrealizedPnLPercentage < worstPerformer.unrealizedPnLPercentage
    ) {
      worstPerformer = balance;
    }
  }

  return {
    bestPerformer,
    worstPerformer,
    totalAssets: assetsWithHoldings.length,
    profitableAssets,
  };
}
