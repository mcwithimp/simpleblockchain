import * as CryptoJS from 'crypto-js'
// yarn add --dev @types/elliptic
import { ec as EC } from 'elliptic'
// yarn add --dev @types/bs58
import * as bs58 from 'bs58'
import * as fs from 'fs'
import path from 'path'
import BN from 'bn.js'

export const sha256 = (data: string): string => CryptoJS.SHA256(data).toString()

const ec = new EC('secp256k1');

const toHexBinary = (hexString: string) => CryptoJS.enc.Hex.parse(hexString)
const hexToDecimal = (hexString: string) => new BN(hexString, 'hex').toString(10)

export const pkToPkh = (pk: string): string => {
  // we only care P2PKH which begin with the number 1 
  // and is and identifier of 26-25 alphanumeric characters
  const hash = sha256(toHexBinary(pk)).toString()
  const pubKeyHash = CryptoJS.RIPEMD160(toHexBinary(hash)).toString()
  const prefixed = "00" + pubKeyHash;
  const hashed = sha256(toHexBinary(prefixed))
  const doubleHashed = sha256(toHexBinary(hashed))
  const checksum = doubleHashed.substring(0, 8)
  const rawAddress = prefixed + checksum
  const b58EncodedAddress = bs58.encode(Buffer.from(rawAddress, 'hex'))
  return b58EncodedAddress
}

export const generateKeys = (keyName: string) => {
  const keypath = path.resolve(__dirname, '../client/keys.json')
  // console.log({keypath})
  var savedKeys = JSON.parse(fs.readFileSync(keypath).toString());

  if (savedKeys.find(x => x.alias === keyName) !== undefined) {
    console.log(`The alias '${keyName}' already exists`)
    return false
  }

  const key = ec.genKeyPair();
  const sk = key.getPrivate('hex');
  const pk = key.getPublic('hex');
  const pkh = pkToPkh(pk)
  console.log({ pk, pkh })

  const newKeys = {
    alias: keyName,
    sk,
    pk,
    pkh
  }
  savedKeys.push(newKeys)
  // fs.writeFileSync(keypath, JSON.stringify(savedKeys, null, 2))

  return true
}

export const signTx = (sk: string, txInsOuts: string): string => {
  const dataHash = sha256(txInsOuts);
  const key = ec.keyFromPrivate(sk, "hex")
  const ecdsaSig = key.sign(dataHash, { canonical: true })
  const derSign = ecdsaSig.toDER()
  const signature = String(ecdsaSig.recoveryParam) + Buffer.from(derSign).toString('hex')
  return signature
}

const recoverSignatureParams = (derSignaure: string) => {
  const recoveryParam = parseInt(derSignaure.slice(0, 1))
  const sigBytes = new Uint8Array(Buffer.from(derSignaure.slice(1), 'hex'))
  const sigLength = sigBytes[1]

  if (sigLength !== sigBytes.length - 2) {
    throw new Error("Error: signature length is not valid!")
  }

  const rLength = sigBytes[3]
  const r = new BN(sigBytes.slice(4, 4 + rLength))
  const left = sigBytes.slice(4 + rLength)
  const sLength = left[1]
  const s = new BN(left.slice(2, 2 + sLength))

  return { 
    r, 
    s, 
    recoveryParam
  }
}

const test = {
  "txId": "7f1058266c8326acf223bc8ed79eca6960b792601ae22956024376e3bdcf72dd",
  "txIns": [
    {
      "txOutId": "da2f1e82a300e75433bf416b0765aa29b3129bf68bed3a22f1d163c24c8dbffc",
      "txOutIdx": 0
    },
    {
      "txOutId": "f25cd44a098a0f9622ade2eb7be315b7cf86d23efc7131543cc57e1f61818e91",
      "txOutIdx": 0
    },
    {
      "txOutId": "1bf86b22ce8a58469d90111f1967675b925ab3dcbbdf5b016ec4d68953697b1b",
      "txOutIdx": 0
    },
    {
      "txOutId": "933a8f94ef9c69a87fd2f35a558cae28f84c439c08e2b74423d90b8e81d567b7",
      "txOutIdx": 0
    }
  ],
  "txOuts": [
    {
      "address": "1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX",
      "amount": "153"
    },
    {
      "address": "1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX",
      "amount": 47
    }
  ],
  "signature": "0304402201dc42e53666a813981257bb013999f5e6c8dc59e68c181d140a4a4640c831661022016c6a398a54a5054ee0d82b18de987d31bb953a3ef957278be8010063f343370"
}

export const verifySign = (txId: string, signature: string, address: string): boolean => {
  try {
    const dataHash = sha256(txId)
    const ecdsaSig = recoverSignatureParams(signature)

    const pubKey = ec.recoverPubKey(
      hexToDecimal(dataHash),
      ecdsaSig,
      ecdsaSig.recoveryParam,
      "hex"
    )
    const key = ec.keyFromPublic(pubKey, 'hex')

    const pk = key.getPublic().encode('hex', false)
    const pkh = pkToPkh(pk)
    
    return (
      address == pkh && 
      key.verify(dataHash, ecdsaSig)
    )
  }
  catch(e) {
    console.error(e)
    return false
  }
}

export const verifyAddress = (address: string): boolean => {
  const decoded = bs58.decode(address).toString('hex')
  const pkh = decoded.slice(0, decoded.length - 8)
  const checksum = decoded.slice(decoded.length - 8)

  const hashed = sha256(toHexBinary(pkh))
  const doubleHashed = sha256(toHexBinary(hashed))
  const localChecksum = doubleHashed.substring(0, 8)

  return (checksum == localChecksum)
}