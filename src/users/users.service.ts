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
import { FindAllUsersDto } from './dto/find-all-users.dto';
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

  async findAll(query: FindAllUsersDto) {
    const { page = 1, limit = 10, name, email, role } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (role) {
      where.role = role;
    }

    where.isActive = true;

    // Define ordenação: se há filtros, ordena por nome; senão, por data de criação (mais recentes primeiro)
    const hasFilters = name || email || role;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: hasFilters 
          ? { name: 'asc' }           // Com filtros: ordem alfabética
          : { createdAt: 'desc' },    // Sem filtros: mais recentes primeiro
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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