import {
  Args,
  Context,
  ID,
  Mutation,
  Query,
  Resolver,
  ObjectType,
  Subscription,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { DocumentsService } from './documents.service';
import { GraphQLUpload } from 'graphql-upload-ts';
import type { FileUpload } from 'graphql-upload-ts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/users.schema';
import type { GraphqlContext } from '../auth/common/interfaces/auth.interfaces';
import { UploadedDoc } from '../schemas/uploadedDoc.schema';
import { Types } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE } from '../auth/constants/role.enum';

import { Paginated } from '../common/pagination/dto/paginated.response';
import { PaginationInput } from '../common/pagination/dto/pagination.input';

@ObjectType()
export class PaginatedDocumentsResponse extends Paginated(UploadedDoc) {}

@Resolver(() => UploadedDoc)
@Roles(ROLE.USER)
export class DocumentsResolver {
  constructor(
    private readonly documentsService: DocumentsService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @Mutation(() => String)
  async uploadDocument(
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    @Context() context: GraphqlContext,
    @CurrentUser() user: UserDocument,
  ): Promise<string> {
    await this.documentsService.uploadDocument(file, user, context.req);
    return 'Document uploaded successfully';
  }

  @Query(() => PaginatedDocumentsResponse)
  async documents(
    @Args('pagination', { nullable: true }) pagination: PaginationInput,
    @CurrentUser() user: UserDocument,
  ): Promise<PaginatedDocumentsResponse> {
    return this.documentsService.listDocuments(user, pagination);
  }

  @Query(() => UploadedDoc)
  async document(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<UploadedDoc> {
    return this.documentsService.getDocumentDetails(
      new Types.ObjectId(id),
      user,
    );
  }

  @Mutation(() => Boolean)
  async deleteDocument(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<boolean> {
    return this.documentsService.deleteDocument(new Types.ObjectId(id), user);
  }

  @Mutation(() => Boolean)
  async reprocessDocument(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<boolean> {
    return this.documentsService.reprocessDocument(
      new Types.ObjectId(id),
      user,
    );
  }

  @Subscription(() => UploadedDoc, {
    filter: (
      payload: { documentStatusUpdated: UploadedDoc },
      variables: Record<string, unknown>,
      context: GraphqlContext,
    ) => {
      const doc = payload.documentStatusUpdated;
      const user = context.req.user;
      if (!user) return false;
      return doc.uploadedBy.toString() === user._id.toString();
    },
  })
  documentStatusUpdated() {
    return this.pubSub.asyncIterableIterator('documentStatusUpdated');
  }
}
