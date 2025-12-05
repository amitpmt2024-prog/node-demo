import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Partial<User>; message: string }> {
    const { email, password } = registerDto;

    if (!email) {
      throw new ConflictException('Email is required');
    }

    // Check if user already exists
    const existingUserQuery: {
      $or: Array<{ email?: string }>;
    } = {
      $or: [],
    };

    if (email) {
      existingUserQuery.$or.push({ email });
    }
    const existingUser = await this.userModel.findOne(existingUserQuery);

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user with hashed password
    const newUser = new this.userModel({
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = savedUser.toObject();

    return {
      user: userWithoutPassword,
      message: 'User registered successfully',
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Partial<User>; accessToken: string; message: string }> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException(
        'Email or password is incorrect. Please try again.',
      );
    }

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Email or password is incorrect. Please try again.',
      );
    }

    // Generate JWT token
    const payload = {
      userId: user._id.toString(),
      email: user.email,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const accessToken = this.jwtService.sign(payload);

    // Return user without password, but with accessToken
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user.toObject();

    // Add accessToken to user object
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userWithToken: Partial<User> & { accessToken: string } = {
      ...userWithoutPassword,
      accessToken,
    } as Partial<User> & { accessToken: string };

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      user: userWithToken,
      accessToken,
      message: 'Login successful',
    };
  }
}
