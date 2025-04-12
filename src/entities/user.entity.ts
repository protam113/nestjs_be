import { compare, hash } from 'bcrypt';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Document } from 'mongoose';
import { BCRYPT_SALT_ROUNDS } from '../app/app.constant';
import { Base } from './base.entity';
import { Role } from '../common/enums/role.enum';
import { COLLECTION_KEYS } from 'src/database/collections';

// Định nghĩa lớp User
@Schema()
export class User extends Base {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop()
  readonly role!: Role;

  @Prop({ unique: true })
  readonly name!: string;

  @Prop({ unique: true })
  readonly username!: string;

  @Prop({ unique: true })
  readonly email!: string;

  @Prop({ unique: true })
  readonly phoneNumber!: string;

  @Prop()
  password!: string;
}

// Tạo UserSchema từ User class
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('collection', COLLECTION_KEYS.USER);

// Hash mật khẩu trước khi save
UserSchema.pre<User & Document>('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, BCRYPT_SALT_ROUNDS);
  }
  next();
});

// Thêm phương thức comparePassword vào schema
UserSchema.methods.comparePassword = async function (
  this: User & Document,
  attempt: string
): Promise<boolean> {
  if (!attempt || !this.password) return false;
  return compare(attempt, this.password);
};

// Định nghĩa kiểu UserDocument kế thừa từ Document
export interface UserDocument extends Document {
  _id: string;
  role: Role;
  name: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  comparePassword(attempt: string): Promise<boolean>;
}
