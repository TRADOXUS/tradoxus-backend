import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from "typeorm";
import { Course } from "./Course";
import { Lesson } from "./Lesson";
import { IsNotEmpty, IsString, Length, IsNumber, Min } from "class-validator";

@Entity("modules")
export class Module {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  @Min(0)
  order: number = 0;

  @ManyToOne(() => Course, (course: Course) => course.modules, {
    onDelete: "CASCADE",
  })
  @IsNotEmpty()
  course!: Course;

  @OneToMany(() => Lesson, (lesson: Lesson) => lesson.module, {
    cascade: true,
  })
  lessons!: Lesson[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
