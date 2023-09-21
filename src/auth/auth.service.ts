import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new ForbiddenException('Người dùng k tồn tại');
    }

    const pwMatches = await argon.verify(user.hash, dto.password);

    if (!pwMatches) {
      throw new ForbiddenException('Người dùng k tồn tại');
    }
    delete user.hash;
    return user;
  }

  async signup(dto: AuthDto) {
    try {
      const hash = await argon.hash(dto.password);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });
      return { user };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ForbiddenException('Taken');
      }
      throw error;
    }
  }
}
