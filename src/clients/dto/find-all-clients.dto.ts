import { Type } from "class-transformer";
import { IsOptional, IsString, IsInt, Min, IsIn } from "class-validator";

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
    @IsIn(['createdAt', 'name'])
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    order?: 'asc' | 'desc' = 'desc';

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