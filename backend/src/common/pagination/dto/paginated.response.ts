import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export interface IPaginatedType<T> {
  items: T[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements IPaginatedType<T> {
    @Field(() => [classRef])
    items!: T[];

    @Field(() => Int)
    totalCount!: number;

    @Field(() => Int)
    page!: number;

    @Field(() => Int)
    totalPages!: number;
  }
  return PaginatedType as Type<IPaginatedType<T>>;
}
