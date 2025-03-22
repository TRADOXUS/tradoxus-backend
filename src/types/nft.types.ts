export type GetNFTsPayload = {
    walletAddress: string,
    page: number,
    limit: number
}

export type NFT = {
    id: string,
    name: string,
    description: string,
    image_url: string,
    token_id: string,
    contract_address: string,
    owner_address: string,
    created_at: Date,
    updated_at: Date
}
