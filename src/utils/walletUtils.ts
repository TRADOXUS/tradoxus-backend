import { ethers } from 'ethers';

/**
 * Generate a message to sign for wallet verification
 * @param walletAddress Ethereum wallet address
 * @param nonce Unique nonce for this verification
 * @returns Message string to be signed
 */
export const generateSignMessage = (walletAddress: string, nonce: string): string => {
  return `I am signing this message to prove ownership of address ${walletAddress} with nonce: ${nonce}`;
};

/**
 * Verify an Ethereum signature against a message and wallet address
 * @param message Original message that was signed
 * @param signature Signature from the wallet
 * @param walletAddress Expected wallet address of the signer
 * @returns Boolean indicating if signature is valid
 */
export const verifySignature = (
  message: string, 
  signature: string, 
  walletAddress: string
): boolean => {
  try {
    // Convert wallet address to checksum format
    const checksumAddress = ethers.utils.getAddress(walletAddress);
    
    // Recover the address from the signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
    // Compare the recovered address with the expected address
    return recoveredAddress.toLowerCase() === checksumAddress.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Format an Ethereum address to checksum format
 * @param address Raw Ethereum address
 * @returns Checksum formatted address
 */
export const toChecksumAddress = (address: string): string => {
  try {
    return ethers.utils.getAddress(address);
  } catch (error) {
    throw new Error('Invalid Ethereum address');
  }
};

/**
 * Validate Ethereum address format
 * @param address Address to validate
 * @returns Boolean indicating if address is valid
 */
export const isValidEthereumAddress = (address: string): boolean => {
  try {
    ethers.utils.getAddress(address);
    return true;
  } catch (error) {
    return false;
  }
};