import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiration: string;
  redis: {
    host: string;
    port: string;
    password?: string;
    db: string;
  };
  web3: {
    chainId: number;
    rpcUrl: string;
    stellar: {
      secretKey: string | undefined;
      publicKey: string | undefined;
      network: "TESTNET" | "PUBLIC";
    };
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || "4001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret:
    process.env.JWT_SECRET || "default_secret_do_not_use_in_production",
  jwtExpiration: process.env.JWT_EXPIRATION || "24h",
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || "6381",
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || "0",
  },
  web3: {
    chainId: parseInt(process.env.CHAIN_ID || "1", 10), // Ethereum mainnet by default
    rpcUrl:
      process.env.RPC_URL || "https://mainnet.infura.io/v3/your-infura-key",
    stellar: {
      secretKey: process.env.STELLAR_SECRET_KEY,
      publicKey: process.env.STELLAR_PUBLIC_KEY,
      network: (process.env.STELLAR_NETWORK === "PUBLIC"
        ? "PUBLIC"
        : "TESTNET") as "TESTNET" | "PUBLIC",
    },
  },
};

export default config;
