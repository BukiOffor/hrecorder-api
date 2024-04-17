use mongodb::bson::oid::ObjectId;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub first_name: String,
    pub last_name: String,
    pub username: String,
    pub email: String,
    pub password: String,
    pub password_hint: String,
    pub dob: Option<String>,
    pub address: Option<String>,
    pub city : Option<String>,
    pub zipcode : Option<String>,
    pub country: Option<String>,
    pub wallet_address: Option<String>,
    pub did: Option<String>
}



