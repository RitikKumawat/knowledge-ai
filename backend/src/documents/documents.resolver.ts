import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
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

@Resolver(() => UploadedDoc)
@Roles(ROLE.USER)
export class DocumentsResolver {
  constructor(private readonly documentsService: DocumentsService) {}

  @Mutation(() => String)
  async uploadDocument(
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    @Context() context: GraphqlContext,
    @CurrentUser() user: UserDocument,
  ): Promise<string> {
    await this.documentsService.uploadDocument(file, user, context.req);
    return 'Document uploaded successfully';
  }

  @Query(() => [UploadedDoc])
  async documents(@CurrentUser() user: UserDocument): Promise<UploadedDoc[]> {
    return this.documentsService.listDocuments(user);
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
}
