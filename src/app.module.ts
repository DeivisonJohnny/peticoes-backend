import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { DocumentTemplatesModule } from './document-templates/document-templates.module';
import { GeneratedDocumentsModule } from './generated-documents/generated-documents.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    UsersModule,
    ClientsModule,
    DocumentTemplatesModule,
    GeneratedDocumentsModule,
    PrismaModule,
    AuthModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
