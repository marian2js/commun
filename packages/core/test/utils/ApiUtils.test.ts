import { parseFilter, strToApiFilter } from '../../src/utils/ApiUtils'

describe('ApiUtils', () => {
  describe('parseFilter', () => {
    it('should parse an entity filter into a MongoDB filter', async () => {
      expect(parseFilter({ a: { value: 'b' } }, {})).toEqual({ a: 'b' })
      expect(parseFilter({ a: { value: 'b', comparator: '>' } }, {})).toEqual({ a: { $gt: 'b' } })
      expect(parseFilter({ or: [{ a: { value: 'b' } }, { c: { value: 'd' } }] }, {}))
        .toEqual({ $or: [{ a: 'b' }, { c: 'd' }] })
    })

    it('should use the correct type according the property', async () => {
      expect(parseFilter(
        { str: { value: '1' }, num: { value: '2' } },
        { properties: { str: { type: 'string' }, num: { type: 'number' } } }
      )).toEqual({ str: '1', num: 2 })
      expect(parseFilter(
        { str: { value: 'true' }, bool: { value: 'true' } },
        { properties: { str: { type: 'string' }, bool: { type: 'boolean' } } }
      )).toEqual({ str: 'true', bool: true })
    })
  })

  describe('strToApiFilter', () => {
    it('should parse strings into an ApiEntityFilter', async () => {
      expect(strToApiFilter('a:b;c:d', {})).toEqual({ a: { value: 'b' }, c: { value: 'd' } })
      expect(strToApiFilter('AND[a:b;OR[c:d;e:f]]', {})).toEqual({
        and: [{ a: { value: 'b' } }, { or: [{ c: { value: 'd' } }, { e: { value: 'f' } }] }]
      })
    })

    it('should use the correct type according the property', async () => {
      expect(strToApiFilter('str:1;num:2', {
        properties: { str: { type: 'string' }, num: { type: 'number' } },
      })).toEqual({ str: { value: '1' }, num: { value: 2 } })
      expect(strToApiFilter('str:true;bool:true', {
        properties: { str: { type: 'string' }, bool: { type: 'boolean' } },
      })).toEqual({ str: { value: 'true' }, bool: { value: true } })
    })
  })
})