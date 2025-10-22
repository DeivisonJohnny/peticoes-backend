import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindAllClientsDto } from './dto/find-all-clients.dto';
import { DocumentStatusDto } from '../clients/dto/document-status.dto';

@UseGuards(AuthGuard('jwt'))
@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo cliente' })
  @ApiResponse({
    status: 201,
    description: 'O cliente foi criado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({
    status: 409,
    description: 'Conflito. CPF, CNPJ ou E-mail já está em uso.',
  })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista  e filtra todos os clientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes retornada com sucesso.',
  })
  findAll(@Query() query: FindAllClientsDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um cliente pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'Conflito de dados (CPF, CNPJ ou E-mail já existem).',
  })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa um cliente (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Cliente desativado com sucesso  ' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Get(':id/document-status')
  @ApiOperation({ summary: 'Obtém o status dos documentos para um cliente específico' })
  @ApiResponse({
    status: 200,
    description: 'Status dos documentos retornado com sucesso.',
    type: [DocumentStatusDto],
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  getDocumentStatus(@Param('id') id: string): Promise<DocumentStatusDto[]> {
    return this.clientsService.getDocumentStatus(id);
  }
}
