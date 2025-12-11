import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsDate,
} from 'class-validator';
import { IsCPF } from 'src/common/decorators/is-cpf.validator';
import { IsCNPJ } from 'src/common/decorators/is-cnpj.validator';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
  name: string;

  @IsCPF({ message: 'O CPF informado é inválido.' })
  @IsOptional()
  cpf?: string;

  @IsCNPJ({ message: 'O CNPJ informado é inválido.' })
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  cep?: string;

  @IsPhoneNumber('BR', { message: 'O número de telefone é inválido.' })
  @IsOptional()
  phone?: string;

  @Type(() => Date)
  @IsDate({ message: 'O campo data de nascimento deve ser uma data válida.' })
  @IsOptional()
  dateOfBirth?: Date;

  @IsString()
  @IsOptional()
  rg?: string;

  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @IsString()
  @IsOptional()
  birthPlace?: string;

  @IsString()
  @IsOptional()
  rgIssuer?: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsString()
  @IsOptional()
  motherName?: string;

  @IsString()
  @IsOptional()
  occupation?: string;
}
