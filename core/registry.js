/* eslint-disable @typescript-eslint/no-unused-vars */
const witness_request = {
  claim: {
    subject: 'did:morpheus:ezFoo', //A DID of the entity (persona, company, etc.) the claim is about
    content: {
      required: ['hash', 'description', 'device', 'time'],
      hash: {
        nonce: 'zBASE58',
        value: 'ezbeWGSY2dqcUBqT8K7R14xrezbeWGSY2dqcUBqT8K7R14xr',
      },
      description: {
        nonce: 'ABCD',
        value:
          'An event that occured at Manchester Uniteds match against Chelsea',
      },
      device: {
        ip: {
          nonce: '09op0u7659765',
          value: '193.265.0.22 ',
        },
        imei: {
          nonce: '09op0u7659765',
          value: '165848765e567489040398 ',
        },
        mac: {
          nonce: '09op0u7659765',
          value: '1c:3b:f3:07:f8:34',
        },
      },
      time: {
        nonce: '8e7a6790d678387',
        value: '9008767654321 ',
      },
      location: {
        nonce: 'ABCD',
        value: '72 Manchester Road, Manchester',
      },
    },
  },
  claimant: 'did:morpheus:ezCLAIMANT#5',
  processId: 'cjuPROCESS',
  evidence: { file: 'https://fs3bucket.io/where_the_video_is_stored' },
  nonce: 'uBIG_BASE64',
};
