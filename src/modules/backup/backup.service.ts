import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseBackup } from '../../utils/backup.util';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly databaseBackup: DatabaseBackup;

  constructor(private configService: ConfigService) {
    this.databaseBackup = new DatabaseBackup();
    // Create initial backup when service starts
    this.handleDailyBackup().catch((err) =>
      this.logger.error('Initial backup failed:', err)
    );
  }

  // Change from EVERY_DAY_AT_MIDNIGHT to a specific time
  @Cron('0 0 0 * * *') // Runs at 00:00:00 (midnight) every day
  async handleDailyBackup() {
    try {
      const dbUri = this.configService.get<string>('DATABASE_URL');
      const dbName = this.configService.get<string>('DB_NAME');

      if (!dbUri || !dbName) {
        throw new Error('Database configuration is missing');
      }

      const finalPath = await this.databaseBackup.createBackup(dbName, dbUri);
      this.logger.log(`Database backup saved to: ${finalPath}`);

      // Clean up old backups (keep last 7 days)
      await this.cleanupOldBackups();

      // Reset any backup-related states or counters here
      this.logger.log(
        `Daily backup completed and reset at ${new Date().toISOString()}`
      );

      return finalPath;
    } catch (error) {
      this.logger.error('Database backup failed:', error);
      throw error;
    }
  }

  private async cleanupOldBackups() {
    const backupDir = path.join(process.cwd(), 'backup');
    if (!fs.existsSync(backupDir)) return;

    const files = fs.readdirSync(backupDir);
    const now = new Date();
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime < sevenDaysAgo) {
        fs.unlinkSync(filePath);
      }
    }
  }

  async createManualBackup(): Promise<string> {
    const dbUri = this.configService.get<string>('DATABASE_URL');
    const dbName = this.configService.get<string>('DB_NAME');

    if (!dbUri || !dbName) {
      throw new Error('Database configuration is missing');
    }

    // Direct use of the backup path without copying
    return await this.databaseBackup.createBackup(dbName, dbUri);
  }

  getBackupsList(): string[] {
    const backupDir = path.join(process.cwd(), 'backup');
    if (!fs.existsSync(backupDir)) {
      return [];
    }
    return fs.readdirSync(backupDir);
  }

  async restoreBackup(backupPath: string): Promise<void> {
    const dbUri = this.configService.get<string>('DATABASE_URL');
    const dbName = this.configService.get<string>('DB_NAME');

    if (!dbUri || !dbName) {
      throw new Error('Database configuration is missing');
    }

    await this.databaseBackup.restoreBackup(dbName, dbUri, backupPath);
  }
}
