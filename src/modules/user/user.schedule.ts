import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { Status, SystemLogType } from '../../entities/system-log.entity';
import { SystemLogService } from '../system-log/system-log.service';
import { UserService } from './user.service';
import { CronTime } from '../../utils/time';

@Injectable()
export class UserSchedule {
  constructor(
    private readonly service: UserService,
    private readonly systemLogService: SystemLogService
  ) {}

  @Cron(CronTime.Daily)
  async statisticTotalUserCountOfEachStatus(): Promise<void> {
    this.systemLogService.log({
      type: SystemLogType.UserStatistic,
      status: Status.Success,
      note: 'Statistic total user count of each status.',
      data: await this.service.getTotalCountOfEachStatus(),
    });
  }
}
