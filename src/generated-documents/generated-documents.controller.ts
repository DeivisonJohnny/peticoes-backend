import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { GeneratedDocumentsService } from './generated-documents.service';
import { FindAllGeneratedDto } from './dto/find-all-generated.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('generated-documents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))

@Controller('generated-documents')
export class GeneratedDocumentsController {
    constructor(private readonly generatedDocumentsService: GeneratedDocumentsService) {}
    
    @Get()
    @ApiOperation({ summary: 'Lista o histórico de documentos gerados para um cliente.' })
    async findAll(@Query() query: FindAllGeneratedDto) {
        return this.generatedDocumentsService.findAllByClient(query.clientId);
    }

    @Get(':id/download')
    @ApiOperation({ summary: 'Baixa um documento PDF gerado.' })
    async download(
        @Param('id') id: string,
        @Res() res: Response,
    ) {
        const filePath = await this.generatedDocumentsService.getFilePathById(id);
        return res.download(filePath);
}
}
