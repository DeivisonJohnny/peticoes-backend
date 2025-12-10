import { Type } from "class-transformer";
import { IsOptional, IsString, IsInt, Min } from "class-validator";

export class FindAllClientsDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    cpfCnpj?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}