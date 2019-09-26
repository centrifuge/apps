import { unflatten, unflattenRaw,flatten } from '../custom-attributes';

describe('Custom Attributes', () => {

  const attr = {
    'test.amount': {
      key:
        '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
      type: 'bytes',
      value:
        '0xf7d228ac54b71f4954b69310a946acbd5fd23dc00ebb25a61010554e2f2aa962',
    },
    'test.date': {
      key:
        '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
      type: 'bytes',
      value:
        '0xf7d228ac54b71f4954b69310a946acbd5fd23dc00ebb25a61010554e2f2aa962',
    },
    funding_agreement:
      {
        key:
          '0x1ce137e03b3981e8db640fe12b33fe5fe445155f1c2eb9f22baa2ae3df49bd38',
        type: 'integer',
        value: '0',
      },
    'funding_agreement[0].agreement_id':
      {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'bytes',
        value:
          '0xf7d228ac54b71f4954b69310a946acbd5fd23dc00ebb25a61010554e2f2aa962',
      },
    'funding_agreement[0].amount':
      {
        key:
          '0x38ed5f156745e6b3ecf3cbf732b76d4119c4ddf9c074b51d328d42569b713171',
        type: 'decimal',
        value: '1990.56',
      },
    'funding_agreement[0].apr':
      {
        key:
          '0x094d09cadf3e998f149fa9334f6d5529f574d86f421c02baa191e195e9579a20',
        type: 'string',
        value: '0.05',
      },
    'funding_agreement[0].borrower_id':
      {
        key:
          '0xba27f11f43e661412a7f99e46c40495883188004dc9eb0058512fee7a4f9c227',
        type: 'bytes',
        value: '0x5f2bbfcf948a0083bbe77c0ad97a64142d6b1d48',
      },
    'funding_agreement[0].currency':
      {
        key:
          '0x76b167150821030a27099f3a7fbc1e8d9ad0507c6ceb5b587ec9bce8db700d2b',
        type: 'string',
        value: 'USD',
      },
    'funding_agreement[0].days':
      {
        key:
          '0xc52d7fa32b32b65473530f3c70ce6570726a6b7374723fe60ee55df368900c1e',
        type: 'integer',
        value: '34',
      },
    'funding_agreement[0].fee':
      {
        key:
          '0x1d9ba21ec138d66900e8fb2af32da4654284d885a6b82e12062cbcbb14d51314',
        type: 'decimal',
        value: '0',
      },
    'funding_agreement[0].funder_id':
      {
        key:
          '0xd0134f74e2b1a6b10581035fc5289d5566dc51353ccebc3693cf3b5f251fef9e',
        type: 'bytes',
        value: '0x7c907d059737c821067a5e0beba19ee9242a45cb',
      },
    'funding_agreement[0].nft_address':
      {
        key:
          '0xaca17fa02ad44c4a982f320377cb289985f6eb5d1e9ea80118bc9721da732461',
        type: 'bytes',
        value:
          '0x4cec515e900f4e04eb06cfce64348c605b4439c941f173140f0dc178e8f24d74',
      },
    'funding_agreement[0].repayment_amount':
      {
        key:
          '0x028568263c48c17b3276c92e2eeb82745056f4527de87dce01bbc4718ffdd1f4',
        type: 'decimal',
        value: '2000',
      },
    'funding_agreement[0].repayment_due_date':
      {
        key:
          '0xdad32b28d3934a76fc119f48a47842bcba9168822df33eed16cde456e5e0468f',
        type: 'timestamp',
        value: '2019-08-10T12:43:52Z',
      },
    'funding_agreement[0].signatures':
      {
        key:
          '0x3793e4c50c779a5d95ad944bf2f5ef503c25c3bfd7c2dded7bc8d26cf07c0a89',
        type: 'integer',
        value: '0',
      },
    'funding_agreement[0].signatures[0]':
      {
        key:
          '0x51be0f0b963b709925026915cb1149c3c9bcd8caf2d947c4b8373530e0b9c595',
        type: 'signed',
        value: '0x7C907D059737c821067a5e0bEbA19EE9242a45cb',
      },
    transfer_details:
      {
        key:
          '0x4969ecc111902be33769deebd71d64a93871fee676949c0cdb3f90c2a5b43e0c',
        type: 'integer',
        value: '1',
      },
    'transfer_details[0].amount':
      {
        key:
          '0xdb1f17cfb5a17637ddd98b5f48a2af4ff752957129feb6c1c20aefb78798f0db',
        type: 'decimal',
        value: '200',
      },
    'transfer_details[0].currency':
      {
        key:
          '0x5dbdb4d9c58897b25fefa1215bfad9689ea163039c4bd950c572963770efc789',
        type: 'string',
        value: 'DAI',
      },
    'transfer_details[0].recipient_id':
      {
        key:
          '0x426b3c423311b87d506c90aedff0327b5d36934e4faa06c218de69f33e188561',
        type: 'bytes',
        value: '0x5f2bbfcf948a0083bbe77c0ad97a64142d6b1d48',
      },
    'transfer_details[0].sender_id':
      {
        key:
          '0x3b9ba4dc1805b6f980c2e872f07fa487a984128498cbf6137ecd88a9339ce800',
        type: 'bytes',
        value: '0x7c907d059737c821067a5e0beba19ee9242a45cb',
      },
    'transfer_details[0].settlement_date':
      {
        key:
          '0x7d2a30dfbca405146154ae79bfcdea62a3dcab0c86a4447db102cb28b44050fd',
        type: 'timestamp',
        value: '2019-07-08T12:52:22Z',
      },
    'transfer_details[0].settlement_reference':
      {
        key:
          '0xf4bc932cae4a999394f4a7eb79ecffbc6261b46325fd76ac88d5396bd3f58c6a',
        type: 'bytes',
        value:
          '0x8dd141fce0c9673dc5904207fb97b4d32c99370bc5ce662d0b471f2e79c30a96',
      },
    'transfer_details[0].status':
      {
        key:
          '0x9cd20c510ad78a96d24bb3008a738a663161b82ccf8f798a04245f3e5f4d9ca5',
        type: 'string',
        value: 'settled',
      },
    'transfer_details[0].transfer_id':
      {
        key:
          '0xbd68ec29bcd78dccd8aa6d2a7900af2b2fcc6fa2b6c7d67f143841d2557a007d',
        type: 'bytes',
        value:
          '0x449ec9685c71fc972eb429f6694bd3629615bb14a8fdcaad47a3dddbd2dd7869',
      },
    'transfer_details[0].transfer_type':
      {
        key:
          '0x9d2d81b3b66d11ebbfe624a24dd6ffe1eb001aa223e59151dd88a1884a4b46e7',
        type: 'string',
        value: 'crypto',
      },
    'transfer_details[1].amount':
      {
        key:
          '0xb3c93fa717b4867f1c370297d4acdbf1902c1fbb45c375e2a83f9f3cace8e713',
        type: 'decimal',
        value: '20',
      },
    'transfer_details[1].currency':
      {
        key:
          '0x16da078bac66391c946c0c47d25fdce98ddc1b6499d871c046250523be045412',
        type: 'string',
        value: 'DAI',
      },
    'transfer_details[1].recipient_id':
      {
        key:
          '0x2c9394d69d95fb7ee5c841fc82b6a24be1e60c737ad6f7bc78fb87a24021b466',
        type: 'bytes',
        value: '0x5f2bbfcf948a0083bbe77c0ad97a64142d6b1d48',
      },
    'transfer_details[1].sender_id':
      {
        key:
          '0x22a7ac89649611373406b04deeff8d9fc79b2d1102eab685cb50001630134f6d',
        type: 'bytes',
        value: '0x7c907d059737c821067a5e0beba19ee9242a45cb',
      },
    'transfer_details[1].settlement_date':
      {
        key:
          '0x7d0974f40d5acd341c45cf3a07c4bb0a1cf77e19bd7314e2f72c0d35acc77cfb',
        type: 'timestamp',
        value: '2019-07-08T12:55:53Z',
      },
    'transfer_details[1].settlement_reference':
      {
        key:
          '0x107aee981f613089f4b1f45dec3e410c32f3d0fb148fce2fed6a560d4a95efec',
        type: 'bytes',
        value:
          '0x8dd141fce0c9673dc5904207fb97b4d32c99370bc5ce662d0b471f2e79c30a96',
      },
    'transfer_details[1].status':
      {
        key:
          '0x67e1938405a04b115da92a5270cf081c148211f98f91635efc9a878854835a24',
        type: 'string',
        value: 'settled',
      },
    'transfer_details[1].transfer_id':
      {
        key:
          '0x159dec36fefad30e9b452cbbb439ed1cab0cf476e50dee59a33aba6b3703eeba',
        type: 'bytes',
        value:
          '0xcea26f6083e3c90a20bf6e96356a8ed24f045ea1c2f5c18fbe4bf48ea88f8d10',
      },
    'transfer_details[1].transfer_type':
      {
        key:
          '0x2ec3d1622e993ae22d6322e1802e3342158059cd72561c1b42d1f6ca89b533a3',
        type: 'string',
        value: 'crypto',
      },
  };


  it('Should unflatten the custom attributes with iterables', () => {

    const unflattened = unflatten(attr);
    expect(Array.isArray(unflattened.transfer_details)).toEqual(true);
    expect(Array.isArray(unflattened.funding_agreement)).toEqual(true);
    expect(Array.isArray(unflattened.funding_agreement[0].signatures)).toEqual(true);
    expect(unflattened.test.amount).toEqual({
      key: '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
      type: 'bytes',
      value: '0xf7d228ac54b71f4954b69310a946acbd5fd23dc00ebb25a61010554e2f2aa962',
    });
  });

  it('Should unflattenRaw the custom attributes and have only objects', () => {
    const unflattened = unflattenRaw(attr);
    expect(Array.isArray(unflattened.transfer_details)).toEqual(false);
    expect(Array.isArray(unflattened.funding_agreement)).toEqual(false);
    expect(Array.isArray(unflattened.funding_agreement[0].signatures)).toEqual(false);
    expect(unflattened.test.amount).toEqual({
      key: '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
      type: 'bytes',
      value: '0xf7d228ac54b71f4954b69310a946acbd5fd23dc00ebb25a61010554e2f2aa962',
    });
  });

  it('Should flatten a back to the original object ', () => {
    const unflattened: any = unflatten(attr);
    const flattened = flatten(unflattened);
    expect(flatten(flattened)).toEqual(attr);
  });

  it('Should flatten a back a raw unflattening to the original object ', () => {
    const unflattened: any = unflattenRaw(attr);
    const flattened = flatten(unflattened);
    expect(flatten(flattened)).toEqual(attr);
  });

})
;






