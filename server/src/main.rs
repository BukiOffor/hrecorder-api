mod handlers;
pub mod models;
use actix_web::{
    dev::ServiceRequest,
    error::Error,
    web::{self, Data},
    App, HttpMessage, HttpServer,
};
use handlers::api::{
    generate_phrase,get_wallet,generate_transaction,
    sign_did_statement,
    generate_did_by_morpheus,sign_witness_statement,
    verify_signed_statement,generate_nonce,get_morpheus_vault,
    get_hyd_vault,validate_statement_with_did,create_user,
};
use handlers::types::MongoRepo;
use log::LevelFilter;

use actix_web_httpauth::{
    extractors::{
        bearer::{self, BearerAuth},
        AuthenticationError,
    },
    middleware::HttpAuthentication,
};
use hmac::{Hmac, Mac};
use jwt::VerifyWithKey;
use serde::{Deserialize, Serialize};
use sha2::Sha256;


#[derive(Serialize, Deserialize, Clone)]
pub struct TokenClaims {
    id: i32,
}



async fn validator(
    req: ServiceRequest,
    credentials: BearerAuth,
) -> Result<ServiceRequest, (Error, ServiceRequest)> {
    let jwt_secret: String = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set!");
    let key: Hmac<Sha256> = Hmac::new_from_slice(jwt_secret.as_bytes()).unwrap();
    let token_string = credentials.token();

    let claims: Result<TokenClaims, &str> = token_string
        .verify_with_key(&key)
        .map_err(|_| "Invalid token");

    match claims {
        Ok(value) => {
            req.extensions_mut().insert(value);
            Ok(req)
        }
        Err(_) => {
            let config = req
                .app_data::<bearer::Config>()
                .cloned()
                .unwrap_or_default()
                .scope("");

            Err((AuthenticationError::from(config).into(), req))
        }
    }
}





#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::builder().filter_level(LevelFilter::Info).init();
    log::info!("server initialized and running at port 8088");
    log::info!("Running server at http://127.0.0.1:8088");
    
    let db = MongoRepo::init().await;
    let db_data = Data::new(db);

    HttpServer::new(move || {    
        let bearer_middleware = HttpAuthentication::bearer(validator);    
        App::new()  
            .app_data(db_data.clone())  
            .service(generate_phrase)
            .service(get_wallet)
            .service(generate_transaction)
            .service(verify_signed_statement)
            .service(generate_nonce)
            .service(create_user)
            .service(
                web::scope("")
                    .wrap(bearer_middleware)
                    .service(sign_did_statement)
                    .service(sign_witness_statement)
                    .service(get_morpheus_vault)
                    .service(get_hyd_vault)
                    .service(validate_statement_with_did)
                    .service(generate_did_by_morpheus)  




                )        
        
        })
        .bind("127.0.0.1:8088")?
        .run()
        .await
}
