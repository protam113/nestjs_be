import { ContactStatus } from 'src/entities/contact.entity';

export function buildContactFilter(params: {
  startDate?: string;
  endDate?: string;
  status?: string;
  service?: string;
}): Record<string, any> {
  const { startDate, endDate, status, service } = params;
  const filter: Record<string, any> = {};

  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (status) {
    const statusArray = status.split(',');
    const validStatuses = statusArray.filter((s) =>
      Object.values(ContactStatus).includes(s as ContactStatus)
    );
    if (validStatuses.length > 0) {
      filter.status = { $in: validStatuses };
    }
  }

  if (service === 'null') {
    filter.service = service;
  }

  return filter;
}
