import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import slugify from 'slugify';

@Injectable()
export class SlugProvider {
  constructor(private readonly configService: ConfigService) {}

  generateSlug(
    text: string,
    options: { field?: string; unique?: boolean } = {}
  ): string {
    if (!text) return '';

    const slugOptions = {
      lower: true,
      strict: true,
      replacement: '-',
      remove: undefined,
    };

    let slug = slugify(text, slugOptions);

    if (options.unique) {
      slug = `${slug}-${Date.now()}`;
    }

    return slug;
  }

  createSlugHook(fromField: string = 'title'): Function {
    return function (next: Function) {
      if (this.isModified(fromField)) {
        this.slug = slugify(this[fromField], {
          lower: true,
          strict: true,
        });
      }
      next();
    };
  }
}
