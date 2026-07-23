import { Resolver, Query, ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE } from '../auth/constants/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/users.schema';
import { Types } from 'mongoose';
import { DashboardService } from './dashboard.service';

@ObjectType()
class DashboardStats {
  @Field(() => Int)
  totalChats!: number;

  @Field(() => Int)
  activeDocuments!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field(() => Int)
  totalQueries!: number;
}

@ObjectType()
class RecentChatActivity {
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field()
  title!: string;

  @Field()
  updatedAt!: Date;

  @Field(() => Int)
  messageCount!: number;
}

@ObjectType()
class TopDocument {
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field()
  filename!: string;

  @Field(() => Int)
  chatCount!: number;
}

@ObjectType()
class DashboardData {
  @Field(() => DashboardStats)
  stats!: DashboardStats;

  @Field(() => [RecentChatActivity])
  recentActivities!: RecentChatActivity[];

  @Field(() => [TopDocument])
  topDocuments!: TopDocument[];
}

@Resolver()
@Roles(ROLE.USER)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardData)
  async getDashboardData(@CurrentUser() user: UserDocument) {
    return this.dashboardService.getDashboardData(user._id);
  }
}
