import { MongoClient, ObjectId } from 'mongodb';

export async function getUser(id) {
  const client = new MongoClient(process.env.URI);
  await client.connect();
  const db = client.db('HRecorder');
  const collection = db.collection('Users');
  const findOneQuery = { _id: new ObjectId(id) };
  try {
    const response = await collection.findOne(findOneQuery);
    await client.close();
    return response;
  } catch (err) {
    await client.close();
    console.error(`Something went wrong trying to find one user: ${err}\n`);
  }
}
