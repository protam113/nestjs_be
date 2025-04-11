import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export class DatabaseBackup {
  async createBackup(dbName: string, dbUri: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backup');
    const backupFileName = `${dbName}-${timestamp}.gz`;
    const backupPath = path.join(backupDir, backupFileName);
    const containerPath = '/data/backup/' + backupFileName;

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
      // Create backup directory in container
      await execAsync(`docker exec hust4l_mongo_dev mkdir -p /data/backup`);

      // Create backup using container's MongoDB connection
      const command = `docker exec hust4l_mongo_dev mongodump --uri="mongodb://root:Admin123@localhost:27017/${dbName}?authSource=admin" --archive="${containerPath}" --gzip`;
      await execAsync(command);

      // Copy from container to host
      await execAsync(
        `docker cp hust4l_mongo_dev:${containerPath} ${backupPath}`
      );

      return backupPath;
    } catch (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async restoreBackup(
    dbName: string,
    dbUri: string,
    backupPath: string
  ): Promise<void> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }

      const containerPath = '/data/backup/restore.gz';

      // Create backup directory in container
      await execAsync(`docker exec hust4l_mongo_dev mkdir -p /data/backup`);

      // Copy backup file to container
      await execAsync(
        `docker cp ${backupPath} hust4l_mongo_dev:${containerPath}`
      );

      // Restore from the copied file
      const command = `docker exec hust4l_mongo_dev mongorestore --uri="mongodb://root:Admin123@localhost:27017/${dbName}?authSource=admin" --archive="${containerPath}" --gzip --drop`;
      await execAsync(command);
    } catch (error) {
      throw new Error(`Restore failed: ${error.message}`);
    }
  }
}
