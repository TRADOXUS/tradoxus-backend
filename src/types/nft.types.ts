import { Address } from "@stellar/stellar-sdk"

export type GetNFTsPayload = {
    walletAddress: Address,
    page: Number,
    limit: Number
}
