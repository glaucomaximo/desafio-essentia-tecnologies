import type { Request } from "express";

interface HttpRequestObservation {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}

interface HistogramState {
  count: number;
  sum: number;
  buckets: number[];
}

const durationBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
const httpRequests = new Map<string, HistogramState>();

export const metricsContentType = "text/plain; version=0.0.4; charset=utf-8";

const labelValue = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');

const labelsFromKey = (key: string): string => {
  const [method, path, statusCode] = JSON.parse(key) as [string, string, string];

  return `method="${labelValue(method)}",path="${labelValue(path)}",status_code="${labelValue(statusCode)}"`;
};

const metricKey = (observation: HttpRequestObservation): string =>
  JSON.stringify([
    observation.method.toUpperCase(),
    observation.path,
    String(observation.statusCode)
  ]);

export const normalizedRoutePath = (request: Request): string => {
  const rawPath = request.originalUrl.split("?")[0] || "/";

  return rawPath
    .replace(/\/[0-9]+(?=\/|$)/g, "/:id")
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
      "/:uuid"
    );
};

export const recordHttpRequest = (observation: HttpRequestObservation): void => {
  const key = metricKey(observation);
  const current =
    httpRequests.get(key) ??
    ({
      count: 0,
      sum: 0,
      buckets: Array.from({ length: durationBuckets.length + 1 }, () => 0)
    } satisfies HistogramState);
  const durationSeconds = observation.durationMs / 1000;

  current.count += 1;
  current.sum += durationSeconds;

  for (const [index, bucket] of durationBuckets.entries()) {
    if (durationSeconds <= bucket) {
      current.buckets[index] += 1;
    }
  }

  current.buckets[durationBuckets.length] += 1;
  httpRequests.set(key, current);
};

export const renderMetrics = (): string => {
  const memory = process.memoryUsage();
  const lines = [
    "# HELP process_uptime_seconds Tempo de atividade do processo em segundos.",
    "# TYPE process_uptime_seconds gauge",
    `process_uptime_seconds ${process.uptime().toFixed(3)}`,
    "# HELP process_memory_rss_bytes Memoria residente usada pelo processo em bytes.",
    "# TYPE process_memory_rss_bytes gauge",
    `process_memory_rss_bytes ${memory.rss}`,
    "# HELP http_requests_total Total de requisicoes HTTP processadas.",
    "# TYPE http_requests_total counter"
  ];

  for (const [key, state] of httpRequests.entries()) {
    lines.push(`http_requests_total{${labelsFromKey(key)}} ${state.count}`);
  }

  lines.push(
    "# HELP http_request_duration_seconds Duracao das requisicoes HTTP em segundos.",
    "# TYPE http_request_duration_seconds histogram"
  );

  for (const [key, state] of httpRequests.entries()) {
    const baseLabels = labelsFromKey(key);

    for (const [index, bucket] of durationBuckets.entries()) {
      lines.push(
        `http_request_duration_seconds_bucket{${baseLabels},le="${bucket}"} ${state.buckets[index]}`
      );
    }

    lines.push(
      `http_request_duration_seconds_bucket{${baseLabels},le="+Inf"} ${state.buckets[durationBuckets.length]}`,
      `http_request_duration_seconds_sum{${baseLabels}} ${state.sum.toFixed(6)}`,
      `http_request_duration_seconds_count{${baseLabels}} ${state.count}`
    );
  }

  lines.push("");

  return lines.join("\n");
};
