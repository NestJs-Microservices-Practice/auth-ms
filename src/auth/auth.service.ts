import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoginUserDto, RegisterUserDto } from './dto';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { envs } from 'src/config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit{
  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly jwtService: JwtService
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('MongoDB connected');
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password } = registerUserDto;
    try {
      const user = await this.user.findUnique({
        where: { email }
      });
      
      if(user) {
        throw new RpcException({
          status: 400,
          message: 'User already exists'
        });
      }

      const newUser = await this.user.create({
        data: {
          email,
          name,
          password: bcrypt.hashSync(password, 10)
        }
      });

      const { password: _, ...userWithoutPassword } = newUser;

      return {
        user: userWithoutPassword,
        token: await this.signJwt(userWithoutPassword)
      }; 
    } catch (error) {
      this.logger.error(error.message);
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    try {
      const user = await this.user.findUnique({
        where: { email }
      });

      if(!user) {
        throw new RpcException({
          status: 400,
          message: 'User/Passowrd not valid'
        });
      }

      const validPassword = bcrypt.compareSync(password, user.password);

      if(!validPassword) {
        throw new RpcException({
          status: 400,
          message: 'User/Passowrd not valid'
        });
      }

      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token: await this.signJwt(userWithoutPassword)
      }
    } catch (error) {
      this.logger.error(error.message);
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async verifyToken(token: string) {
    try {
      const { sub, iat, exp, ...user} = this.jwtService.verify(token, {
        secret: envs.secret,
      });
      return {
        user,
        token: await this.signJwt(user),
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new RpcException({
        status: 401,
        message: 'Invalid token',
      });
    }
  }

  async signJwt(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

}
