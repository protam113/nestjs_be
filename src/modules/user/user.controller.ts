import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Logger,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

import { UserService } from './user.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { UserResponse } from './user.interface';
import { SystemLogService } from '../system-log/system-log.service';
import { RolesGuard } from '../auth/guards/RolesGuard';
import { Status, SystemLogType } from '../../entities/system-log.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly systemLogService: SystemLogService // inject SystemLogService ở đây
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req): Promise<UserResponse> {
    this.logger.debug('Getting info for current user:', req.user);
    const userId = req.user?.userId;

    if (!userId) {
      this.logger.error('User ID is missing in request');
      throw new BadRequestException('Invalid token: Missing user ID');
    }

    const user = await this.userService.findByUuid(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Get('statistic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getUserStatistic() {
    return this.userService.getUserStatistic();
  }

  @Post('manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async createManager(
    @Body() body: CreateManagerDto,
    @Param('id') userId: string,
    @Req() req
  ) {
    const manager = await this.userService.createManagerUser(body, req.user);

    await this.systemLogService.log({
      type: SystemLogType.CreateManager,
      note: `Admin create manager with ID: ${manager.data._id}`,
      status: Status.Success,
      data: {
        user: req.user,
        id: manager.data._id,
        title: `Admin create manager name ${manager.data.name}`,
      },
    });

    return manager;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getUsers(
    @Query('role') role?: Role,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') searchQuery?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<any> {
    this.logger.debug('Fetching users with filters:', {
      role,
      startDate,
      endDate,
      searchQuery,
      page,
      limit,
    });

    return this.userService.getAllUsers(
      role,
      startDate,
      endDate,
      searchQuery,
      page,
      limit
    );
  }

  @Delete('manager/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async deleteManager(@Param('id') userId: string) {
    // Ghi log nếu cần
    this.logger.warn(`Deleting manager with ID: ${userId}`);
    const result = await this.userService.deleteManagerById(userId);

    // Ghi log hệ thống (nếu cần dùng SystemLogService)
    await this.systemLogService.log({
      type: SystemLogType.DeletedUser,
      note: `Admin deleted manager with ID: ${userId}`,
      status: Status.Success,
    });

    return result;
  }

  @Post('update-password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Req() req,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    const userId = req.user?.userId;

    if (!userId) {
      throw new BadRequestException('Invalid token: Missing user ID');
    }

    return this.userService.initiatePasswordChange(userId, updatePasswordDto);
  }

  @Post('initiate-password-change')
  @UseGuards(JwtAuthGuard)
  async initiatePasswordChange(
    @Req() req,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Invalid token: Missing user ID');
    }
    return this.userService.initiatePasswordChange(userId, updatePasswordDto);
  }

  @Post('verify-code')
  @UseGuards(JwtAuthGuard)
  async verifyCodeAndUpdatePassword(
    @Req() req,
    @Body() verifyCodeDto: VerifyCodeDto
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Invalid token: Missing user ID');
    }
    return this.userService.verifyCodeAndUpdatePassword(
      userId,
      verifyCodeDto.code
    );
  }
}
