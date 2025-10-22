import { ApiProperty } from "@nestjs/swagger";

export class DocumentStatusDto {
  @ApiProperty({
    description: 'O ID do modelo de documento (template).',
    example: 'hkjsakjahs768kjhlkhjas989078',
})
templateId: string;

    @ApiProperty({
        description: 'O título do modelo de documento.',
        example: 'Procuração e Declaração Judiciais',
    })
    title: string;

    @ApiProperty({
        description: 'O status do documento para este cliente.',
        enum: ['gerado', 'nao_gerado'],
    })
    status: 'gerado' | 'nao_gerado';
}