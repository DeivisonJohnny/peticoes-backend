import { Test, TestingModule } from '@nestjs/testing';
import { GeneratedDocumentsController } from './generated-documents.controller';

describe('GeneratedDocumentsController', () => {
  let controller: GeneratedDocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneratedDocumentsController],
    }).compile();

    controller = module.get<GeneratedDocumentsController>(
      GeneratedDocumentsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
