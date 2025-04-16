export enum Type {
  BLOG = 'blog',
  PROJECT = 'project',
  SERVICE = 'service',
}

export interface TrackingResponseDto {
  _id: string;
  postId: string;
  title: string;
  slug: string;
  type: 'blog' | 'project' | 'service';
  views: number;
  byDevice: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}
