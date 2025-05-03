import { NFT as NFTResponse } from "../types/nft.types";
import { NFT } from "../entities/NFT";
import { BaseService } from "./BaseService";
import { AppError } from "../middleware/errorHandler";
import { Horizon, StellarToml } from "@stellar/stellar-sdk";
import { isNFT } from "../utils/nft";
import { redisClient } from "../config/redis";

type StellarAssetResponse = {
  records: Array<{
    _links: {
      self: { href: string };
      toml?: { href: string };
    };
  }>;
};

export class NFTService extends BaseService<NFT> {
  constructor() {
    super(NFT);
  }

  async getNFTs(walletAddress: string, page: number = 1, limit: number = 20) {
    let nfts: NFTResponse[] = [];
    const cachedNFTs = await redisClient.get(`nft:${walletAddress}`);
    if (cachedNFTs) {
      console.log("in cache");
      nfts = JSON.parse(cachedNFTs);
    } else {
      const server = new Horizon.Server(process.env.HORIZON_SERVER_URL!);
      let account;
      try {
        account = await server.loadAccount(walletAddress);
      } catch (err) {
        throw new AppError(
          404,
          "Could not get account from provided wallet_address",
        );
      }
      const balances = account.balances;
      for (const balance of balances) {
        if (balance.asset_type === "native") {
          continue;
        }

        if (
          balance.asset_type === "credit_alphanum4" ||
          balance.asset_type === "credit_alphanum12"
        ) {
          let nft: NFTResponse = {
            token_id: `${balance.sponsor}_${balance.asset_issuer}`,
            name: "",
            description: "",
            image_url: "",
            owner_address: balance.asset_issuer,
          };
          let assetResponse: StellarAssetResponse;
          try {
            const assetsBuilder = server
              .assets()
              .forCode(balance.asset_code)
              .forIssuer(balance.asset_issuer);

            assetResponse =
              (await assetsBuilder.call()) as unknown as StellarAssetResponse;

            if (assetResponse.records.length > 0) {
              const asset = assetResponse.records[0];
              const tomlLink = asset._links.toml?.href;
              if (tomlLink) {
                try {
                  const url = new URL(tomlLink);
                  const tomlData = await StellarToml.Resolver.resolve(
                    url.hostname,
                  );
                  if (!tomlData) {
                    throw new Error("Could not resolve toml data");
                  }
                  const assetMetadata = tomlData.CURRENCIES?.find(
                    (c) =>
                      c.code === balance.asset_code &&
                      c.issuer === balance.asset_issuer,
                  );
                  if (!assetMetadata) {
                    continue;
                  }
                  if (
                    assetMetadata?.is_asset_anchored &&
                    assetMetadata?.anchor_asset_type !== "nft"
                  ) {
                    continue;
                  }
                  if (!isNFT(assetMetadata)) {
                    continue;
                  }
                  nft = {
                    ...nft,
                    name: assetMetadata?.name ?? "",
                    description: assetMetadata?.desc ?? "",
                    image_url: assetMetadata?.image ?? "",
                  };
                } catch (error) {
                  console.log(
                    `Could not get toml metadata for the given asset: ${JSON.stringify(asset)}`,
                  );
                }
              }
              nfts.push(nft);
            }
          } catch (err) {
            console.log(
              `Could not get assets information for balance: ${JSON.stringify(balance)}`,
            );
          }
        }
      }
      await redisClient.set(`nft:${walletAddress}`, JSON.stringify(nfts), {
        EX: 60 * 60, // 1 hr of ttl expiry
      });
    }
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return {
      nfts: startIndex >= nfts.length ? [] : nfts.slice(startIndex, endIndex),
      total: nfts.length,
    };
  }
}
