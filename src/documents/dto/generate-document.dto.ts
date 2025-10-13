import { IsDateString, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


class ExtraDataDto {
  @IsString()
  @IsNotEmpty()
  documentLocation: string;

  @IsDateString()
  documentDate: string;
}


export class GenerateDocumentDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ExtraDataDto)
  extraData: ExtraDataDto;
}
