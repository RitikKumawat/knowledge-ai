import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
@InputType()
export class UserSignupInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @Field(() => String)
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  password!: string;
}

@InputType()
export class UserLoginInput {
  @Field(() => String)
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  password!: string;
}
