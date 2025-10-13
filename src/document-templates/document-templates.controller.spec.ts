import { Test, TestingModule } from '@nestjs/testing';
import { DocumentTemplatesController } from './document-templates.controller';

describe('DocumentTemplatesController', () => {
  let controller: DocumentTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentTemplatesController],
    }).compile();

    controller = module.get<DocumentTemplatesController>(
      DocumentTemplatesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
