mod handlers;
pub mod models;
use actix_web::web::Data;
use actix_web::{HttpServer, App};
use handlers::api::{
    generate_phrase,get_wallet,generate_transaction,
    sign_did_statement,
    generate_did_by_morpheus,sign_witness_statement,
    verify_signed_statement,generate_nonce,get_morpheus_vault,
    get_hyd_vault, get_new_acc_on_vault,
    validate_statement_with_did,create_user,
};
use handlers::types::MongoRepo;
use log::LevelFilter;




#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::builder().filter_level(LevelFilter::Info).init();
    log::info!("server initialized and running at port 8088");
    log::info!("Running server at http://127.0.0.1:8088");
    let db = MongoRepo::init().await;
    let db_data = Data::new(db);
    HttpServer::new(move || {        
        App::new()  
            .app_data(db_data.clone())  
            .service(generate_phrase)
            .service(get_wallet)
            .service(generate_transaction)
            .service(generate_did_by_morpheus)  
            .service(sign_did_statement)
            .service(sign_witness_statement)
            .service(verify_signed_statement)
            .service(generate_nonce)
            .service(get_morpheus_vault)
            .service(get_hyd_vault)
            .service(get_new_acc_on_vault)
            .service(validate_statement_with_did)
            .service(create_user)        
        
        })
        .bind("127.0.0.1:8088")?
        .run()
        .await
}
