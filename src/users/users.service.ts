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
    const { name, email, password } = registerDto;

    // Check if user already exists by email
    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user with hashed password
    const newUser = new this.userModel({
      name,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Return user without password
    const userObject = savedUser.toObject();
    const { password: _password, ...userWithoutPassword } = userObject;

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
    const accessToken = this.jwtService.sign(payload) as string;

    // Return user without password, but with accessToken
    const userObject = user.toObject();
    const { password: _password, ...userWithoutPassword } = userObject;

    // Add accessToken to user object
    const userWithToken: Partial<User> & { accessToken: string } = {
      ...userWithoutPassword,
      accessToken,
    };

    return {
      user: userWithToken,
      accessToken,
      message: 'Login successful',
    };
  }
}
