import { ContactDocument } from 'src/entities/contact.entity';
import { DataResponse } from './responses/data.response';
import { ContactStatus } from './contact.constant';

export function toDataResponse(
  contact: Partial<ContactDocument>
): DataResponse {
  return {
    _id: contact._id?.toString() ?? '',
    name: contact.name ?? '',
    email: contact.email ?? '',
    phone_number: contact.phone_number ?? '',
    message: contact.message ?? '',
    link: contact.link ?? '',
    service: contact.service
      ? {
          _id: (contact.service as any)._id?.toString() ?? '',
          name: (contact.service as any).title ?? '',
        }
      : undefined,
    status: contact.status as ContactStatus,
    createdAt: contact.createdAt ?? new Date(),
    updatedAt: contact.updatedAt ?? new Date(),
  };
}
