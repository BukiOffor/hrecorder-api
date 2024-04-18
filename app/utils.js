// Import the necessary modules from our SDK
import { Crypto, Layer1, Layer2, Network, NetworkConfig } from '@internet-of-people/sdk';


async function getMorpheusPlugin(vault_data,password){
    let vault_json = JSON.parse(vault_data);
    let vault = Crypto.Vault.load(vault_json)
    //Crypto.MorpheusPlugin.init(vault, password);
    const morpheusPlugin = Crypto.MorpheusPlugin.get(vault);
    // Select the first DID
    const did = morpheusPlugin.pub.personas.did(0);
    console.log("Using DID: ", did.toString());
    return morpheusPlugin;
}


async function getHydraPlugin(vault_data,password){
    const network = Network.Testnet;
    let vault_json = JSON.parse(vault_data);
    let vault = Crypto.Vault.load(vault_json);
    const parameters = new Crypto.HydraParameters(
        Crypto.Coin.Hydra.Testnet,
        0
      );
    //Crypto.HydraPlugin.init(vault, password, parameters);
    const hydraPlugin = Crypto.HydraPlugin.get(vault, parameters);
    const senderPrivate = hydraPlugin.priv(password);
    const senderAddress = hydraPlugin.pub.key(0).address;
    console.log("Sender address: ", senderAddress);
    return hydraPlugin;
}


function generate_phrase(){
    const phrase = new Crypto.Bip39('en').generate().phrase;
    return phrase;
}


async function createHydVault(phrase,password){
    const vault = Crypto.Vault.create(phrase,'',password);
    const parameters = new Crypto.HydraParameters(Crypto.Coin.Hydra.Testnet,0);
    // initialize Hydra Vault
    Crypto.HydraPlugin.init(vault, password, parameters);
    let hyd_vault = JSON.stringify(vault.save());
    return hyd_vault;    
}


async function createMorpheusVault(phrase,password){
    const vault = Crypto.Vault.create(phrase,"",password);
    Crypto.MorpheusPlugin.init(vault, password);
    let morpheus_vault = JSON.stringify(vault.save());
    return morpheus_vault;
}



const password = 'poppins';
let hyd_v = "{\n  \"encryptedSeed\": \"ugy5aoxKELmkN2jyiIJv4kwJVV96dZhaF1gVlug1Nx5MB2ZKsCUb4fz0bR7XGgxF5ICIbmCnZI0THBaQmVz58yYegb2GKJCS9pPYLEQ6hVz7SGv719_Y4E8NdGJmsxjGYZsSXxYWDT-I\",\n  \"plugins\": [\n    {\n      \"pluginName\": \"Hydra\",\n      \"publicState\": {\n        \"xpub\": \"hydtVxFicd5g6PvgiyG58wYSUV7ECaPPtz361Mt4vvSGp8NqNYytsrfudqFydnMwvQ4ojTGccfRrh7RRvWAn2dJnvCD1R8PkSNCDZhDbmPecbKHZ\",\n        \"receiveKeys\": 1,\n        \"changeKeys\": 0\n      },\n      \"parameters\": {\n        \"network\": \"HYD testnet\",\n        \"account\": 0\n      }\n    }\n  ]\n}"
let morpheus_v = "{\n  \"encryptedSeed\": \"umZYhtcky_-5DNbK54qzC5m2V-uKLDVEwT-f_3-PJvkIbOykHBsg45dQkjJRl-COs2o9oLGGHieYKqssh9UnDy_r9ii6mc-UsKuUWdwfBywv48ikHHF4f05fORIy8fNQ4JfrDFj5jJ9o\",\n  \"plugins\": [\n    {\n      \"pluginName\": \"Morpheus\",\n      \"parameters\": {},\n      \"publicState\": {\n        \"personas\": [\n          \"pezEPVBRHyNaM5FR9PCHzbQdakTNpMT5jTXqVEcr3Je6mTS\"\n        ]\n      }\n    }\n  ]\n}"

getMorpheusPlugin(hyd_v,password).then((res) => {
    console.log("Response: ", res);

}).catch((err) => {
    console.log(err);
});