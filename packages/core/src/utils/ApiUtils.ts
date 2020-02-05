import { ModelAttribute } from '../types'
import { parseModelAttribute } from '..'

type ApiEntityFilter = {
  [key: string]: ApiEntityFilter[] | ApiEntityFilterQuery
}

type ApiEntityFilterQuery = {
  value: string
  comparator?: ApiEntityFilterComparator
}

type ApiEntityFilterComparator = '=' | '!=' | '<' | '<=' | '>' | '>='

export function parseFilter<T> (filterData: ApiEntityFilter, attributes: { [key in keyof T]: ModelAttribute }) {
  const filter: { [key: string]: any } = {}
  for (const [key, filterValue] of Object.entries(filterData)) {
    if (['and', 'or'].includes(key)) {
      const filters = filterValue as ApiEntityFilter[]
      filter['$' + key] = filters.map(filter => parseFilter(filter, attributes))
    } else {
      const query = filterValue as ApiEntityFilterQuery
      const value = attributes[key as keyof T] ? parseModelAttribute(attributes[key as keyof T], query.value) : query.value
      switch (query.comparator) {
        case '!=':
          filter[key] = { $ne: value }
          break
        case '<':
          filter[key] = { $lt: value }
          break
        case '<=':
          filter[key] = { $lte: value }
          break
        case '>':
          filter[key] = { $gt: value }
          break
        case '>=':
          filter[key] = { $gte: value }
          break
        case '=':
        default:
          filter[key] = value
          break
      }
    }
  }
  return filter
}

export function strToApiFilter<T> (filter: string, attributes: { [key in keyof T]: ModelAttribute }): ApiEntityFilter {
  const apiFilter: ApiEntityFilter = {}

  const conditionalRegExp = /^(and|or)\[(.*)]$/i
  const matchFilter = filter.trim().match(conditionalRegExp)
  if (matchFilter && matchFilter.length === 3) {
    const comparator = matchFilter[1].toLowerCase()
    let level = 0
    const fields = ['']
    for (const char of [...matchFilter[2].trim()]) {
      if (char === '[') {
        level++
      } else if (char === ']') {
        level--
      }
      if (!level && char === ';') {
        fields.push('')
      } else {
        fields[fields.length - 1] += char
      }
    }
    apiFilter[comparator] = fields.map(field => strToApiFilter(field, attributes))
  } else {
    const keyValues = filter.trim().split(';')
    for (const keyValue of keyValues) {
      const [key, value] = keyValue.split(':')
      apiFilter[key] = {
        value: attributes[key as keyof T] ? parseModelAttribute(attributes[key as keyof T], value) : value
      }
    }
  }

  return apiFilter
}
