import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";

class LastGeneratedDetailsDto {
    @ApiProperty()
    generatedDocumentId: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    generatorName: string;

    @ApiProperty({ description: 'Snapshot JSON dos dados usados na geração.'})
    dataSnapshot: Prisma.JsonValue
}

export class DocumentStatusDto {
  @ApiProperty()
  templateId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ['gerado', 'nao_gerado'] })
  status: 'gerado' | 'nao_gerado';

  // Campo opcional que conterá os detalhes se o status for 'gerado'
  @ApiProperty({ type: LastGeneratedDetailsDto, nullable: true })
  lastGenerated: LastGeneratedDetailsDto | null;
}