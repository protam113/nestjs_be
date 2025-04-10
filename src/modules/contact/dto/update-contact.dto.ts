import { IsEnum, IsOptional } from 'class-validator';

export enum ContactStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class UpdateContactDto {
  @IsOptional()
  @IsEnum(ContactStatus)
  status: ContactStatus;
}
