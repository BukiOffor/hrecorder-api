use serde::{Deserialize, Serialize};
use validator::Validate;
use std::env;
extern crate dotenv;
use dotenv::dotenv;

use mongodb::{bson::{doc, extjson::de::Error, oid::ObjectId},
        results::InsertOneResult,
        Client, Collection,
    };
use crate::models::user::User;



#[derive(Validate, Deserialize, Serialize, )]
pub struct GetWallet {
    pub data: String,
    pub account: String
}

#[derive(Validate, Deserialize, Serialize, )]
pub struct GenerateTransaction{
    pub data: String,
    pub receiver: String,
    pub amount: u64,
    pub nonce: u64,
    pub password: String,
    pub account: i32,
}
#[derive(Validate, Deserialize, Serialize, )]
pub struct SignDidWallet {
    pub vault: String,
    pub password: String,
    pub data: Vec<u8>
}

#[derive(Validate, Deserialize, Serialize)]
pub struct Wallet {
    pub vault: String,
    pub password: String,
}


#[derive(Validate, Deserialize, Serialize)]
pub struct SignWitnessStatement {
    pub vault: String,
    pub password: String,
    pub data: String
}


#[derive(Validate, Deserialize, Serialize)]
pub struct WitnessStatement {
    pub data: String
}


#[derive(Validate, Deserialize, Serialize)]
pub struct MorpheusVault {
    pub phrase: String,
    pub password: String,
}


#[derive(Validate, Deserialize, Serialize, )]
pub struct AccountVault {
    pub vault: String,
    pub password: String,
    pub account: i32
}


#[derive(Validate, Deserialize, Serialize, )]
pub struct DidStatement {
    pub data: String,
    pub doc: String,
}
#[derive(Validate)]
pub struct MongoRepo {
    col: Collection<User>,
}

impl MongoRepo {
    pub async fn init() -> Self {
        dotenv().ok();
        let uri = match env::var("url") {
            Ok(v) => v.to_string(),
            Err(_) => format!("Error loading env variable"),
        };
        let client = Client::with_uri_str(uri)
            .await
            .expect("Error connecting to MongoDB");
        let db = client.database("HRecorder");
        let col: Collection<User> = db.collection("Users");
        MongoRepo { col }
    }

    pub async fn create_user(&self, new_user: User) -> Result<InsertOneResult, Error> {
        let new_doc = User {
            id: None,
            first_name: new_user.first_name,
            last_name: new_user.last_name,
            email: new_user.email,
            username: new_user.username,
            password: new_user.password,
            dob: new_user.dob,
            address: new_user.address,
            city: new_user.city,
            zipcode: new_user.zipcode,
            country: new_user.country,
            wallet_address: new_user.wallet_address,
            did: new_user.did
        };
        let user = self
            .col
            .insert_one(new_doc, None)
            .await
            .ok()
            .expect("Error creating user");
        Ok(user)
    }

    pub async fn get_user(&self, id: &String) -> Result<User, Error> {
        let obj_id = ObjectId::parse_str(id).unwrap();
        let filter = doc! {"_id": obj_id};
        let user_detail = self
            .col
            .find_one(filter, None)
            .await
            .ok()
            .expect("Error getting user's detail");
        Ok(user_detail.unwrap())
    }
}
