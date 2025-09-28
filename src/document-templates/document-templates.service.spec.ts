import { Test, TestingModule } from '@nestjs/testing';
import { DocumentTemplatesService } from './document-templates.service';

describe('DocumentTemplatesService', () => {
  let service: DocumentTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentTemplatesService],
    }).compile();

    service = module.get<DocumentTemplatesService>(DocumentTemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
