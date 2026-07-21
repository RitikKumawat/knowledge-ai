import { Injectable } from '@nestjs/common';
import { Model, SortOrder } from 'mongoose';
import { PaginationInput } from './dto/pagination.input';
import { IPaginatedType } from './dto/paginated.response';

@Injectable()
export class PaginationService {
  async paginate<T>(
    model: Model<T>,
    query: Record<string, unknown>,
    paginationInput: PaginationInput,
    sortOptions?: string | Record<string, SortOrder>,
  ): Promise<IPaginatedType<T>> {
    const { page, limit } = paginationInput;
    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      model.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
      totalCount,
      page,
      totalPages,
    };
  }
}
