import { Request, Response } from "express";
import { validate } from "class-validator";
import { StrategyService } from "../services/StrategyService";
import { CreateStrategyDto, UpdateStrategyDto } from "../dto/StrategyDto";
import { AppError } from "../utils/AppError";

const strategyService = new StrategyService();

export class StrategyController {
  async create(req: Request, res: Response) {
    const dto = new CreateStrategyDto();
    Object.assign(dto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new AppError("Validation failed", 400, errors);
    }
    const userId = req.user.id;
    const strategy = await strategyService.createStrategy(dto, userId);
    res.status(201).json(strategy);
  }

  async list(req: Request, res: Response) {
    const userId = req.user.id;
    const strategies = await strategyService.getStrategies(userId);
    res.json(strategies);
  }

  async getById(req: Request, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;
    const strategy = await strategyService.getStrategyById(id, userId);
    if (!strategy) throw new AppError("Strategy not found", 404);
    res.json(strategy);
  }

  async update(req: Request, res: Response) {
    const dto = new UpdateStrategyDto();
    Object.assign(dto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new AppError("Validation failed", 400, errors);
    }
    const userId = req.user.id;
    const { id } = req.params;
    const updated = await strategyService.updateStrategy(id, dto, userId);
    if (!updated) throw new AppError("Strategy not found", 404);
    res.json(updated);
  }

  async delete(req: Request, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;
    const ok = await strategyService.deleteStrategy(id, userId);
    if (!ok) throw new AppError("Strategy not found", 404);
    res.status(204).send();
  }

  async getIndicators(req: Request, res: Response) {
    const indicators = strategyService.getIndicators();
    res.json(indicators);
  }
}
