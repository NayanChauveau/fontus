export type RateLimitPort = {
  consume(input: {
    key: string;
    limit: number;
    windowMs: number;
  }): Promise<boolean>;
};
