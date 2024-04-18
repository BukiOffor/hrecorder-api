import { Injectable } from '@nestjs/common';
import {
  Crypto,
  Layer1,
  Layer2,
  Network,
  NetworkConfig,
} from '@internet-of-people/sdk';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getMorpheusPlugin(vault_data: string): Crypto.MorpheusPlugin {
    const vault_json = JSON.parse(vault_data);
    const vault = Crypto.Vault.load(vault_json);
    //Crypto.MorpheusPlugin.init(vault, password);
    const morpheusPlugin = Crypto.MorpheusPlugin.get(vault);
    // Select the first DID
    const did = morpheusPlugin.pub.personas.did(0);
    console.log('Using DID: ', did.toString());
    return morpheusPlugin;
  }

  getHydraPlugin(vault_data: string, password: string): Crypto.HydraPlugin {
    //const network = Network.Testnet;
    const vault_json = JSON.parse(vault_data);
    const vault = Crypto.Vault.load(vault_json);
    const parameters = new Crypto.HydraParameters(Crypto.Coin.Hydra.Testnet, 0);
    //Crypto.HydraPlugin.init(vault, password, parameters);
    const hydraPlugin = Crypto.HydraPlugin.get(vault, parameters);
    const senderPrivate = hydraPlugin.priv(password);
    const senderAddress = hydraPlugin.pub.key(0).address;
    console.log('Sender address: ', senderAddress);
    return hydraPlugin;
  }

  generate_phrase(): string {
    const phrase = new Crypto.Bip39('en').generate().phrase;
    return phrase;
  }

  createHydVault(phrase: string, password: string): string {
    const vault = Crypto.Vault.create(phrase, '', password);
    const parameters = new Crypto.HydraParameters(Crypto.Coin.Hydra.Testnet, 0);
    // initialize Hydra Vault
    Crypto.HydraPlugin.init(vault, password, parameters);
    const hyd_vault = JSON.stringify(vault.save());
    return hyd_vault;
  }

  createMorpheusVault(phrase: string, password: string): string {
    const vault = Crypto.Vault.create(phrase, '', password);
    Crypto.MorpheusPlugin.init(vault, password);
    const morpheus_vault = JSON.stringify(vault.save());
    return morpheus_vault;
  }
}
