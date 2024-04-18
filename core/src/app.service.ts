import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Crypto,
  Layer1,
  Layer2,
  Network,
  NetworkConfig,
} from '@internet-of-people/sdk';
import { AuthObject, User, WalletObject } from 'dto/user.dto';
import { MongoClient } from 'mongodb';
import { getUser } from '../utils';
import { HydraWallet, MorpheusWallet } from 'dto/wallet.dto';
import * as bcrypt from 'bcrypt';
import { WitnessEvent } from 'dto/events.dto';
@Injectable()
export class AppService {
  private uri: string = process.env.URI;
  private database_name: string = 'HRecorder';
  private collection_name: string = 'Users';

  getHello(): string {
    return process.env.URI;
  }

  getMorpheusPlugin(vault_data: string): Crypto.MorpheusPlugin {
    const vault_json = JSON.parse(vault_data);
    const vault = Crypto.Vault.load(vault_json);
    const morpheusPlugin = Crypto.MorpheusPlugin.get(vault);
    return morpheusPlugin;
  }

  getHydraPlugin(vault_data: string): Crypto.HydraPlugin {
    const vault_json = JSON.parse(vault_data);
    const vault = Crypto.Vault.load(vault_json);
    const parameters = new Crypto.HydraParameters(Crypto.Coin.Hydra.Testnet, 0);
    const hydraPlugin = Crypto.HydraPlugin.get(vault, parameters);
    return hydraPlugin;
  }

  generate_phrase(): string {
    const phrase = new Crypto.Bip39('en').generate().phrase;
    return phrase;
  }

  createHydVault(phrase: string, password: string): HydraWallet {
    const vault = Crypto.Vault.create(phrase, '', password);
    const parameters = new Crypto.HydraParameters(Crypto.Coin.Hydra.Testnet, 0);
    // initialize Hydra Vault
    Crypto.HydraPlugin.init(vault, password, parameters);
    const hydraPlugin = Crypto.HydraPlugin.get(vault, parameters);
    const address = hydraPlugin.pub.key(0).address;
    const hyd_vault = JSON.stringify(vault.save());
    const hydra: HydraWallet = {
      vault: hyd_vault,
      address,
    };
    return hydra;
  }

  createMorpheusVault(phrase: string, password: string): MorpheusWallet {
    const vault = Crypto.Vault.create(phrase, '', password);
    Crypto.MorpheusPlugin.init(vault, password);
    const morpheus_vault: string = JSON.stringify(vault.save());
    const morpheusPlugin = Crypto.MorpheusPlugin.get(vault);
    const did = morpheusPlugin.pub.personas.did(0);
    const morpheus: MorpheusWallet = {
      vault: morpheus_vault,
      did: did.toString(),
    };
    return morpheus;
  }

  async createUser(user: User): Promise<WalletObject> {
    const client = new MongoClient(this.uri);
    await client.connect();
    const db = client.db(this.database_name);
    const collection = db.collection(this.collection_name);
    const mnemonic: string = this.generate_phrase();
    const password = user.password;
    const hyd: HydraWallet = this.createHydVault(mnemonic, password);
    const morpheus: MorpheusWallet = this.createMorpheusVault(
      mnemonic,
      password,
    );

    try {
      user.wallet = hyd.address;
      user.did = morpheus.did;
      user.password = await bcrypt.hash(password, 10);
      const response = await collection.insertOne(user);
      console.log(`${response.insertedId} successfully inserted.\n`);
      const id = response.insertedId;
      const data = {
        id: id,
        hyd_vault: hyd.vault,
        morpheus_vault: morpheus.vault,
        wallet: hyd.address,
        did: morpheus.did,
      };
      const wallet_object: WalletObject = {
        data,
        mnemonic,
      };
      await client.close();
      return wallet_object;
    } catch (err) {
      await client.close();
      console.error(
        `Something went wrong trying to insert the new documents: ${err}\n`,
      );
      throw new InternalServerErrorException('Something Went Wrong ');
    }
  }

  async basicAuth(auth: AuthObject): Promise<boolean> {
    const user = await getUser(auth.id);
    const isMatch = await bcrypt.compare(auth.password, user.password);
    return isMatch;
  }

  async signWitnessStatement(data: WitnessEvent): Promise<string> {
    const morpheus = this.getMorpheusPlugin(data.vault);
    const did: Crypto.Did = morpheus.pub.personas.did(0);
    const keyId: Crypto.KeyId = did.defaultKeyId();
    const Kpr: Crypto.MorpheusPrivate = morpheus.priv(data.password);
    //const statement = JSON.parse(data.statement);
    try {
      console.log('Signing Witness Statement');
      const response = Kpr.signWitnessStatement(keyId, data.statement);
      return JSON.stringify(response);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Something Went Wrong ');
    }
  }
}
