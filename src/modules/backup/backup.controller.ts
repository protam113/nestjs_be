import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Res,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/RolesGuard';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  async createBackup() {
    const backupPath = await this.backupService.createManualBackup();
    return { message: 'Backup created successfully', path: backupPath };
  }

  @Get('list')
  getBackups() {
    const backups = this.backupService.getBackupsList();
    return { backups };
  }

  @Post('restore')
  async restoreBackup(@Body('path') backupPath: string) {
    await this.backupService.restoreBackup(backupPath);
    return { message: 'Backup restored successfully' };
  }

  @Get('download/:filename')
  async downloadBackup(
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    const backupDir = path.join(process.cwd(), 'backup');
    const filePath = path.join(backupDir, filename);
    return res.download(filePath);
  }

  @Get('download')
  async downloadLatestBackup(@Res() res: Response) {
    try {
      // Create a new backup
      const backupPath = await this.backupService.createManualBackup();

      // Get the filename from the full path
      const filename = path.basename(backupPath);

      // Set headers for download
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      // Stream the file directly from the backup folder
      return res.download(backupPath);
    } catch (error) {
      throw new Error(`Failed to create and download backup: ${error.message}`);
    }
  }
}
