import { parseConditions } from '../parseConditions'

describe('parseConditions - singleArgFn', () => {
  it('exists', () => {
    expect(parseConditions({ path: 'num', exists: true })).toStrictEqual({
      ConditionExpression: 'attribute_exists(#1)',
      ExpressionAttributeNames: { '#1': 'num' },
      ExpressionAttributeValues: {}
    })
  })

  it('not exists', () => {
    expect(parseConditions({ path: 'num', exists: false })).toStrictEqual({
      ConditionExpression: 'attribute_not_exists(#1)',
      ExpressionAttributeNames: { '#1': 'num' },
      ExpressionAttributeValues: {}
    })
  })

  it('deep maps', () => {
    expect(parseConditions({ path: 'map.nestedA.nestedB', exists: true })).toStrictEqual({
      ConditionExpression: 'attribute_exists(#1.#2.#3)',
      ExpressionAttributeNames: {
        '#1': 'map',
        '#2': 'nestedA',
        '#3': 'nestedB'
      },
      ExpressionAttributeValues: {}
    })
  })

  it('deep maps and lists', () => {
    expect(parseConditions({ path: 'listA[1].nested.listB[2].value', exists: true })).toStrictEqual(
      {
        ConditionExpression: 'attribute_exists(#1[1]#2.#3[2]#4)',
        ExpressionAttributeNames: {
          '#1': 'listA',
          '#2': 'nested',
          '#3': 'listB',
          '#4': 'value'
        },
        ExpressionAttributeValues: {}
      }
    )
  })

  it('deep lists', () => {
    expect(parseConditions({ path: 'list[1][2][3]', exists: true })).toStrictEqual({
      ConditionExpression: 'attribute_exists(#1[1][2][3])',
      ExpressionAttributeNames: { '#1': 'list' },
      ExpressionAttributeValues: {}
    })
  })
})
