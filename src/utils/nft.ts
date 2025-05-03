import { StellarToml } from "@stellar/stellar-sdk";

export const isNFT = (assetMetadata: StellarToml.Api.Currency) => {
  return (
    assetMetadata.name?.toLowerCase().includes("nft") ||
    assetMetadata.code?.toLowerCase().includes("nft") ||
    assetMetadata.desc?.toLowerCase().includes("nft")
  );
};
