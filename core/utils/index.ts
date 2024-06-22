import { MongoClient, ObjectId } from 'mongodb';
import { Cid, CidObject } from 'dto/user.dto';

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

export async function fetchUserByEmail(email: string) {
  const client = new MongoClient(process.env.URI);
  await client.connect();
  const db = client.db('HRecorder');
  const collection = db.collection('Users');
  const findOneQuery = { email: email };
  try {
    const response = await collection.findOne(findOneQuery);
    await client.close();
    return response;
  } catch (err) {
    await client.close();
    console.error(`Something went wrong trying to find one user: ${err}\n`);
  }
}

export async function setCid(args: CidObject) {
  const client = new MongoClient(process.env.uri);
  await client.connect();
  const database = client.db('HRecorder');
  const collection = database.collection('Users');
  const query = { username: args.user };
  try {
    const result = await collection.findOne(query);
    const cid: Cid = { cid: args.cid, name: args.name };
    const cidList = result.append(cid);
    const findOneResult = await collection.updateOne(query, {
      $set: { cid: cidList },
    });
    if (findOneResult.modifiedCount === 1) {
      console.log(`${args.user} updated with new cid ${args.cid} .\n`);
      return true;
    }
  } catch (err) {
    console.error(
      `Something went wrong trying to update one document: ${err}\n`,
    );
  }
  await client.close();
}

function u8ToHex(u8: number): string {
  return u8.toString(16).padStart(2, '0');
}

/** Ref: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#supported_algorithms */
const supportedAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;

export type SupportedAlgorithm = (typeof supportedAlgorithms)[number];
export type Message = string | Blob | BufferSource;

export async function hexDigest(
  algorithm: SupportedAlgorithm,
  message: Message,
): Promise<string> {
  let buf: BufferSource;
  if (typeof message === 'string') buf = new TextEncoder().encode(message);
  else if (message instanceof Blob) buf = await message.arrayBuffer();
  else buf = message;
  const hash = await window.crypto.subtle.digest(algorithm, buf);
  return [...new Uint8Array(hash)].map(u8ToHex).join('');
}
