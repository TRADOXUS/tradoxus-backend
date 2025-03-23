import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, DeleteDateColumn } from "typeorm";
import { Module } from "./Module";
import { IsNotEmpty, IsString, Length } from "class-validator";

@Entity('courses')
export class Course {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 100 })
    @IsNotEmpty()
    @IsString()
    @Length(3, 100)
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ default: false })
    isPublished: boolean = false;

    @Column({ nullable: true })
    thumbnailUrl?: string;

    @OneToMany(() => Module, (module: Module) => module.course, {
        cascade: true
    })
    modules!: Module[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
} 