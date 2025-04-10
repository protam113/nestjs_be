import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '../configs/app';

@Controller()
export class AppBaseController {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>
  ) {}

  @Get()
  getAppConfig() {
    return {
      name: this.config.name,
      host: this.config.host,
      port: this.config.port,
    };
  }
}
