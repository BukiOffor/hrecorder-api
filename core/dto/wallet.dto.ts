export class MorpheusWallet {
  vault: string;
  did: string;
}

export class HydraWallet {
  vault: string;
  address: string;
}

export class Device {
  id: string;
}

export class Operation {
  device_id: string;
  media_hash: string;
}

export class OperationCertificate extends Operation {
  tx_id: string;
  bc_proof: string;
}
