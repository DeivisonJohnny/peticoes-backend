import { IsNotEmpty, IsString } from "class-validator";

export class FindAllGeneratedDto {
    @IsString()
    @IsNotEmpty()
    clientId: string;
}