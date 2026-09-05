import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { BranchesService } from '../branches/branches.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly branchesService: BranchesService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const branch = await this.branchesService.findById(
      registerDto.branchId,
    );

    if (!branch || !branch.isActive) {
      throw new UnauthorizedException(
        'Invalid or inactive branch',
      );
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      12,
    );

    const user = await this.usersService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      phone: registerDto.phone,
      password: hashedPassword,
      role: 'STAFF',
      branchId: branch._id,
      isActive: true,
    });

    return {
      message: 'User registered successfully',
      user: this.sanitizeUser(user),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account is inactive',
      );
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    user.lastLogin = new Date();
    await user.save();

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      branchId: user.branchId.toString(),
    };

    const accessToken = await this.jwtService.signAsync(
      payload,
    );

    return {
      message: 'Login successful',
      accessToken,
      user: this.sanitizeUser(user),
    };
  }
    async getMe(user: any) {
  const currentUser =
    await this.usersService.findById(user.sub);

  if (!currentUser || !currentUser.isActive) {
    throw new UnauthorizedException(
      'User account not found or inactive',
    );
  }

  return {
    user: this.sanitizeUser(currentUser),
  };
}


  private sanitizeUser(user: any) {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      branchId: user.branchId.toString(),
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}