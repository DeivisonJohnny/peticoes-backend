import { Test, TestingModule } from '@nestjs/testing';
import { GeneratedDocumentsService } from './generated-documents.service';

describe('GeneratedDocumentsService', () => {
  let service: GeneratedDocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneratedDocumentsService],
    }).compile();

    service = module.get<GeneratedDocumentsService>(GeneratedDocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
