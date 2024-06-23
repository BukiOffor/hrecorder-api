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
  cid: Array<Cid>;
}

export class WalletObject {
  data: object;
  mnemonic: string;
}

export class AuthObject {
  id: string;
  password: string;
}

export class Cid {
  cid: string;
  name: string;
}

export class CidObject extends Cid {
  username: string;
}
