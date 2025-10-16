import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';

class DocumentBatchItemDto {
    @IsString()
    @IsNotEmpty()
    templateId: string;

    @IsObject()
    extraData: Record<string, any>;

}

export class GenerateBatchDto {
    @IsString()
    @IsNotEmpty()
    clientId: string;
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DocumentBatchItemDto)
    documents: DocumentBatchItemDto[];
}