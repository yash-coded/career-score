// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  createUser(name: string, email: string) {
    return this.prisma.user.create({
      data: { name, email },
    });
  }

  getAllUsers() {
    return this.prisma.user.findMany();
  }
}
