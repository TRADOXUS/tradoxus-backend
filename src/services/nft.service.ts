import { Horizon } from "@stellar/stellar-sdk";
import { GetNFTsPayload, NFT } from "../types/nft.types";
import constants from "../constants";

export async function getNFTs({ walletAddress, page = constants.DEFAULT_PAGE_GET_NFTS, limit = constants.DEFAULT_LIMIT_GET_NFTS}: GetNFTsPayload) {
    const server = new Horizon.Server(process.env.HORIZON_SERVER_URL!);
    let account;
    try {
        account = await server.loadAccount(walletAddress);
    } catch (err) {
        throw new Error("Could not get account from provided wallet_address");
    }
    const nfts: NFT[] = [];
    const balances = account.balances;
    for (const balance of balances) {
        if (balance.asset_type === "native") {
            continue;
        }

        if (balance.asset_type === "credit_alphanum4" || balance.asset_type === "credit_alphanum12") {
            let asset;
            try {
                asset = await server
                    .assets()
                    .forCode(balance.asset_code)
                    .forIssuer(balance.asset_issuer)
                    .call();
                
            } catch (err) {
                console.log(`Could not get assets information for balance: ${JSON.stringify(balance)}`);
            }
        }
    }
    return nfts;
}
