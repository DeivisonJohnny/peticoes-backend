// src/document-templates/dto/create-document-template.dto.ts
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentTemplateDto {
  @ApiProperty({
    description: 'O título único do modelo de documento.',
    example: 'autodeclaracao-rural',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description:
      'O conteúdo HTML completo do modelo, com placeholders Handlebars.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'O schema JSON que define os campos do formulário dinâmico.',
    required: false,
  })
  @IsObject()
  @IsOptional()
  payloadSchema?: object;
}
