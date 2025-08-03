import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStrategyTables1680000000000 implements MigrationInterface {
  name = "CreateStrategyTables1680000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "strategies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "asset_class" varchar(50),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_strategies_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "idx_strategies_user_id" ON "strategies"("user_id");

      CREATE TABLE IF NOT EXISTS "strategy_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "strategy_id" uuid NOT NULL,
        "rule_type" varchar(32) NOT NULL CHECK ("rule_type" IN ('entry', 'exit', 'risk_management')),
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_strategy_rules_strategy" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "idx_strategy_rules_strategy_id" ON "strategy_rules"("strategy_id");

      CREATE TABLE IF NOT EXISTS "strategy_conditions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rule_id" uuid NOT NULL,
        "indicator" varchar(50) NOT NULL,
        "operator" varchar(20) NOT NULL,
        "value" varchar(50) NOT NULL,
        "time_frame" varchar(20),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_strategy_conditions_rule" FOREIGN KEY ("rule_id") REFERENCES "strategy_rules"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "idx_strategy_conditions_rule_id" ON "strategy_conditions"("rule_id");

      CREATE TABLE IF NOT EXISTS "strategy_checkpoints" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "strategy_id" uuid NOT NULL,
        "text" text NOT NULL,
        "order" int NOT NULL,
        "category" varchar(32) NOT NULL CHECK ("category" IN ('pre-trade', 'post-trade')),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_strategy_checkpoints_strategy" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "idx_strategy_checkpoints_strategy_id" ON "strategy_checkpoints"("strategy_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "strategy_checkpoints";
      DROP TABLE IF EXISTS "strategy_conditions";
      DROP TABLE IF EXISTS "strategy_rules";
      DROP TABLE IF EXISTS "strategies";
    `);
  }
}
