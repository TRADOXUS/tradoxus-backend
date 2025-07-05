import { AppDataSource } from "../config/database";
import { Strategy } from "../entities/Strategy";
import { StrategyRule, RuleType } from "../entities/StrategyRule";
import { StrategyCondition } from "../entities/StrategyCondition";
import { StrategyCheckpoint, CheckpointCategory } from "../entities/StrategyCheckpoint";
import { BaseService } from "./BaseService";
import { CreateStrategyDto, UpdateStrategyDto } from "../dto/StrategyDto";
import { AppError } from "../utils/AppError";

export class StrategyService extends BaseService<Strategy> {
  constructor() {
    super(Strategy);
  }

  async createStrategy(data: CreateStrategyDto, userId: string): Promise<Strategy> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const strategy = new Strategy();
      strategy.userId = userId;
      strategy.name = data.name;
      strategy.description = data.description;
      strategy.assetClass = data.assetClass;
      strategy.rules = [];
      strategy.checkpoints = [];

      // Rules and conditions
      for (const ruleDto of data.rules) {
        const rule = new StrategyRule();
        rule.ruleType = ruleDto.ruleType;
        rule.description = ruleDto.description;
        rule.conditions = [];
        for (const condDto of ruleDto.conditions) {
          const cond = new StrategyCondition();
          cond.indicator = condDto.indicator;
          cond.operator = condDto.operator;
          cond.value = condDto.value;
          cond.timeFrame = condDto.timeFrame;
          rule.conditions.push(cond);
        }
        strategy.rules.push(rule);
      }

      // Checkpoints
      for (const cpDto of data.checkpoints) {
        const cp = new StrategyCheckpoint();
        cp.text = cpDto.text;
        cp.order = cpDto.order;
        cp.category = cpDto.category;
        strategy.checkpoints.push(cp);
      }

      const saved = await queryRunner.manager.save(Strategy, strategy);
      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getStrategies(userId: string): Promise<Strategy[]> {
    return this.repository.find({
      where: { userId },
      relations: ["rules", "rules.conditions", "checkpoints"],
      order: { createdAt: "DESC" },
    });
  }

  async getStrategyById(id: string, userId: string): Promise<Strategy | null> {
    return this.repository.findOne({
      where: { id, userId },
      relations: ["rules", "rules.conditions", "checkpoints"],
    });
  }

  async updateStrategy(id: string, data: UpdateStrategyDto, userId: string): Promise<Strategy | null> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const strategy = await queryRunner.manager.findOne(Strategy, {
        where: { id, userId },
        relations: ["rules", "rules.conditions", "checkpoints"],
      });
      if (!strategy) throw new AppError("Strategy not found", 404);

      strategy.name = data.name;
      strategy.description = data.description;
      strategy.assetClass = data.assetClass;

      // Remove old rules and checkpoints
      await queryRunner.manager.delete(StrategyRule, { strategyId: id });
      await queryRunner.manager.delete(StrategyCheckpoint, { strategyId: id });

      // Add new rules
      strategy.rules = [];
      for (const ruleDto of data.rules) {
        const rule = new StrategyRule();
        rule.ruleType = ruleDto.ruleType;
        rule.description = ruleDto.description;
        rule.conditions = [];
        for (const condDto of ruleDto.conditions) {
          const cond = new StrategyCondition();
          cond.indicator = condDto.indicator;
          cond.operator = condDto.operator;
          cond.value = condDto.value;
          cond.timeFrame = condDto.timeFrame;
          rule.conditions.push(cond);
        }
        strategy.rules.push(rule);
      }

      // Add new checkpoints
      strategy.checkpoints = [];
      for (const cpDto of data.checkpoints) {
        const cp = new StrategyCheckpoint();
        cp.text = cpDto.text;
        cp.order = cpDto.order;
        cp.category = cpDto.category;
        strategy.checkpoints.push(cp);
      }

      const saved = await queryRunner.manager.save(Strategy, strategy);
      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteStrategy(id: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({ id, userId });
    return result.affected ? true : false;
  }

  getIndicators(): Array<{ name: string; params: string[] }> {
    // This can be DB-driven in the future
    return [
      { name: "SMA", params: ["period"] },
      { name: "EMA", params: ["period"] },
      { name: "RSI", params: ["period"] },
      { name: "MACD", params: ["fastPeriod", "slowPeriod", "signalPeriod"] },
      { name: "Volume", params: [] },
    ];
  }
} 