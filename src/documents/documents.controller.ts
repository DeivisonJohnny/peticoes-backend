import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { GenerateBatchDto } from './dto/generate-batch.dto';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('documents')

export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Gera um novo documento em PDF' })
  @ApiResponse({ status: 201, description: 'Documento gerado com sucesso.' })
  @ApiResponse({
    status: 404,
    description: 'Cliente ou Template não encontrado.',
  })
  generate(
    @Body() generateDto: GenerateDocumentDto,
    @GetUser() user: AuthUser,
  ) {
    return this.documentsService.generatePdf(generateDto, user.id);
  }

  @Post('generate-batch')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Gera múltiplos documentos em lote para um cliente.' })
  @ApiResponse({ status: 201, description: 'Documentos gerados com sucesso.' })
  @ApiResponse({
    status: 404,
    description: 'Cliente ou Template não encontrado.',
  })
  generateBatch(
    @Body() generateBatchDto: GenerateBatchDto,
    @GetUser() user: AuthUser,
  ) {
    return this.documentsService.generatePdfBatch(generateBatchDto, user.id);
  }
}
