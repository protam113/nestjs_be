import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

const execAsync = promisify(exec);

export class BackupService {
  constructor(private configService: ConfigService) {}

  async getBackupsList(): Promise<string[]> {
    const backupDir = path.join(process.cwd(), 'backup');

    if (!fs.existsSync(backupDir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(backupDir);
      return files.filter((file) => file.endsWith('.gz'));
    } catch (error) {
      console.error(`Failed to get backups list: ${error.message}`);
      throw new Error(`Failed to get backups list: ${error.message}`);
    }
  }

  async createManualBackup(): Promise<string> {
    const dbUri = this.configService.get<string>('DATABASE_URL');
    const dbName = this.configService.get<string>('DB_NAME');

    if (!dbUri || !dbName) {
      throw new Error('Database configuration is missing');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backup');
    const backupFileName = `${dbName}-${timestamp}.gz`;
    const backupPath = path.join(backupDir, backupFileName);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
      const command = `mongodump --uri="${dbUri}" --archive="${backupPath}" --gzip`;
      await execAsync(command);
      return backupPath;
    } catch (error) {
      console.error(`Backup failed: ${error.message}`);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    const dbUri = this.configService.get<string>('DATABASE_URL');
    const dbName = this.configService.get<string>('DB_NAME');

    if (!dbUri || !dbName) {
      throw new Error('Database configuration is missing');
    }

    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }

      const command = `mongorestore --uri="${dbUri}" --archive="${backupPath}" --gzip --drop`;
      await execAsync(command);
    } catch (error) {
      console.error(`Restore failed: ${error.message}`);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }
}
