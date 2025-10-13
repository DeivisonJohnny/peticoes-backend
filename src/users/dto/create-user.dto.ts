import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'O e-mail informado é inválido.' })
  @IsNotEmpty({ message: 'O e-mail não pode ser vazio.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha não pode ser vazia.' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
