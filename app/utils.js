// Import the necessary modules from our SDK
const { Crypto, Layer1, Layer2, Network, NetworkConfig } = require('@internet-of-people/sdk');


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
    const network = Network.Devnet;
    let vault_json = JSON.parse(vault_data);
    let vault = Crypto.Vault.load(vault_json);
    const parameters = new Crypto.HydraParameters(
        Crypto.Coin.Hydra.Devnet,
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
    const parameters = new Crypto.HydraParameters(Crypto.Coin.Hydra.Devnet,0);
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



let hy =  "{\"encryptedSeed\":\"uhYKsgAUwyqZoWCWIAYbD6o1M9EPXBG9YMQi5DQi-zPh1yv5VDiHVWnA3IXf0xAaEx2eh8ybjGVgQAY_s1NG8XhQsYkSBTMbN-6_QxPsihX7rYzVXd8h0R0Oa0JbaFddhvOm8Of7iDS4\",\"plugins\":[{\"pluginName\":\"Hydra\",\"publicState\":{\"xpub\":\"hyddW4BHhYssWNSbUKamHCQLL9XvQq95VKu4zpAinnxQeapauinbobWypU8xt2RaZJdPXhoiSMs9MNo8VRvfhRKsXz5bTDTLM2GbbUQfLRMZKWW6\",\"receiveKeys\":1,\"changeKeys\":0},\"parameters\":{\"network\":\"HYD devnet\",\"account\":0}}]}"
const mo =  "{\"encryptedSeed\":\"uiZZp4-sxAH-35RdlpakFiEbemib96JGJ6bUO8oNpM45imbkrkvsud96f8H93URr7JCAFakJ4rFRyZELQsOCJx8sV_WYWkIzgzwq0l8lfuftBOwhRfNNPPJZ2inVpVA1OkrzapDYA2zY\",\"plugins\":[{\"pluginName\":\"Morpheus\",\"parameters\":{},\"publicState\":{\"personas\":[\"pez4ZMMRisFts2hiCLyQebonmGTNb8eSAPwsNrrKi3euojD\"]}}]}"

getMorpheusPlugin(mo,"").then((res) => {
    console.log("Response: ", res);
    
}).catch((err) => {
    console.log(err);
});

getHydraPlugin(hy,"").then((res) => {
    console.log("Response: ", res);
    
}).catch((err) => {
    console.log(err);
});