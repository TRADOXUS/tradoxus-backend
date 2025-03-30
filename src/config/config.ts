import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  stellar: {
    secretKey: string | undefined;
    publicKey: string | undefined;
    network: 'TESTNET' | 'PUBLIC';
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default_secret_do_not_use_in_production',
  stellar: {
    secretKey: process.env.STELLAR_SECRET_KEY,
    publicKey: process.env.STELLAR_PUBLIC_KEY,
    network: (process.env.STELLAR_NETWORK === 'PUBLIC' ? 'PUBLIC' : 'TESTNET') as 'TESTNET' | 'PUBLIC',
  },
};

export default config;