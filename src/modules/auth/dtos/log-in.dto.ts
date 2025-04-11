import { IsNotEmpty, IsString, ValidateIf, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class LogInDTO {
  @ValidateIf((o) => !o.email)
  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username must be alphanumeric',
  })
  readonly username?: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value)
  readonly password!: string;
}
