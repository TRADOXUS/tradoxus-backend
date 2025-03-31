import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, DeleteDateColumn } from "typeorm";
import { Module } from "./Module";
import { Capsule } from "./Capsule";
import { IsNotEmpty, IsString, Length, IsNumber, Min, IsArray, IsOptional } from "class-validator";

@Entity('lessons')
export class Lesson {
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

    @Column({ type: 'simple-array', nullable: true })
    @IsOptional()
    @IsArray()
    prerequisites?: string[];

    @ManyToOne(() => Module, (module: Module) => module.lessons, {
        onDelete: 'CASCADE'
    })
    @IsNotEmpty()
    module!: Module;

    @OneToMany(() => Capsule, (capsule: Capsule) => capsule.lesson, {
        cascade: true
    })
    capsules!: Capsule[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
} 