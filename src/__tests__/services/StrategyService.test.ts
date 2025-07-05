import { StrategyService } from "../../services/StrategyService";
import { AppDataSource } from "../../config/database";
import { CreateStrategyDto } from "../../dto/StrategyDto";

jest.mock("../../config/database", () => ({
  AppDataSource: {
    createQueryRunner: jest.fn(),
    getRepository: jest.fn(),
  },
}));

describe("StrategyService", () => {
  let service: StrategyService;

  beforeEach(() => {
    service = new StrategyService();
  });

  it("should return supported indicators", () => {
    const indicators = service.getIndicators();
    expect(Array.isArray(indicators)).toBe(true);
    expect(indicators.some(i => i.name === "RSI")).toBe(true);
  });

  // Add more tests for createStrategy, getStrategies, getStrategyById, updateStrategy, deleteStrategy
  // using mocks and sample data as needed.
}); 