import type { A } from 'ts-toolbelt'
import {
  DynamoDBToolboxError,
  EntityV2,
  TableV2,
  schema,
  string,
  BatchGetItemRequest,
  number
} from 'v1'
import { $entities } from 'v1/table/table'

import { BatchGetTableItemsRequest } from './batchGetTableItems'

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

describe('batchGetTableItems', () => {
  it('throws if there is no batchGetItemRequest', () => {
    const invalidCallA = () => TestTable.build(BatchGetTableItemsRequest).params()

    expect(invalidCallA).toThrow(DynamoDBToolboxError)
    expect(invalidCallA).toThrow(expect.objectContaining({ code: 'actions.incompleteAction' }))

    const invalidCallB = () => TestTable.build(BatchGetTableItemsRequest).requests().params()

    expect(invalidCallB).toThrow(DynamoDBToolboxError)
    expect(invalidCallB).toThrow(expect.objectContaining({ code: 'actions.incompleteAction' }))
  })

  it('infers correct type', () => {
    const tableRequest = TestTable.build(BatchGetTableItemsRequest).requests(
      EntityA.build(BatchGetItemRequest).key({ pkA: 'a', skA: 'a' }),
      EntityB.build(BatchGetItemRequest).key({ pkB: 'b', skB: 'b' })
    )

    type AssertEntities = A.Equals<typeof tableRequest[$entities], [typeof EntityA, typeof EntityB]>
    const assertEntities: AssertEntities = 1
    assertEntities

    expect(tableRequest[$entities]).toStrictEqual([EntityA, EntityB])
  })

  it('infers correct type even when receiving an array of requests', () => {
    const batchItemRequests1 = [
      EntityA.build(BatchGetItemRequest).key({ pkA: 'a', skA: 'a' }),
      EntityB.build(BatchGetItemRequest).key({ pkB: 'b', skB: 'b' })
    ]

    const tableRequest = TestTable.build(BatchGetTableItemsRequest).requests(...batchItemRequests1)

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
    const input = TestTable.build(BatchGetTableItemsRequest)
      .requests(
        EntityA.build(BatchGetItemRequest).key({ pkA: 'a', skA: 'a' }),
        EntityB.build(BatchGetItemRequest).key({ pkB: 'b', skB: 'b' })
      )
      .params()

    expect(input).toStrictEqual({
      Keys: [
        { pk: 'a', sk: 'a' },
        { pk: 'b', sk: 'b' }
      ]
    })
  })

  it('parses consistent options', () => {
    const initialCommand = TestTable.build(BatchGetTableItemsRequest).requests(
      EntityA.build(BatchGetItemRequest).key({ pkA: 'a', skA: 'a' })
    )

    const invalidCall = () =>
      initialCommand
        // @ts-expect-error
        .options({ consistent: 'true' })
        .params()

    expect(invalidCall).toThrow(DynamoDBToolboxError)
    expect(invalidCall).toThrow(
      expect.objectContaining({ code: 'options.invalidConsistentOption' })
    )

    const input = initialCommand.options({ consistent: true }).params()
    expect(input).toMatchObject({ ConsistentRead: true })
  })

  it('parses attributes options', () => {
    const invalidCall = () =>
      TestTable.build(BatchGetTableItemsRequest)
        .requests(
          EntityA.build(BatchGetItemRequest).key({ pkA: 'a', skA: 'a' }),
          EntityB.build(BatchGetItemRequest).key({ pkB: 'b', skB: 'b' })
        )
        // @ts-expect-error (NOTE: we have to use an attribute from the 2nd entity as the first is used to parse the paths)
        .options({ attributes: ['age'] })
        .params()

    expect(invalidCall).toThrow(DynamoDBToolboxError)
    expect(invalidCall).toThrow(
      expect.objectContaining({ code: 'actions.invalidExpressionAttributePath' })
    )
  })

  it('parses projection expression', () => {
    const completeInput = TestTable.build(BatchGetTableItemsRequest)
      .requests(EntityA.build(BatchGetItemRequest).key({ pkA: 'a', skA: 'a' }))
      .options({ attributes: ['entity', 'pkA', 'skA', 'commonAttribute'] })
      .params()

    expect(completeInput).toMatchObject({
      ProjectionExpression: '#p_1, #p_2, #p_3, #p_4',
      ExpressionAttributeNames: {
        '#p_1': '_et',
        '#p_2': 'pk',
        '#p_3': 'sk',
        '#p_4': 'commonAttribute'
      }
    })
  })

  it('appends entityAttribute, pk and sk to projection expression', () => {
    const completeInput = TestTable.build(BatchGetTableItemsRequest)
      .requests(EntityA.build(BatchGetItemRequest).key({ pkA: 'a', skA: 'a' }))
      .options({ attributes: ['commonAttribute'] })
      .params()
    expect(completeInput).toMatchObject({
      ProjectionExpression: '#p_1, #p_2, #_pk, #_sk',
      ExpressionAttributeNames: {
        '#p_1': '_et',
        '#p_2': 'commonAttribute',
        '#_pk': TestTable.partitionKey.name,
        '#_sk': TestTable.sortKey?.name
      }
    })
  })
})
