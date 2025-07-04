import { Repository } from "typeorm";
import { PortfolioService } from "../../services/PortfolioService";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "../../entities/Transaction";
import { Balance } from "../../entities/Balance";
import { User } from "../../entities/User";
import { CreateTransactionDto } from "../../dto/PortfolioDto";
import { AppError } from "../../utils/AppError";
import type { Mocked } from "jest-mock";

// Mock Redis
jest.mock("../../config/redis", () => ({
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  },
}));

describe("PortfolioService", () => {
  let mockTransactionRepo: Mocked<Repository<Transaction>>;
  let mockBalanceRepo: Mocked<Repository<Balance>>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let portfolioService: PortfolioService;

  const mockUser: User = {
    id: "user-1",
    email: "test@example.com",
    walletAddress: "wallet-address",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockTransaction: Transaction = {
    id: "tx-1",
    userId: "user-1",
    asset: "XLM",
    type: TransactionType.BUY,
    amount: "1000",
    price: "0.12",
    fee: "1.2",
    status: TransactionStatus.COMPLETED,
    txHash: "hash-123",
    metadata: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    get totalValue() {
      return 120;
    },
    get netAmount() {
      return 998.8;
    },
  };

  const mockBalance: Balance = {
    id: "balance-1",
    userId: "user-1",
    asset: "XLM",
    available: "1000",
    locked: "0",
    averageCost: "0.12",
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    get total() {
      return 1000;
    },
    get totalValue() {
      return 120;
    },
  };

  beforeEach(() => {
    mockTransactionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    mockBalanceRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockUserRepo = {
      findOne: jest.fn(),
    } as any;

    portfolioService = new PortfolioService(
      mockTransactionRepo,
      mockBalanceRepo,
      mockUserRepo,
    );
  });

  describe("createTransaction", () => {
    const createTransactionDto: CreateTransactionDto = {
      asset: "XLM",
      type: TransactionType.BUY,
      amount: 1000,
      price: 0.12,
      fee: 1.2,
    };

    it("should create a transaction successfully", async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockTransactionRepo.create.mockReturnValue(mockTransaction);
      mockTransactionRepo.save.mockResolvedValue(mockTransaction);

      const result = await portfolioService.createTransaction(
        "user-1",
        createTransactionDto,
      );

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
      expect(mockTransactionRepo.create).toHaveBeenCalledWith({
        userId: "user-1",
        asset: "XLM",
        type: TransactionType.BUY,
        amount: "1000",
        price: "0.12",
        fee: "1.2",
        metadata: null,
      });
      expect(mockTransactionRepo.save).toHaveBeenCalledWith(mockTransaction);
      expect(result).toEqual(mockTransaction);
    });

    it("should throw error if user not found", async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        portfolioService.createTransaction("user-1", createTransactionDto),
      ).rejects.toThrow(new AppError("User not found", 404));
    });

    it("should update balance if transaction is completed", async () => {
      const completedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
        get totalValue() {
          return mockTransaction.totalValue;
        },
        get netAmount() {
          return mockTransaction.netAmount;
        },
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockTransactionRepo.create.mockReturnValue(completedTransaction);
      mockTransactionRepo.save.mockResolvedValue(completedTransaction);
      mockBalanceRepo.findOne.mockResolvedValue(null);
      mockBalanceRepo.create.mockReturnValue(mockBalance);
      mockBalanceRepo.save.mockResolvedValue(mockBalance);

      await portfolioService.createTransaction("user-1", createTransactionDto);

      expect(mockBalanceRepo.findOne).toHaveBeenCalledWith({
        where: { userId: "user-1", asset: "XLM" },
      });
      expect(mockBalanceRepo.save).toHaveBeenCalled();
    });
  });

  describe("getUserBalances", () => {
    it("should return user balances", async () => {
      mockBalanceRepo.find.mockResolvedValue([mockBalance]);

      const result = await portfolioService.getUserBalances("user-1");

      expect(mockBalanceRepo.find).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        order: { asset: "ASC" },
      });
      expect(result).toEqual([mockBalance]);
    });
  });

  describe("getRecentTransactions", () => {
    it("should return recent transactions", async () => {
      mockTransactionRepo.find.mockResolvedValue([mockTransaction]);

      const result = await portfolioService.getRecentTransactions("user-1", 10);

      expect(mockTransactionRepo.find).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        order: { createdAt: "DESC" },
        take: 10,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "tx-1",
        asset: "XLM",
        type: TransactionType.BUY,
        amount: 1000,
        price: 0.12,
        status: TransactionStatus.COMPLETED,
      });
    });
  });

  describe("calculateTotals", () => {
    it("should calculate totals correctly", async () => {
      const balances = [
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
      ];

      const result = await portfolioService.calculateTotals(balances);

      expect(result.totalValue).toBe(620);
      expect(result.totalPnL).toBe(20);
      expect(result.totalPnLPercentage).toBeCloseTo(3.33, 2);
    });

    it("should handle empty balances", async () => {
      const result = await portfolioService.calculateTotals([]);

      expect(result.totalValue).toBe(0);
      expect(result.totalPnL).toBe(0);
      expect(result.totalPnLPercentage).toBe(0);
    });
  });
});
