import { IsOptional, IsString } from "class-validator";

export class FindAllClientsDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    cpfCnpj?: string;

    @IsOptional()
    @IsString()
    email?: string;
}