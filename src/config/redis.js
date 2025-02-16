const Redis = require("redis");

const redisClient = Redis.createClient({
  url: process.env.REDIS_URL,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis Client Connected"));

redisClient.connect().catch(console.error);

module.exports = redisClient;
