import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";

export default {
  solidity: { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    base:        { url: process.env.BASE_MAINNET_RPC!,  chainId: 8453,  accounts: [PRIVATE_KEY] },
    baseSepolia: { url: process.env.BASE_SEPOLIA_RPC!, chainId: 84532, accounts: [PRIVATE_KEY] },
  },
};
