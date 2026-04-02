/**
 * Bull Queue tanımları
 * Not işleme ve podcast oluşturma kuyruklarını tanımlar
 */

import Bull from "bull";
import { env } from "../config/env";
import { logger } from "../shared/utils/logger";

// ──────── Queue Tanımları ────────

export const noteProcessingQueue = new Bull("note-processing", env.REDIS_URL, {
  defaultJobOptions: {
    attempts: env.JOB_RETRY_ATTEMPTS,
    backoff: {
      type: "exponential",
      delay: env.JOB_RETRY_DELAY_MS,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const podcastGenerationQueue = new Bull("podcast-generation", env.REDIS_URL, {
  defaultJobOptions: {
    attempts: env.JOB_RETRY_ATTEMPTS,
    backoff: {
      type: "exponential",
      delay: env.JOB_RETRY_DELAY_MS,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// ──────── Queue Event Log'ları ────────

[noteProcessingQueue, podcastGenerationQueue].forEach((queue) => {
  queue.on("error", (err) => {
    logger.error({ queue: queue.name, err }, "Queue hatası");
  });

  queue.on("failed", (job, err) => {
    logger.error({ queue: queue.name, jobId: job.id, err }, "Job başarısız");
  });

  queue.on("completed", (job) => {
    logger.info({ queue: queue.name, jobId: job.id }, "Job tamamlandı");
  });
});
