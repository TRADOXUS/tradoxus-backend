import * as StellarSdk from '@stellar/stellar-sdk';
import config from '../../config/config';

/**
 * StellarService - Handles interactions with the Stellar blockchain
 * This service provides methods for connecting to the Stellar network,
 * managing accounts, and executing transactions for the NFT certificate system.
 */
class StellarService {
  private server: any; // Using any type to avoid TypeScript errors
  private networkPassphrase: string;
  
  constructor() {
    // Use testnet for development and testing, mainnet for production
    const isProduction = config.nodeEnv === 'production';
    
    // Initialize the Stellar server connection
    this.server = isProduction 
      ? new StellarSdk.Horizon.Server('https://horizon.stellar.org') 
      : new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    
    // Set the network passphrase based on environment
    this.networkPassphrase = isProduction 
      ? StellarSdk.Networks.PUBLIC 
      : StellarSdk.Networks.TESTNET;
  }

  /**
   * Load an account from the Stellar network
   * @param publicKey - The public key of the account to load
   * @returns The account object
   */
  async loadAccount(publicKey: string) {
    try {
      return await this.server.loadAccount(publicKey);
    } catch (error) {
      console.error('Error loading account:', error);
      throw new Error(`Failed to load account with public key: ${publicKey}`);
    }
  }

  /**
   * Create and sign a payment transaction
   * @param sourceKeypair - The keypair of the source account
   * @param destinationPublicKey - The public key of the destination account
   * @param amount - The amount to send
   * @param memo - Optional memo to attach to the transaction
   * @returns The transaction result
   */
  async createPayment(
    sourceKeypair: StellarSdk.Keypair, 
    destinationPublicKey: string,
    amount: string,
    memo?: string
  ) {
    try {
      // Load the source account
      const sourceAccount = await this.loadAccount(sourceKeypair.publicKey());
      
      // Build the transaction
      let transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase
      });
      
      // Add the payment operation
      transactionBuilder = transactionBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          asset: StellarSdk.Asset.native(), // XLM
          amount: amount
        })
      );
      
      // Add memo if provided
      if (memo) {
        transactionBuilder = transactionBuilder.addMemo(StellarSdk.Memo.text(memo));
      }
      
      // Set timeout and build the transaction
      const transaction = transactionBuilder
        .setTimeout(30)
        .build();
      
      // Sign the transaction
      transaction.sign(sourceKeypair);
      
      // Submit the transaction
      return await this.server.submitTransaction(transaction);
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error('Failed to create payment transaction');
    }
  }

  /**
   * Generate a new Stellar keypair
   * @returns A new keypair
   */
  generateKeypair() {
    return StellarSdk.Keypair.random();
  }

  /**
   * Create a keypair from a secret key
   * @param secretKey - The secret key to create the keypair from
   * @returns The keypair
   */
  createKeypairFromSecret(secretKey: string) {
    try {
      return StellarSdk.Keypair.fromSecret(secretKey);
    } catch (error) {
      console.error('Error creating keypair from secret:', error);
      throw new Error('Invalid secret key provided');
    }
  }

  /**
   * Get the server instance
   * @returns The Stellar server instance
   */
  getServer() {
    return this.server;
  }

  /**
   * Get the network passphrase
   * @returns The network passphrase
   */
  getNetworkPassphrase() {
    return this.networkPassphrase;
  }
}

// Export a singleton instance
export default new StellarService();
