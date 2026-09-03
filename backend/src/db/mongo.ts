import { MongoClient } from "mongodb";
import { env } from "../config/env";

export const mongoClient = new MongoClient(env.mongo.uri, {
  appName: env.serviceName,
  serverSelectionTimeoutMS: env.mongo.serverSelectionTimeoutMs
});

export const mongoDatabase = mongoClient.db(env.mongo.databaseName);

export const pingMongo = async (): Promise<void> => {
  await mongoClient.connect();
  await mongoDatabase.command({ ping: 1 });
};

export const closeMongo = async (): Promise<void> => {
  await mongoClient.close();
};
