import * as dotenv from 'dotenv';
dotenv.config();

export const COLLECTION_KEYS = {
  SERVICE: process.env.SERVICE_COLLECTION || 'services',
  BLOG: process.env.BLOG_COLLECTION || 'blogs',
  CATEGORY: process.env.CATEGORY_COLLECTION || 'categories',
  USER: process.env.USER_COLLECTION || 'users',
  FAQ: process.env.FAQ_COLLECTION || 'faqs',
  CONTACT: process.env.CONTACT_COLLECTION || 'contacts',
  SYSTEMLOGS: process.env.SYSTEMLOGS_COLLECTION || 'system_logs',
  PRICING: process.env.PRICING_COLLECTION || 'pricings',
  SEO: process.env.SEO_COLLECTION || 'seos',
};
