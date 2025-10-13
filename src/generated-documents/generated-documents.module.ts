import { Module } from '@nestjs/common';
import { GeneratedDocumentsController } from './generated-documents.controller';
import { GeneratedDocumentsService } from './generated-documents.service';

@Module({
  controllers: [GeneratedDocumentsController],
  providers: [GeneratedDocumentsService],
})
export class GeneratedDocumentsModule {}
