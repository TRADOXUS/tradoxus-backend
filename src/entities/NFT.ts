import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { IsNotEmpty, IsString, Length, IsUrl } from "class-validator";

@Entity('nfts')
export class NFT {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 100 })
    @IsNotEmpty()
    @IsString()
    @Length(3, 100)
    name!: string;

    @Column({ type: 'text' })
    @IsNotEmpty()
    @IsString()
    tokenId!: string;

    @Column({ type: 'text' })
    @IsNotEmpty()
    @IsString()
    contractAddress!: string;

    @Column({ type: 'text', nullable: true })
    @IsString()
    ownerAddress?: string;

    @Column({ type: 'text', nullable: true })
    @IsString()
    description?: string;

    @Column({ type: 'text', nullable: true })
    @IsUrl()
    imageUrl?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
