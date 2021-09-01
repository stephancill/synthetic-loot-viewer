const ethers = require("ethers")

async function createRequest(fromAccount, toAddress, efd) {
  const fromAddress = await fromAccount.getAddress()
  var hash = await efd.hashRequest(fromAddress, toAddress)
  const signature = await fromAccount.signMessage(ethers.utils.arrayify(hash))
  return signature
}

async function acceptRequest(fromAddress, toAccount, requestSignature, efd) {
  const toAddress = await toAccount.getAddress()
  var hash = await efd.hashAccept(fromAddress, toAddress, ethers.utils.arrayify(requestSignature))
  const signature = await toAccount.signMessage(ethers.utils.arrayify(hash))
  return signature
}

// TODO: Test these methods
async function createInviteObject(fromAccount, toAddress, efd) {
  const fromSignature = await createRequest(fromAccount, toAddress, efd)
  const fromAddress = await fromAccount.getAddress()
  return {
    fromAddress,
    toAddress,
    fromSignature
  }
}

async function createConfirmableObject(inviteObject, toAccount, efd) {
  const toSignature = await acceptRequest(inviteObject.fromAddress, toAccount, inviteObject.fromSignature, efd)
  return {
    ...inviteObject,
    toSignature
  }
}

function encodeObject(obj) {
  const objString = JSON.stringify(obj)
  const encodedString = btoa(objString)
  return encodedString
}

function decodeEncodedObject(encodedObj) {
  const objString = atob(encodedObj)
  const obj = JSON.parse(objString)
  return obj
}

module.exports = {acceptRequest, createRequest, createInviteObject, createConfirmableObject, encodeObject, decodeEncodedObject}