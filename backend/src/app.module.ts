import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './documents/documents.module';
import { ChatModule } from './chat/chat.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { RetrievalModule } from './retrieval/retrieval.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthorizationGuard } from './auth/guards/authorization.guard';
import { UserSessionModule } from './user-session/user-session.module';
import { BullModule } from '@nestjs/bull';
import { PaginationModule } from './common/pagination/pagination.module';
import { MessageModule } from './message/message.module';
import { PromptBuilderModule } from './prompt-builder/prompt-builder.module';
import { OllamaModule } from './ollama/ollama.module';
import { AskQuestionModule } from './ask-question/ask-question.module';

import { PubSubModule } from './common/pubsub/pubsub.module';
import { Request, Response } from 'express';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: ({
        req,
        res,
        extra,
        connectionParams,
      }: {
        req?: Request;
        res?: Response;
        extra?: { request: Request };
        connectionParams?: Record<string, unknown>;
      }) => {
        if (extra?.request) {
          // It's a graphql-ws subscription connection
          const cookieHeader = extra.request.headers.cookie;
          const cookies: Record<string, string> = {};
          if (cookieHeader) {
            cookieHeader.split(';').forEach((item: string) => {
              const parts = item.split('=');
              cookies[parts[0].trim()] = (parts[1] || '').trim();
            });
          }
          return {
            req: {
              ip: extra.request.socket?.remoteAddress,
              headers: { ...extra.request.headers, ...connectionParams },
              cookies: { ...cookies, ...extra.request.cookies },
            },
          };
        }
        return { req, res };
      },
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
    }),
    PubSubModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    MongooseModule.forRoot(process.env.DATABASE_URL as string),
    DocumentsModule,
    ChatModule,
    EmbeddingsModule,
    RetrievalModule,
    AuthModule,
    UserModule,
    UserSessionModule,
    PaginationModule,
    MessageModule,
    PromptBuilderModule,
    OllamaModule,
    AskQuestionModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule {}
