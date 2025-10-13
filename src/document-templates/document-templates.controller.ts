import { Controller, Post, Body } from '@nestjs/common';
import { DocumentTemplatesService } from './document-templates.service';
import { CreateDocumentTemplateDto } from './dto/create-document-template.dto';

@Controller('document-templates')
export class DocumentTemplatesController {
  constructor(
    private readonly documentTemplatesService: DocumentTemplatesService,
  ) {}

  @Post()
  create(@Body() createDto: CreateDocumentTemplateDto) {
    return this.documentTemplatesService.create(createDto);
  }

  // GET, PATCH, DELETE
}
