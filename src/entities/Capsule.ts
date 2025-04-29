import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, DeleteDateColumn } from "typeorm";
import { Lesson } from "./Lesson";
import { IsNotEmpty, IsString, Length, IsNumber, Min, IsEnum, IsOptional, IsObject } from "class-validator";

export enum CapsuleType {
    VIDEO = 'video',
    TEXT = 'text',
    QUIZ = 'quiz',
    ASSIGNMENT = 'assignment'
}

export interface CapsuleContent {
    text?: string;
    videoUrl?: string;
    questions?: Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
    }>;
    assignment?: {
        description: string;
        deadline?: Date;
        maxPoints?: number;
    };
}

@Entity('capsules')
export class Capsule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 100 })
    @IsNotEmpty()
    @IsString()
    @Length(3, 100)
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 0 })
    @IsNumber()
    @Min(0)
    order: number = 0;

    @Column({
        type: 'enum',
        enum: CapsuleType,
        default: CapsuleType.TEXT
    })
    @IsEnum(CapsuleType)
    type: CapsuleType = CapsuleType.TEXT;

    @Column({ type: 'jsonb', nullable: true })
    @IsOptional()
    @IsObject()
    content?: CapsuleContent;

    @ManyToOne(() => Lesson, (lesson: Lesson) => lesson.capsules, {
        onDelete: 'CASCADE'
    })
    @IsNotEmpty()
    lesson!: Lesson;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
} 