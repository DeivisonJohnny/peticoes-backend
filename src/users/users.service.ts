import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import type { AuthUser } from '../auth/types/auth-user.type';

const removePassword = (user: User) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...result } = user;
  return result;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, name, password } = createUserDto;

    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? Role.ADMIN : Role.LAWYER;

    const userWithSameEmail = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (userWithSameEmail) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
    });
    return removePassword(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    return user;
  }

  async findOneByEmail(email: string) {
    // eslint-disable-next-line prisma/require-select
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, requestingUser: AuthUser) {
    if (requestingUser.id !== id) {
      throw new ForbiddenException('Você não tem permissão para editar este usuário.');
    }

    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateUserDto as Prisma.UserUpdateInput,
      });
      return removePassword(updatedUser);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('O e-mail informado já está em uso.');
      }
      throw error;
    }
  }

  async remove(id: string, requestingUser: AuthUser) {
    if (requestingUser.id !== id) {
      throw new ForbiddenException('Você não tem permissão para apagar este usuário.');
    }

    try {
      const deactivatedUser = await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return removePassword(deactivatedUser);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
      }
      throw error;
    }
  }
}