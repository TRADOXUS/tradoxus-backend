import { ReferralService } from "../../services/ReferralService";
import { ReferralStatus } from "../../entities/Referral";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

// Mock the database connection and repositories
jest.mock("../../config/database", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("ReferralService", () => {
  let referralService: ReferralService;
  let mockReferralCodeRepo: any;
  let mockReferralRepo: any;
  let mockUserRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReferralCodeRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    mockReferralRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity.name === "ReferralCode") return mockReferralCodeRepo;
      if (entity.name === "Referral") return mockReferralRepo;
      if (entity.name === "User") return mockUserRepo;
      return {};
    });

    referralService = new ReferralService();
  });

  describe("generateCode", () => {
    it("should return existing active code if user already has one", async () => {
      const existingCode = {
        id: "1",
        code: "TESTCODE",
        userId: "user1",
        isActive: true,
      };

      mockReferralCodeRepo.findOne.mockResolvedValue(existingCode);

      const result = await referralService.generateCode("user1");

      expect(result).toEqual(existingCode);
      expect(mockReferralCodeRepo.findOne).toHaveBeenCalledWith({
        where: { userId: "user1", isActive: true },
      });
    });

    it("should generate new code if user doesn't have active code", async () => {
      const newCode = {
        id: "2",
        code: "NEWCODE1",
        userId: "user1",
        isActive: true,
      };

      mockReferralCodeRepo.findOne
        .mockResolvedValueOnce(null) // No existing code
        .mockResolvedValueOnce(null); // Code is unique
      mockReferralCodeRepo.create.mockReturnValue(newCode);
      mockReferralCodeRepo.save.mockResolvedValue(newCode);

      const result = await referralService.generateCode("user1");

      expect(result).toEqual(newCode);
      expect(mockReferralCodeRepo.save).toHaveBeenCalled();
    });
  });

  describe("applyReferralCode", () => {
    it("should successfully apply valid referral code", async () => {
      const referralCode = {
        id: "1",
        code: "TESTCODE",
        userId: "referrer1",
        isActive: true,
        usageCount: 0,
        maxUsage: 100,
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
      };

      const newReferral = {
        id: "ref1",
        referrerId: "referrer1",
        referredUserId: "user2",
        referralCodeUsed: "TESTCODE",
        status: ReferralStatus.PENDING,
      };

      mockReferralCodeRepo.findOne.mockResolvedValue(referralCode);
      mockReferralRepo.findOne.mockResolvedValue(null); // No existing referral
      mockReferralRepo.create.mockReturnValue(newReferral);
      mockReferralRepo.save.mockResolvedValue(newReferral);
      mockReferralCodeRepo.update.mockResolvedValue({ affected: 1 });

      const result = await referralService.applyReferralCode(
        "user2",
        "TESTCODE",
      );

      expect(result).toEqual(newReferral);
      expect(mockReferralRepo.save).toHaveBeenCalled();
      expect(mockReferralCodeRepo.update).toHaveBeenCalledWith("1", {
        usageCount: 1,
      });
    });

    it("should throw error for invalid referral code", async () => {
      mockReferralCodeRepo.findOne.mockResolvedValue(null);

      await expect(
        referralService.applyReferralCode("user2", "INVALID"),
      ).rejects.toThrow(AppError);
    });

    it("should throw error for self-referral", async () => {
      const referralCode = {
        id: "1",
        code: "TESTCODE",
        userId: "user1",
        isActive: true,
        usageCount: 0,
        maxUsage: 100,
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockReferralCodeRepo.findOne.mockResolvedValue(referralCode);

      await expect(
        referralService.applyReferralCode("user1", "TESTCODE"),
      ).rejects.toThrow(AppError);
    });

    it("should throw error for expired referral code", async () => {
      const referralCode = {
        id: "1",
        code: "TESTCODE",
        userId: "referrer1",
        isActive: true,
        usageCount: 0,
        maxUsage: 100,
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
      };

      mockReferralCodeRepo.findOne.mockResolvedValue(referralCode);

      await expect(
        referralService.applyReferralCode("user2", "TESTCODE"),
      ).rejects.toThrow(AppError);
    });
  });

  describe("completeReferral", () => {
    it("should complete pending referral", async () => {
      const pendingReferral = {
        id: "ref1",
        status: ReferralStatus.PENDING,
        rewardEarnedReferrer: { value: 100 },
        rewardEarnedReferred: { value: 50 },
        metadata: {},
      };

      const completedReferral = {
        ...pendingReferral,
        status: ReferralStatus.COMPLETED,
        completedAt: expect.any(Date),
      };

      mockReferralRepo.findOne.mockResolvedValue(pendingReferral);
      mockReferralRepo.save.mockResolvedValue(completedReferral);

      const result = await referralService.completeReferral("ref1");

      expect(result.status).toBe(ReferralStatus.COMPLETED);
      expect(mockReferralRepo.save).toHaveBeenCalled();
    });

    it("should throw error for non-pending referral", async () => {
      const completedReferral = {
        id: "ref1",
        status: ReferralStatus.COMPLETED,
      };

      mockReferralRepo.findOne.mockResolvedValue(completedReferral);

      await expect(referralService.completeReferral("ref1")).rejects.toThrow(
        AppError,
      );
    });
  });
});
