import { IsNotEmpty, IsObject, IsString } from 'class-validator';


export class GenerateDocumentDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsObject()
  extraData: Record<string, any>;
}
