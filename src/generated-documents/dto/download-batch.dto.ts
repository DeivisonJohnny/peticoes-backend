import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class DownloadBatchDto {
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    documentIds: string[];
}
