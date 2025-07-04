import request from "supertest";
import { AppDataSource } from "../../config/database";
import app from "../../app";
import { User } from "../../entities/User";
import { ReferralCode } from "../../entities/ReferralCode";
import { Referral, ReferralStatus } from "../../entities/Referral";
import jwt from "jsonwebtoken";

describe("Referral System Integration Tests", () => {
  let userRepository: any;
  let referralCodeRepository: any;
  let referralRepository: any;
  
  let referrerUser: User;
  let referredUser: User;
  let referrerToken: string;
  let referredToken: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    userRepository = AppDataSource.getRepository(User);
    referralCodeRepository = AppDataSource.getRepository(ReferralCode);
    referralRepository = AppDataSource.getRepository(Referral);
  });

  beforeEach(async () => {
    // Clean up database
    await referralRepository.delete({});
    await referralCodeRepository.delete({});
    await userRepository.delete({});

    // Create test users
    referrerUser = userRepository.create({
      email: "referrer@test.com",
      nickname: "referrer",
      passwordHash: "hashedpassword",
      isActive: true,
    });
    await userRepository.save(referrerUser);

    referredUser = userRepository.create({
      email: "referred@test.com",
      nickname: "referred",
      passwordHash: "hashedpassword",
      isActive: true,
    });
    await userRepository.save(referredUser);

    // Generate JWT tokens for authentication
    referrerToken = jwt.sign(
      { userId: referrerUser.id },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );

    referredToken = jwt.sign(
      { userId: referredUser.id },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe("Complete Referral Flow", () => {
    it("should complete full referral journey successfully", async () => {
      // Step 1: Referrer generates referral code
      const generateResponse = await request(app)
        .post("/api/v1/referral/generate-code")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(200);

      expect(generateResponse.body.status).toBe("success");
      expect(generateResponse.body.data.code).toBeDefined();
      expect(generateResponse.body.data.code).toHaveLength(8);

      const referralCode = generateResponse.body.data.code;

      // Step 2: Verify referrer can get their code
      const getCodeResponse = await request(app)
        .get("/api/v1/referral/my-code")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(200);

      expect(getCodeResponse.body.data.code).toBe(referralCode);
      expect(getCodeResponse.body.data.shareUrl).toContain(referralCode);

      // Step 3: Referred user applies the referral code
      const applyResponse = await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: referralCode })
        .expect(200);

      expect(applyResponse.body.status).toBe("success");
      expect(applyResponse.body.data.referralId).toBeDefined();
      expect(applyResponse.body.data.reward).toBeDefined();

      const referralId = applyResponse.body.data.referralId;

      // Step 4: Check referral status for both users
      const referrerStatusResponse = await request(app)
        .get("/api/v1/referral/status")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(200);

      expect(referrerStatusResponse.body.data.referralsMade).toHaveLength(1);
      expect(referrerStatusResponse.body.data.referralsMade[0].status).toBe("PENDING");

      const referredStatusResponse = await request(app)
        .get("/api/v1/referral/status")
        .set("Authorization", `Bearer ${referredToken}`)
        .expect(200);

      expect(referredStatusResponse.body.data.referralReceived).toBeDefined();
      expect(referredStatusResponse.body.data.referralReceived.status).toBe("PENDING");

      // Step 5: Complete the referral (simulate profile completion)
      const completeResponse = await request(app)
        .post(`/api/v1/referral/complete/${referralId}`)
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ trigger: "profile_completed" })
        .expect(200);

      expect(completeResponse.body.data.status).toBe("COMPLETED");
      expect(completeResponse.body.data.completedAt).toBeDefined();

      // Step 6: Verify final status
      const finalReferrerStatus = await request(app)
        .get("/api/v1/referral/status")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(200);

      expect(finalReferrerStatus.body.data.referralsMade[0].status).toBe("COMPLETED");
      expect(finalReferrerStatus.body.data.totalRewardsEarned).toBeGreaterThan(0);
    });

    it("should prevent duplicate referral code usage", async () => {
      // Generate referral code
      const generateResponse = await request(app)
        .post("/api/v1/referral/generate-code")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(200);

      const referralCode = generateResponse.body.data.code;

      // First application should succeed
      await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: referralCode })
        .expect(200);

      // Second application should fail
      const secondApplyResponse = await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: referralCode })
        .expect(400);

      expect(secondApplyResponse.body.error.code).toBe("REFERRAL_ALREADY_USED");
    });

    it("should prevent self-referral", async () => {
      // Generate referral code
      const generateResponse = await request(app)
        .post("/api/v1/referral/generate-code")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(200);

      const referralCode = generateResponse.body.data.code;

      // Try to apply own referral code
      const applyResponse = await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referrerToken}`)
        .send({ code: referralCode })
        .expect(400);

      expect(applyResponse.body.error.code).toBe("REFERRAL_SELF_REFERRAL_FORBIDDEN");
    });

    it("should handle expired referral codes", async () => {
      // Create expired referral code directly in database
      const expiredCode = referralCodeRepository.create({
        code: "EXPIRED1",
        userId: referrerUser.id,
        isActive: true,
        usageCount: 0,
        maxUsage: 100,
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
      });
      await referralCodeRepository.save(expiredCode);

      // Try to apply expired code
      const applyResponse = await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: "EXPIRED1" })
        .expect(400);

      expect(applyResponse.body.error.code).toBe("REFERRAL_CODE_EXPIRED");
    });

    it("should handle usage limit reached", async () => {
      // Create referral code at usage limit
      const limitedCode = referralCodeRepository.create({
        code: "LIMITED1",
        userId: referrerUser.id,
        isActive: true,
        usageCount: 100,
        maxUsage: 100,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      });
      await referralCodeRepository.save(limitedCode);

      // Try to apply code at limit
      const applyResponse = await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: "LIMITED1" })
        .expect(400);

      expect(applyResponse.body.error.code).toBe("REFERRAL_USAGE_LIMIT_REACHED");
    });

    it("should enforce 1-minute age requirement for new codes", async () => {
      // Create very new referral code
      const newCode = referralCodeRepository.create({
        code: "TOOFRESH",
        userId: referrerUser.id,
        isActive: true,
        usageCount: 0,
        maxUsage: 100,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(), // Just created
      });
      await referralCodeRepository.save(newCode);

      // Try to apply immediately
      const applyResponse = await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: "TOOFRESH" })
        .expect(400);

      expect(applyResponse.body.error.code).toBe("REFERRAL_CODE_TOO_NEW");
    });
  });

  describe("Admin Endpoints", () => {
    let adminUser: User;
    let adminToken: string;

    beforeEach(async () => {
      // Create admin user
      adminUser = userRepository.create({
        email: "admin@test.com",
        nickname: "admin",
        passwordHash: "hashedpassword",
        isAdmin: true,
        isActive: true,
      });
      await userRepository.save(adminUser);

      adminToken = jwt.sign(
        { userId: adminUser.id },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "1h" }
      );
    });

    it("should allow admin to view all referrals", async () => {
      // Create some test data
      await request(app)
        .post("/api/v1/referral/generate-code")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(200);

      // Get admin view
      const adminResponse = await request(app)
        .get("/api/v1/referral/admin/all?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(adminResponse.body.status).toBe("success");
      expect(adminResponse.body.data).toHaveProperty("items");
      expect(adminResponse.body.data).toHaveProperty("total");
    });

    it("should allow admin to complete referrals manually", async () => {
      // Setup referral
      const generateResponse = await request(app)
        .post("/api/v1/referral/generate-code")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(200);

      const applyResponse = await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: generateResponse.body.data.code })
        .expect(200);

      const referralId = applyResponse.body.data.referralId;

      // Admin complete referral
      const completeResponse = await request(app)
        .post(`/api/v1/referral/admin/complete/${referralId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ notes: "Manually completed by admin" })
        .expect(200);

      expect(completeResponse.body.data.status).toBe("COMPLETED");
      expect(completeResponse.body.data.metadata.notes).toBe("Manually completed by admin");
    });

    it("should allow admin to view statistics", async () => {
      const statsResponse = await request(app)
        .get("/api/v1/referral/admin/statistics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(statsResponse.body.status).toBe("success");
      expect(statsResponse.body.data).toHaveProperty("totalReferrals");
      expect(statsResponse.body.data).toHaveProperty("completedReferrals");
      expect(statsResponse.body.data).toHaveProperty("conversionRate");
      expect(statsResponse.body.data).toHaveProperty("topReferrers");
    });

    it("should allow admin to deactivate referral codes", async () => {
      // Generate code
      const generateResponse = await request(app)
        .post("/api/v1/referral/generate-code")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(200);

      // Get the code ID from database
      const codeRecord = await referralCodeRepository.findOne({
        where: { code: generateResponse.body.data.code }
      });

      // Deactivate code
      const deactivateResponse = await request(app)
        .post(`/api/v1/referral/admin/deactivate-code/${codeRecord.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(deactivateResponse.body.data.isActive).toBe(false);

      // Verify code can't be used
      await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: generateResponse.body.data.code })
        .expect(400);
    });

    it("should prevent non-admin access to admin endpoints", async () => {
      await request(app)
        .get("/api/v1/referral/admin/all")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(403);

      await request(app)
        .get("/api/v1/referral/admin/statistics")
        .set("Authorization", `Bearer ${referrerToken}`)
        .expect(403);
    });
  });

  describe("Error Handling", () => {
    it("should require authentication for all endpoints", async () => {
      await request(app)
        .post("/api/v1/referral/generate-code")
        .expect(401);

      await request(app)
        .get("/api/v1/referral/my-code")
        .expect(401);

      await request(app)
        .post("/api/v1/referral/apply-code")
        .send({ code: "TESTCODE" })
        .expect(401);

      await request(app)
        .get("/api/v1/referral/status")
        .expect(401);
    });

    it("should validate input data", async () => {
      // Test with invalid code format
      const invalidCodeResponse = await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: "SHORT" })
        .expect(400);

      expect(invalidCodeResponse.body.error.code).toBe("VALIDATION_ERROR");

      // Test with missing code
      await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({})
        .expect(400);

      // Test with empty code
      await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: "" })
        .expect(400);
    });

    it("should handle non-existent referral codes", async () => {
      const response = await request(app)
        .post("/api/v1/referral/apply-code")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ code: "NOTEXIST" })
        .expect(400);

      expect(response.body.error.code).toBe("REFERRAL_CODE_INVALID");
    });

    it("should handle non-existent referrals for completion", async () => {
      const response = await request(app)
        .post("/api/v1/referral/complete/550e8400-e29b-41d4-a716-446655440000")
        .set("Authorization", `Bearer ${referredToken}`)
        .send({ trigger: "test" })
        .expect(404);

      expect(response.body.error.code).toBe("REFERRAL_NOT_FOUND");
    });
  });

  describe("Performance and Load", () => {
    it("should handle concurrent referral code generation", async () => {
      const promises = Array.from({ length: 10 }, () => 
        request(app)
          .post("/api/v1/referral/generate-code")
          .set("Authorization", `Bearer ${referrerToken}`)
      );

      const responses = await Promise.all(promises);
      
      // All should return the same code (existing code behavior)
      const codes = responses.map(r => r.body.data.code);
      expect(new Set(codes).size).toBe(1); // All should be the same code
    });

    it("should handle pagination for admin endpoints", async () => {
      // Create multiple referrals
      for (let i = 0; i < 15; i++) {
        const user = userRepository.create({
          email: `user${i}@test.com`,
          nickname: `user${i}`,
          passwordHash: "hashedpassword",
          isActive: true,
        });
        await userRepository.save(user);
      }

      const adminUser = userRepository.create({
        email: "admin@test.com",
        nickname: "admin",
        passwordHash: "hashedpassword",
        isAdmin: true,
        isActive: true,
      });
      await userRepository.save(adminUser);

      const adminToken = jwt.sign(
        { userId: adminUser.id },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "1h" }
      );

      // Test pagination
      const page1Response = await request(app)
        .get("/api/v1/referral/admin/all?page=1&limit=5")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(page1Response.body.data.items.length).toBeLessThanOrEqual(5);

      const page2Response = await request(app)
        .get("/api/v1/referral/admin/all?page=2&limit=5")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(page2Response.body.data.items.length).toBeLessThanOrEqual(5);
    });
  });
}); 