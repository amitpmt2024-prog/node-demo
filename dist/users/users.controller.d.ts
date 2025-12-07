import { UsersService } from './users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    test(): {
        message: string;
    };
    register(registerDto: RegisterDto): Promise<{
        user: Partial<import("./schemas/user.schema").User>;
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: Partial<import("./schemas/user.schema").User>;
        accessToken: string;
        message: string;
    }>;
}
