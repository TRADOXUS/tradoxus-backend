import {
  calculateTotals,
  calculateAllocation,
  formatCurrency,
  formatPercentage,
  formatAssetAmount,
  isPortfolioEmpty,
  getPerformanceMetrics,
} from "../../utils/portfolioUtils"
import type { AssetBalance } from "../../dto/PortfolioDto"

describe("Portfolio Utils", () => {
  const mockBalances: AssetBalance[] = [
    {
      asset: "XLM",
      available: 1000,
      locked: 0,
      total: 1000,
      averageCost: 0.1,
      currentPrice: 0.12,
      totalValue: 120,
      unrealizedPnL: 20,
      unrealizedPnLPercentage: 20,
    },
    {
      asset: "USDC",
      available: 500,
      locked: 0,
      total: 500,
      averageCost: 1.0,
      currentPrice: 1.0,
      totalValue: 500,
      unrealizedPnL: 0,
      unrealizedPnLPercentage: 0,
    },
    {
      asset: "BTC",
      available: 0.01,
      locked: 0,
      total: 0.01,
      averageCost: 50000,
      currentPrice: 45000,
      totalValue: 450,
      unrealizedPnL: -50,
      unrealizedPnLPercentage: -10,
    },
  ]

  describe("calculateTotals", () => {
    it("should calculate correct totals for valid balances", () => {
      const result = calculateTotals(mockBalances)

      expect(result.totalValue).toBe(1070)
      expect(result.totalCost).toBe(1100)
      expect(result.totalPnL).toBe(-30)
      expect(result.totalPnLPercentage).toBe(-2.73)
    })

    it("should return zeros for empty balances", () => {
      const result = calculateTotals([])

      expect(result.totalValue).toBe(0)
      expect(result.totalCost).toBe(0)
      expect(result.totalPnL).toBe(0)
      expect(result.totalPnLPercentage).toBe(0)
    })

    it("should handle null/undefined balances", () => {
      const result = calculateTotals(null as any)

      expect(result.totalValue).toBe(0)
      expect(result.totalCost).toBe(0)
      expect(result.totalPnL).toBe(0)
      expect(result.totalPnLPercentage).toBe(0)
    })

    it("should handle balances with missing totalValue", () => {
      const balancesWithMissingValue = [{ ...mockBalances[0], totalValue: undefined as any }, mockBalances[1]]

      const result = calculateTotals(balancesWithMissingValue)
      expect(result.totalValue).toBe(500) // Only USDC value
    })
  })

  describe("calculateAllocation", () => {
    it("should calculate correct allocation percentages", () => {
      const result = calculateAllocation(mockBalances)

      expect(result).toHaveLength(3)
      expect(result[0].asset).toBe("USDC") // Highest value first
      expect(result[0].percentage).toBe(46.73)
      expect(result[1].asset).toBe("BTC")
      expect(result[1].percentage).toBe(42.06)
      expect(result[2].asset).toBe("XLM")
      expect(result[2].percentage).toBe(11.21)
    })

    it("should return empty array for empty balances", () => {
      const result = calculateAllocation([])
      expect(result).toEqual([])
    })

    it("should filter out zero-value balances", () => {
      const balancesWithZero = [
        ...mockBalances,
        {
          asset: "ETH",
          available: 0,
          locked: 0,
          total: 0,
          averageCost: 3000,
          currentPrice: 3000,
          totalValue: 0,
          unrealizedPnL: 0,
          unrealizedPnLPercentage: 0,
        },
      ]

      const result = calculateAllocation(balancesWithZero)
      expect(result).toHaveLength(3) // Should not include ETH
    })

    it("should assign colors to assets", () => {
      const result = calculateAllocation(mockBalances)

      expect(result[0].color).toBeDefined()
      expect(result[1].color).toBeDefined()
      expect(result[2].color).toBeDefined()
    })
  })

  describe("formatCurrency", () => {
    it("should format USD currency correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56")
      expect(formatCurrency(0)).toBe("$0.00")
      expect(formatCurrency(-123.45)).toBe("-$123.45")
    })

    it("should handle different currencies", () => {
      expect(formatCurrency(1234.56, "EUR")).toBe("€1,234.56")
    })
  })

  describe("formatPercentage", () => {
    it("should format positive percentages with + sign", () => {
      expect(formatPercentage(12.345)).toBe("+12.35%")
    })

    it("should format negative percentages", () => {
      expect(formatPercentage(-12.345)).toBe("-12.35%")
    })

    it("should format zero percentage", () => {
      expect(formatPercentage(0)).toBe("+0.00%")
    })
  })

  describe("formatAssetAmount", () => {
    it("should format BTC with 8 decimals", () => {
      expect(formatAssetAmount(0.12345678, "BTC")).toBe("0.12345678")
    })

    it("should format XLM with 4 decimals", () => {
      expect(formatAssetAmount(1234.123456, "XLM")).toBe("1,234.1235")
    })

    it("should format USDC with 2 decimals", () => {
      expect(formatAssetAmount(1234.123456, "USDC")).toBe("1,234.12")
    })

    it("should use default 4 decimals for unknown assets", () => {
      expect(formatAssetAmount(1234.123456, "UNKNOWN")).toBe("1,234.1235")
    })
  })

  describe("isPortfolioEmpty", () => {
    it("should return false for portfolio with holdings", () => {
      expect(isPortfolioEmpty(mockBalances)).toBe(false)
    })

    it("should return true for empty array", () => {
      expect(isPortfolioEmpty([])).toBe(true)
    })

    it("should return true for null/undefined", () => {
      expect(isPortfolioEmpty(null as any)).toBe(true)
      expect(isPortfolioEmpty(undefined as any)).toBe(true)
    })

    it("should return true for balances with zero totals", () => {
      const zeroBalances = mockBalances.map((b) => ({ ...b, total: 0 }))
      expect(isPortfolioEmpty(zeroBalances)).toBe(true)
    })
  })

  describe("getPerformanceMetrics", () => {
    it("should identify best and worst performers", () => {
      const result = getPerformanceMetrics(mockBalances)

      expect(result.bestPerformer?.asset).toBe("XLM")
      expect(result.worstPerformer?.asset).toBe("BTC")
      expect(result.totalAssets).toBe(3)
      expect(result.profitableAssets).toBe(1)
    })

    it("should handle empty balances", () => {
      const result = getPerformanceMetrics([])

      expect(result.bestPerformer).toBeNull()
      expect(result.worstPerformer).toBeNull()
      expect(result.totalAssets).toBe(0)
      expect(result.profitableAssets).toBe(0)
    })

    it("should filter out zero holdings", () => {
      const balancesWithZero = [
        ...mockBalances,
        {
          asset: "ETH",
          available: 0,
          locked: 0,
          total: 0,
          averageCost: 3000,
          currentPrice: 3000,
          totalValue: 0,
          unrealizedPnL: 0,
          unrealizedPnLPercentage: 0,
        },
      ]

      const result = getPerformanceMetrics(balancesWithZero)
      expect(result.totalAssets).toBe(3) // Should not count ETH
    })
  })
})
