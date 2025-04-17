import { User } from './user.interface';
import { Role } from '../../common/enums/role.enum';

export function toDataResponse(user: Record<string, any>): User {
  return {
    _id: user._id?.toString() ?? '',
    name: user.name ?? '',
    username: user.username ?? '',
    role: (user.role as Role) ?? Role,
    email: user.email ?? '',
    phoneNumber: user.phoneNumber ?? '',
    password: user.password ?? '',
    createdAt: user.createdAt ?? new Date(),
    updatedAt: user.updatedAt ?? new Date(),
  };
}
