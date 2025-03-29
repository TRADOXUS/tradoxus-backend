import { Horizon } from "@stellar/stellar-sdk";
import { NFT as NFTResponse } from "../types/nft.types";
import { NFT } from "../entities/NFT";
import { BaseService } from "./BaseService";
import { AppError } from "../middleware/errorHandler";

export class NFTService extends BaseService<NFT> {
    constructor() {
        super(NFT);
    }

    async getNFTs(walletAddress: string, page: number = 1 , limit: number = 20) {
        const server = new Horizon.Server(process.env.HORIZON_SERVER_URL!);
        let account;
        try {
            account = await server.loadAccount(walletAddress);
        } catch (err) {
            throw new AppError("Could not get account from provided wallet_address", 404);
        }
        const nfts: NFTResponse[] = [];
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
        return { nfts, total: nfts.length };
    }
}
