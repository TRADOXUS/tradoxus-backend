// src/services/EconomicCalendarService.ts
import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { EconomicEvent } from "../entities/EconomicEvent";
import { UserEventAlert } from "../entities/EconomicEvent";
import { EventImpactAnalysis } from "../entities/EconomicEvent";
import { User } from "../entities/User";
import {
  CalendarQueryDto,
  CreateAlertDto,
} from "../dto/EconomicCalendarDto";


export class EconomicCalendarService {
  protected economicEventRepository: Repository<EconomicEvent>;
  protected userEventAlertRepository: Repository<UserEventAlert>;
  protected eventImpactAnalysisRepository: Repository<EventImpactAnalysis>;

  constructor() {
    this.economicEventRepository = AppDataSource.getRepository(EconomicEvent);
    this.userEventAlertRepository = AppDataSource.getRepository(UserEventAlert);
    this.eventImpactAnalysisRepository = AppDataSource.getRepository(EventImpactAnalysis);
  }

  protected createError(message: string, statusCode: number): never{
    const error = new Error(message) as Error & { statusCode: number };
    error.statusCode = statusCode;
    throw error;
  }

  async getFilteredEvents(query: CalendarQueryDto): Promise<EconomicEvent[]> {
    const { startDate, endDate, countries, importance, currencies, limit = 10, offset = 0 } = query;
    
    const queryBuilder = this.economicEventRepository.createQueryBuilder("event");

    if (startDate) {
      queryBuilder.andWhere("event.date >= :startDate", { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere("event.date <= :endDate", { endDate });
    }

    if (countries && countries.length > 0) {
      queryBuilder.andWhere("event.country IN (:...countries)", { countries });
    }
    if (importance && importance.length > 0) {
      queryBuilder.andWhere("event.importanceLevel IN (:...importance)", { importance });
    }
    if (currencies && currencies.length > 0) {
      queryBuilder.andWhere("event.currencyAffected IN (:...currencies)", { currencies });
    }

    queryBuilder.skip(offset).take(limit);

    queryBuilder.orderBy("event.date", "ASC").addOrderBy("event.time", "ASC");

    return queryBuilder.getMany();
  }

  async getUpcomingEvents(hours: number = 24): Promise<EconomicEvent[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return this.economicEventRepository.createQueryBuilder("event")
      .where("CAST(event.date AS TEXT) || ' ' || CAST(event.time AS TEXT) >= :nowDateTime", { nowDateTime: now.toISOString().slice(0, 19).replace('T', ' ') }) // Format to 'YYYY-MM-DD HH:MM:SS'
      .andWhere("CAST(event.date AS TEXT) || ' ' || CAST(event.time AS TEXT) <= :futureDateTime", { futureDateTime: futureTime.toISOString().slice(0, 19).replace('T', ' ') })
      .orderBy("event.date", "ASC")
      .addOrderBy("event.time", "ASC")
      .getMany();
  }

  async getTodayEvents(): Promise<EconomicEvent[]> {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    return this.economicEventRepository.find({
      where: {
        date: todayDateString as never, 
      },
      order: {
        time: "ASC", 
      },
    });
  }
  
  async createAlert(data: CreateAlertDto): Promise<UserEventAlert> {

    const eventExists = await this.economicEventRepository.findOneBy({ eventId: data.eventId });
    if (!eventExists) {
      this.createError("Economic event not found.", 404);
    }

    const userRepo = AppDataSource.getRepository(User);
    const userExists = await userRepo.findOneBy({ id: data.userId });
    if (!userExists) {
         this.createError("User not found.", 404);
    }

    const existingAlert = await this.userEventAlertRepository.findOneBy({
      userId: data.userId,
      eventId: data.eventId,
    });
    if (existingAlert) {
      this.createError("Alert for this event and user already exists.", 409); 
    }

    const newAlert = this.userEventAlertRepository.create(data);
    return this.userEventAlertRepository.save(newAlert);
  }


  async getUserAlerts(userId: string, isActive?: boolean): Promise<UserEventAlert[]> {
    const queryBuilder = this.userEventAlertRepository.createQueryBuilder("alert");

    queryBuilder.where("alert.userId = :userId", { userId });

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere("alert.isActive = :isActive", { isActive });
    }

    queryBuilder.orderBy("alert.createdAt", "DESC");

    return queryBuilder.getMany();
  }

  async deleteAlert(alertId: string): Promise<boolean> {
    const result = await this.userEventAlertRepository.softDelete(alertId);
    return result.affected ? true : false;
  }

 
  async getImpactAnalysis(eventId: string): Promise<EventImpactAnalysis[]> {
    return this.eventImpactAnalysisRepository.find({
      where: { eventId },
      order: { createdAt: "DESC" }, 
    });
  }

  async createImpactAnalysis(data: EventImpactAnalysis): Promise<EventImpactAnalysis> {
    const eventExists = await this.economicEventRepository.findOneBy({ eventId: data.eventId });
    if (!eventExists) {
      this.createError("Economic event not found.", 404);
    }

    const analysis = this.eventImpactAnalysisRepository.create(data);
    return this.eventImpactAnalysisRepository.save(analysis);
  }

  async getEventById(id: string): Promise<EconomicEvent | null> {
    return this.economicEventRepository.findOneBy({ eventId: id });
  }

  async analyzeEconomicEventImpact(eventId: string): Promise<EventImpactAnalysis> {
   const event = await this.economicEventRepository.findOneBy({ eventId });

    if (!event) {
      this.createError("Economic event not found for analysis.", 404);
    }

    let expectedImpactDirection: 'Bullish' | 'Bearish' | 'Neutral' | 'Mixed' = 'Neutral';
    let confidenceLevel: number = 5; 
    let analysisNotes: string = `Automated analysis for event ${event.eventName}.`;

    if (event.actualValue && event.forecastValue) {
      const actualNum = parseFloat(event.actualValue);
      const forecastNum = parseFloat(event.forecastValue);

      if (!isNaN(actualNum) && !isNaN(forecastNum)) {
        if (actualNum > forecastNum) {
          expectedImpactDirection = event.importanceLevel === 'High' ? 'Bullish' : 'Neutral';
          confidenceLevel = event.importanceLevel === 'High' ? 8 : 5;
          analysisNotes += ` Actual (${actualNum}) was better than forecast (${forecastNum}).`;
        } else if (actualNum < forecastNum) {
          expectedImpactDirection = event.importanceLevel === 'High' ? 'Bearish' : 'Neutral';
          confidenceLevel = event.importanceLevel === 'High' ? 8 : 5;
          analysisNotes += ` Actual (${actualNum}) was worse than forecast (${forecastNum}).`;
        } else {
          expectedImpactDirection = 'Neutral';
          analysisNotes += ` Actual (${actualNum}) matched forecast (${forecastNum}).`;
        }
      }
    } else {
      analysisNotes += ` Missing actual or forecast values for detailed analysis.`;
    }

    const assetClass = event.currencyAffected || 'General Market'; 

    const newAnalysis = this.eventImpactAnalysisRepository.create({
      eventId: event.eventId,
      assetClass: assetClass,
      expectedImpactDirection: expectedImpactDirection,
      confidenceLevel: confidenceLevel,
      analysisNotes: analysisNotes,
    });

    return this.eventImpactAnalysisRepository.save(newAnalysis);
  }
}