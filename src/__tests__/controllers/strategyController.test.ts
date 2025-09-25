import request from "supertest";
import express from "express";
import { StrategyController } from "../../controllers/StrategyController";
import strategyRoutes from "../../routes/strategyRoutes";
import { errorHandler } from "../../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { id: "test-user-id" };
  next();
});
app.use("/strategies", strategyRoutes);
app.use(errorHandler);

describe("StrategyController", () => {
  it("GET /strategies/indicators should return indicators", async () => {
    const res = await request(app).get("/strategies/indicators");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((i: any) => i.name === "RSI")).toBe(true);
  });

  // Add more tests for create, list, getById, update, delete endpoints
});
