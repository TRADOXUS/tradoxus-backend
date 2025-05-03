import {
  IsNotEmpty,
  IsEthereumAddress,
  Length,
  Matches,
} from "class-validator";

export class RegisterDto {
  @IsNotEmpty({ message: "Nickname is required" })
  @Length(3, 50, { message: "Nickname must be between 3 and 50 characters" })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "Nickname must be alphanumeric with underscores only",
  })
  nickname: string;

  @IsNotEmpty({ message: "Wallet address is required" })
  @IsEthereumAddress({ message: "Invalid Ethereum address format" })
  walletAddress: string;

  @IsNotEmpty({ message: "Signature is required" })
  signature: string;
}

export class VerifyWalletDto {
  @IsNotEmpty({ message: "Wallet address is required" })
  @IsEthereumAddress({ message: "Invalid Ethereum address format" })
  walletAddress: string;

  @IsNotEmpty({ message: "Signature is required" })
  signature: string;
}

export class LoginResponseDto {
  token: string;
  user: {
    id: string;
    nickname: string;
    walletAddress: string;
    email: string | null;
  };
}

export class VerifyResponseDto {
  verified: boolean;
  message?: string;
}
