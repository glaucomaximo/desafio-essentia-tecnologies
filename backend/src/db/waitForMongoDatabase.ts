import { pingMongo } from "./mongo";
import { logger } from "../shared/logger";

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

export const waitForMongoDatabase = async (
  attempts = 12,
  delayMilliseconds = 2500
): Promise<void> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pingMongo();
      return;
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      logger.warn("mongo_unavailable_retrying", {
        attempt,
        attempts,
        delayMilliseconds
      });
      await sleep(delayMilliseconds);
    }
  }

  throw lastError;
};
