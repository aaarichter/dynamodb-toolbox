import type { $RecordAttribute } from '~/attributes/record/index.js'
import { record } from '~/attributes/record/index.js'
import type { $RecordAttributeElements, $RecordAttributeKeys } from '~/attributes/record/types'
import type { JSONizedAttr } from '~/schema/actions/jsonize/index.js'

import { fromJSONAttr } from './attribute.js'

type JSONizedRecordAttr = Extract<JSONizedAttr, { type: 'record' }>

/**
 * @debt feature "handle defaults, links & validators"
 */
export const fromJSONRecordAttr = ({
  defaults,
  links,
  keys,
  elements,
  ...props
}: JSONizedRecordAttr): $RecordAttribute => {
  defaults
  links

  return record(
    fromJSONAttr(keys) as $RecordAttributeKeys,
    fromJSONAttr(elements) as $RecordAttributeElements,
    props
  )
}
