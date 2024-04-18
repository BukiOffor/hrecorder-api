export class User {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_hint: string;
  dob?: string;
  address?: string;
  state?: string;
  zip?: string;
  country?: string;
  city?: string;
  did?: string;
  wallet?: string;
}

export class WalletObject {
  data: object;
  mnemonic: string;
}
