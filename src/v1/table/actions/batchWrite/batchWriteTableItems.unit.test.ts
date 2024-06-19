import type { A } from 'ts-toolbelt'

import {
  DynamoDBToolboxError,
  EntityV2,
  TableV2,
  BatchPutItemRequest,
  BatchDeleteItemRequest,
  schema,
  string,
  number
} from 'v1'
import { $entities } from 'v1/table/table'

import { BatchWriteTableItemsRequest } from './batchWriteTableItems'

const TestTable = new TableV2({
  name: 'test-table',
  partitionKey: {
    type: 'string',
    name: 'pk'
  },
  sortKey: {
    type: 'string',
    name: 'sk'
  }
})

const EntityA = new EntityV2({
  name: 'EntityA',
  schema: schema({
    pkA: string().key().savedAs('pk'),
    skA: string().key().savedAs('sk'),
    commonAttribute: string(),
    name: string()
  }),
  table: TestTable
})

const EntityB = new EntityV2({
  name: 'EntityB',
  schema: schema({
    pkB: string().key().savedAs('pk'),
    skB: string().key().savedAs('sk'),
    commonAttribute: string(),
    age: number()
  }),
  table: TestTable
})

describe('batchWriteTableItems', () => {
  it('throws if there is no batchWriteItemRequest', () => {
    const invalidCallA = () => TestTable.build(BatchWriteTableItemsRequest).params()

    expect(invalidCallA).toThrow(DynamoDBToolboxError)
    expect(invalidCallA).toThrow(expect.objectContaining({ code: 'actions.incompleteAction' }))

    const invalidCallB = () => TestTable.build(BatchWriteTableItemsRequest).requests().params()

    expect(invalidCallB).toThrow(DynamoDBToolboxError)
    expect(invalidCallB).toThrow(expect.objectContaining({ code: 'actions.incompleteAction' }))
  })

  it('infers correct type', () => {
    const tableRequest = TestTable.build(BatchWriteTableItemsRequest).requests(
      EntityA.build(BatchDeleteItemRequest).key({ pkA: 'a', skA: 'a' }),
      EntityB.build(BatchDeleteItemRequest).key({ pkB: 'b', skB: 'b' })
    )

    type AssertEntities = A.Equals<typeof tableRequest[$entities], [typeof EntityA, typeof EntityB]>
    const assertEntities: AssertEntities = 1
    assertEntities

    expect(tableRequest[$entities]).toStrictEqual([EntityA, EntityB])
  })

  it('infers correct type even when receiving an array of requests', () => {
    const batchItemRequests1 = [
      EntityA.build(BatchDeleteItemRequest).key({ pkA: 'a', skA: 'a' }),
      EntityB.build(BatchDeleteItemRequest).key({ pkB: 'b', skB: 'b' })
    ]

    const tableRequest = TestTable.build(BatchWriteTableItemsRequest).requests(
      ...batchItemRequests1
    )

    // We have to do like this because order is not guaranteed
    type AssertEntitiesAB = A.Equals<
      typeof tableRequest[$entities],
      [typeof EntityA, typeof EntityB]
    >
    type AssertEntitiesBA = A.Equals<
      typeof tableRequest[$entities],
      [typeof EntityB, typeof EntityA]
    >
    const assertEntities: AssertEntitiesAB | AssertEntitiesBA = 1
    assertEntities

    expect(tableRequest[$entities]).toStrictEqual([EntityA, EntityB])
  })

  it('builds expected input', () => {
    const input = TestTable.build(BatchWriteTableItemsRequest)
      .requests(
        EntityA.build(BatchPutItemRequest).item({
          pkA: 'a',
          skA: 'a',
          name: 'foo',
          commonAttribute: 'bar'
        }),
        EntityB.build(BatchDeleteItemRequest).key({ pkB: 'b', skB: 'b' })
      )
      .params()

    expect(input).toStrictEqual([
      {
        PutRequest: {
          Item: {
            _et: 'EntityA',
            _ct: expect.any(String),
            _md: expect.any(String),
            commonAttribute: 'bar',
            name: 'foo',
            pk: 'a',
            sk: 'a'
          }
        }
      },
      { DeleteRequest: { Key: { pk: 'b', sk: 'b' } } }
    ])
  })
})
