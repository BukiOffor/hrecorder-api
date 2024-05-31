import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Crypto, Layer1, Layer2, NetworkConfig } from '@internet-of-people/sdk';
import { AuthObject, User, WalletObject } from 'dto/user.dto';
import { MongoClient } from 'mongodb';
import { getUser } from '../utils';
import {
  HydraWallet,
  MorpheusWallet,
  Operation,
  OperationCertificate,
} from 'dto/wallet.dto';
import * as bcrypt from 'bcrypt';
import { WitnessEvent } from 'dto/events.dto';
import { sha256 } from 'js-sha256';
class AdminKey {
  privateKey: Crypto.HydraPrivate;
  address: string;
}

@Injectable()
export class AppService {
  private uri: string = process.env.URI;
  private database_name: string = 'HRecorder';
  private collection_name: string = 'Users';
  private network: NetworkConfig = NetworkConfig.fromUrl(
    'https://dev.explorer.hydraledger.tech',
    4705,
  );
  private password: string = process.env.password;

  private getAdminKey(): AdminKey {
    const hydraPlugin: Crypto.HydraPlugin = this.getHydraPlugin(
      process.env.hyd,
    );
    const privateKey: Crypto.HydraPrivate = hydraPlugin.priv(this.password);
    const address: string = hydraPlugin.pub.key(0).address;
    const admin: AdminKey = {
      privateKey,
      address,
    };
    return admin;
  }

  waitUntil12Sec = (): Promise<void> => {
    return new Promise((resolve) => {
      return setTimeout(resolve, 12 * 1000);
    });
  };
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
        hint: user.password_hint,
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

  async checkIfHashExistsInBlockchain(contentId: string): Promise<boolean> {
    const layer2MorpheusApi = await Layer2.createMorpheusApi(this.network);
    const history = await layer2MorpheusApi.getBeforeProofHistory(contentId);
    console.log(history);
    if (history) {
      return true;
    } else {
      return false;
    }
  }

  async confirmSsiTransaction(txId: string): Promise<boolean> {
    const layer1Api = await Layer1.createApi(this.network);
    const layer2MorpheusApi = await Layer2.createMorpheusApi(this.network);
    const txStatus = await layer1Api.getTxnStatus(txId);
    if (txStatus.get().confirmations > 0) {
      const ssiTxStatus = await layer2MorpheusApi.getTxnStatus(txId);
      const result: boolean = ssiTxStatus.get();
      return result;
    }
  }

  async createBcProof(
    device_id: string,
    video: Express.Multer.File,
  ): Promise<any> {
    const media_hash: string = sha256(video.buffer);
    const operation: Operation = {
      device_id,
      media_hash,
    };
    const beforeProof: string = Crypto.digestJson(operation);
    const isExistent: boolean =
      await this.checkIfHashExistsInBlockchain(beforeProof);
    console.log(isExistent);
    if (isExistent) {
      throw new HttpException(
        'Hash Already Exists on Chain',
        HttpStatus.BAD_REQUEST,
      );
    }
    const morpheusBuilder = new Crypto.MorpheusAssetBuilder();
    morpheusBuilder.addRegisterBeforeProof(beforeProof);
    const morpheusAsset = morpheusBuilder.build();
    const layer1Api = await Layer1.createApi(this.network);
    const admin: AdminKey = this.getAdminKey();
    const txId = await layer1Api.sendMorpheusTx(
      admin.address,
      morpheusAsset,
      admin.privateKey,
    );
    // Wait for the Block confirmation time
    await this.waitUntil12Sec();
    const response: boolean = await this.confirmSsiTransaction(txId);
    if (response) {
      const certificate: OperationCertificate = {
        device_id,
        media_hash,
        tx_id: txId,
        bc_proof: beforeProof,
      };
      return certificate;
    }
  }
  async createWitnessRequest(data: WitnessEvent): Promise<string> {
    const morpheus = this.getMorpheusPlugin(data.vault);
    const did: Crypto.Did = morpheus.pub.personas.did(0);
    const keyId: Crypto.KeyId = did.defaultKeyId();
    const Kpr: Crypto.MorpheusPrivate = morpheus.priv(data.password);
    try {
      console.log('Creating Witness Request');
      const response = Kpr.signWitnessRequest(keyId, data.statement);
      return JSON.stringify(response);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Could not sign witness request ');
    }
  }
}
