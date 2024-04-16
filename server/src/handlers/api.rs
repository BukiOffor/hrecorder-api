use actix_web::{
    get, post,
    web::{Data, Path, Json, ReqData},
    HttpResponse, Responder,
};
use actix_web_httpauth::extractors::basic::BasicAuth;
use argonautica::{Hasher, Verifier};
use hmac::{Hmac, Mac};
use jwt::SignWithKey;
use sha2::Sha256;
use crate::handlers::types::MorpheusVault;
use crate::handlers::{utils, types::{
    GetWallet,GenerateTransaction,SignDidWallet,
     Wallet, SignWitnessStatement,WitnessStatement,
     AccountVault, DidStatement
    }} ;
use crate::{models::user::User, handlers::types::MongoRepo, TokenClaims};



#[get("/api/generate_phrase")]
pub async fn generate_phrase() -> impl Responder {
    let phrase = utils::generate_phrase().unwrap();
    HttpResponse::Ok().json(phrase)
}

#[post("/api/get_wallet")]
pub async fn get_wallet(
    body: Json<GetWallet>,
) -> impl Responder {
    let account = body.account.parse::<i32>().unwrap();
    let data = body.0.data;
    let wallet = utils::get_wallet(data, account).unwrap();
    HttpResponse::Ok().json(wallet)
}

#[post("/api/generate_transaction")]
pub async fn generate_transaction(
    body: Json<GenerateTransaction>,
) -> impl Responder {
    let req = body.0;
    let transaction = utils::generate_transaction(
        req.data, req.receiver, req.amount,
        req.nonce, req.password, req.account
    ).unwrap();
    HttpResponse::Ok().json(transaction)
}

#[post("/api/sign_did_statement")]
pub async fn sign_did_statement(
    body: Json<SignDidWallet>,
) -> impl Responder {
    let req = body.0;
    let (signature, public_key) = utils::sign_did_statement(
        req.vault, req.password, &req.data
    ).unwrap();
    HttpResponse::Ok().json(format!("signature: {signature}, public_key:{public_key}"))
}

#[post("/api/generate_did_by_morpheus")]
pub async fn generate_did_by_morpheus(
    body: Json<Wallet>,
) -> impl Responder {
    let req = body.0;
    let did = utils::generate_did_by_morpheus(
        req.vault, req.password
    ).unwrap();
    //HttpResponse::Ok().json(format!("did :{did}"))
    HttpResponse::Ok().json(did)
}


#[post("/api/sign_witness_statement")]
pub async fn sign_witness_statement(
    body: Json<SignWitnessStatement>,
) -> impl Responder {
    let req = body.0;
    let signature = utils::sign_witness_statement(
        req.vault, req.password, &req.data
    ).unwrap();
    HttpResponse::Ok().json(signature)
}


#[post("/api/verify_signed_statement")]
pub async fn verify_signed_statement(
    body: Json<WitnessStatement>,
) -> impl Responder {
    let req = body.0;
    let result = utils::verify_signed_statement(&req.data).unwrap();
    HttpResponse::Ok().json(result)
}

#[get("/api/generate_nonce")]
pub async fn generate_nonce() -> impl Responder {
    let nonce = utils::generate_nonce().unwrap();
    HttpResponse::Ok().json(nonce)
}

#[post("/api/get_morpheus_vault")]
pub async fn get_morpheus_vault(
    body: Json<MorpheusVault>, 
) -> impl Responder {
    let req = body.0;
    let morpheus_vault = utils::get_morpheus_vault(req.phrase, req.password).unwrap();
    HttpResponse::Ok().json(morpheus_vault)
}

#[post("/api/get_hyd_vault")]
pub async fn get_hyd_vault(
    body: Json<MorpheusVault>, 
) -> impl Responder {
    let req = body.0;
    let hyd_vault = utils::get_hyd_vault(req.phrase, req.password).unwrap();
    HttpResponse::Ok().json(hyd_vault)
}

#[post("/api/get_new_acc_on_vault")]
pub async fn get_new_acc_on_vault(
    body: Json<AccountVault>, 
) -> impl Responder {
    let req = body.0;
    let account = utils::get_new_acc_on_vault(req.vault, req.password, req.account).unwrap();
    HttpResponse::Ok().json(account)
}


#[post("/api/validate_statement_with_did")]

pub async fn validate_statement_with_did(
    body: Json<DidStatement>, 

) -> impl Responder {
    let req = body.0;
    let result = utils::validate_statement_with_did(&req.data, &req.doc).unwrap();
    HttpResponse::Ok().json(result)
}


#[post("/user")]
pub async fn create_user(db: Data<MongoRepo>, new_user: Json<User>) -> HttpResponse {
    let hash_secret = std::env::var("HASH_SECRET").expect("HASH_SECRET must be set!");
    let mut hasher = Hasher::default();
    let hash = hasher
        .with_password(new_user.password.to_owned())
        .with_secret_key(hash_secret)
        .hash()
        .unwrap();
    let mnemonic = utils::generate_phrase().unwrap();
    let key = std::env::var("KEY").expect("HASH_SECRET must be set!");
    let morpheus_vault = utils::get_morpheus_vault(mnemonic.to_owned(), key.to_owned())
        .expect("Morpheus Vault could not be initialised");
    let hyd_vault = utils::get_hyd_vault(mnemonic.to_string(), key.to_owned())
        .expect("Hyd Vault could not be init");
    let did = utils::generate_did_by_morpheus(morpheus_vault.to_owned(), key.to_owned())
        .expect("Did could not be generated");
    let wallet_address = utils::get_wallet(hyd_vault.to_owned(), 0)
        .expect("Address could not be gotten");


    let data = User {
        id: None,
            first_name: new_user.first_name.to_owned(),
            last_name: new_user.last_name.to_owned(),
            email: new_user.email.to_owned(),
            username: new_user.username.to_owned(),
            password: hash.to_owned(),
            dob: new_user.dob.to_owned(),
            address: new_user.address.to_owned(),
            city: new_user.city.to_owned(),
            zipcode: new_user.zipcode.to_owned(),
            country: new_user.country.to_owned(),
            wallet_address,
            did
    };
    let user_detail = db.create_user(data).await;
    match user_detail {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}

#[get("/user/{id}")]
pub async fn get_user(db: Data<MongoRepo>, path: Path<String>) -> HttpResponse {
    let id = path.into_inner();
    if id.is_empty() {
        return HttpResponse::BadRequest().body("invalid ID");
    }
    let user_detail = db.get_user(&id).await;
    match user_detail {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}