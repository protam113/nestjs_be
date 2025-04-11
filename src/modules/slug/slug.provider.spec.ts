// import { Test, TestingModule } from '@nestjs/testing';
// import { SlugProvider } from './slug.provider';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { INestApplication } from '@nestjs/common';

// let module: TestingModule;
// let app: INestApplication;
// let slugProvider: SlugProvider;
// let configService: ConfigService;

// describe('SlugProvider', () => {
//   beforeAll(async () => {
//     module = await Test.createTestingModule({
//       imports: [
//         ConfigModule.forRoot({
//           isGlobal: true,
//         }),
//       ],
//       providers: [SlugProvider],
//     }).compile();

//     app = module.createNestApplication();
//     await app.init();

//     slugProvider = module.get(SlugProvider);
//     configService = module.get(ConfigService);
//   });

//   it('should generate basic slug', () => {
//     expect(slugProvider.generateSlug('test test')).toEqual('test-test');
//   });

//   it('should generate unique slug', () => {
//     const slug = slugProvider.generateSlug('test test', { unique: true });
//     expect(slug).toMatch(/^test-test-\d+$/);
//   });

//   afterAll(async () => {
//     await app.close();
//   });
// });
