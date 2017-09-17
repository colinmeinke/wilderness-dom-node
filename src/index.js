/* globals __DEV__ */

import { toPath, toPoints } from 'svg-points'

/**
 * A DOM node.
 *
 * @typedef {Object} Node
 */

/**
 * The data from a Node that is useful in FrameShape and PlainShapeObject creation.
 *
 * @typedef {Object} NodeData
 *
 * @property {Object} attributes - All HTML attributes of the Node (excluding blacklist).
 * @property {Object[]} childNodes
 * @property {string} type - The nodeName of the Node.
 */

/**
 * Attributes to ignore.
 */
const attributeBlacklist = [
  'data-jsx-ext',
  'data-reactid'
]

/**
 * Wilderness' accepted node types core props.
 */
const nodeCoreProps = [
  {
    type: 'circle',
    coreProps: [ 'cx', 'cy', 'r' ]
  },
  {
    type: 'ellipse',
    coreProps: [ 'cx', 'cy', 'rx', 'ry' ]
  },
  {
    type: 'g',
    coreProps: []
  },
  {
    type: 'line',
    coreProps: [ 'x1', 'x2', 'y1', 'y2' ]
  },
  {
    type: 'path',
    coreProps: [ 'd' ]
  },
  {
    type: 'polygon',
    coreProps: [ 'points' ]
  },
  {
    type: 'polyline',
    coreProps: [ 'points' ]
  },
  {
    type: 'rect',
    coreProps: [ 'height', 'rx', 'ry', 'width', 'x', 'y' ]
  }
]

/**
 * Generates Wilderness' accepted node types from core props object.
 *
 * @returns {string[]}
 *
 * @example
 * getNodeTypes()
 */
const getNodeTypes = () => {
  const types = []

  for (let i = 0, l = nodeCoreProps.length; i < l; i++) {
    types.push(nodeCoreProps[ i ].type)
  }

  return types
}

/**
 * Wilderness' accepted node types.
 */
const nodeTypes = getNodeTypes()

/**
 * Core props for the defined node type.
 *
 * @param {string} type
 *
 * @returns {Object}
 *
 * @example
 * coreProps('rect')
 */
const coreProps = type => {
  for (let i = 0, l = nodeCoreProps.length; i < l; i++) {
    if (nodeCoreProps[ i ].type === type) {
      return nodeCoreProps[ i ].coreProps
    }
  }

  return []
}

/**
 * Creates a FrameShape from a Node.
 *
 * @param {Node} node
 *
 * @returns {FrameShape}
 *
 * @example
 * frameShapeFromNode(node)
 */
const frameShape = el => {
  if (validNode(el)) {
    const data = nodeData(el)
    const attributes = data.attributes
    const type = data.type

    if (type === 'g') {
      const childNodes = data.childNodes
      const childFrameShapes = []

      for (let i = 0, l = childNodes.length; i < l; i++) {
        const n = childNodes[ i ]

        if (validNodeType(childNodes[ i ].nodeName)) {
          childFrameShapes.push(frameShape(n))
        }
      }

      return { attributes, childFrameShapes }
    }

    return {
      attributes: removeCoreProps(type, attributes),
      points: toPoints(plainShapeObjectFromAttrs(type, attributes))
    }
  }
}

/**
 * Creates a group Node from a FrameShape array.
 *
 * @param {FrameShape[]} childFrameShapes
 *
 * @returns {Node}
 *
 * @example
 * groupNode(childFrameShapes)
 */
const groupNode = childFrameShapes => {
  const nodes = []

  for (let i = 0, l = childFrameShapes.length; i < l; i++) {
    nodes.push(node(childFrameShapes[ i ]))
  }

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  for (let i = 0, l = nodes.length; i < l; i++) {
    group.appendChild(nodes[ i ])
  }

  return group
}

/**
 * Creates a Node from a FrameShape.
 *
 * @param {FrameShape} frameShape
 *
 * @returns {Node}
 *
 * @example
 * node(frameShape)
 */
const node = frameShp => {
  if (validFrameShape(frameShp)) {
    const attributes = frameShp.attributes

    const el = frameShp.childFrameShapes
      ? groupNode(frameShp.childFrameShapes)
      : pathNode(frameShp.points)

    for (let attr in attributes) {
      el.setAttribute(attr, attributes[ attr ])
    }

    return el
  }
}

/**
 * Creates NodeData given a Node.
 *
 * @param {Node} el
 *
 * @returns {NodeData}
 *
 * @example
 * nodeData(el)
 */
const nodeData = el => {
  const attributes = {}

  if (el.hasAttributes()) {
    const attrs = [ ...el.attributes ]

    for (let i = 0, l = attrs.length; i < l; i++) {
      const attr = attrs[ i ]
      const name = attr.name

      if (attributeBlacklist.indexOf(name) === -1) {
        attributes[ name ] = attr.value
      }
    }
  }

  return { attributes, childNodes: [ ...el.childNodes ], type: el.nodeName }
}

/**
 * Creates a path Node from Points.
 *
 * @param {Points} points
 *
 * @returns {Node}
 *
 * @example
 * pathNode(points)
 */
const pathNode = points => {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  path.setAttribute('d', toPath(points))

  return path
}

/**
 * Creates a PlainShapeObject from a Node.
 *
 * @param {Node} el
 *
 * @returns {PlainShapeObject}
 *
 * @example
 * plainShapeObject(el)
 */
const plainShapeObject = el => {
  if (validNode(el)) {
    const data = nodeData(el)
    const attributes = data.attributes
    const type = data.type

    if (type === 'g') {
      const childNodes = data.childNodes
      const shapes = []

      for (var i = 0, l = childNodes.length; i < l; i++) {
        const n = childNodes[ i ]

        if (validNodeType(n.nodeName)) {
          shapes.push(plainShapeObject(n))
        }
      }

      return { ...attributes, type, shapes }
    }

    return {
      ...attributes,
      ...plainShapeObjectFromAttrs(type, attributes)
    }
  }
}

/**
 * Creates a PlainShapeObject from type and an attribute object.
 *
 * @param {string} type
 * @param {Object} attributes
 *
 * @returns {PlainShapeObject}
 *
 * @example
 * plainShapeObjectFromAttrs('rect', attributes)
 */
const plainShapeObjectFromAttrs = (type, attributes) => {
  const props = coreProps(type)
  const result = { type }

  for (let k in attributes) {
    if (props.indexOf(k) !== -1) {
      const v = attributes[ k ]
      const n = Number(v)
      result[ k ] = Number.isNaN(n) ? v : n
    }
  }

  return result
}

/**
 * Removes type's core props from attributes object.
 *
 * @param {string} type
 * @param {Object} attributes
 *
 * @returns {Object}
 *
 * @example
 * removeCoreProps('rect', attributes)
 */
const removeCoreProps = (type, attributes) => {
  const props = coreProps(type)
  const result = {}

  for (let k in attributes) {
    if (props.indexOf(k) === -1) {
      result[ k ] = attributes[ k ]
    }
  }

  return result
}

/**
 * Updates a Node from a FrameShape.
 *
 * @param {Node} el
 * @param {FrameShape} frameShape
 *
 * @returns {Node}
 *
 * @example
 * updateNode(el, frameShape)
 */
const updateNode = (el, frameShp, changes = []) => {
  if (__DEV__) {
    if (!validNode(el)) {
      throw new TypeError(`The first argument of the updateNode function must be a valid DOM node`)
    }

    if (!validFrameShape(frameShp)) {
      throw new TypeError(`The second argument of the updateNode function must be a valid frameShape`)
    }
  }

  const shouldApplyChanges = changes.length === 0
  const currentAttributes = el.attributes
  const nextAttributes = frameShp.attributes
  const childFrameShapes = frameShp.childFrameShapes
  const changesKey = changes.push({ el, remove: [], update: {} }) - 1

  for (let k in currentAttributes) {
    if (typeof nextAttributes[ k ] === 'undefined') {
      changes[ changesKey ].remove.push(k)
    }
  }

  for (let k in nextAttributes) {
    const c = currentAttributes[ k ]
    const n = nextAttributes[ k ]

    if (typeof c === 'undefined' || c !== n) {
      changes[ changesKey ].update[ k ] = n
    }
  }

  if (!childFrameShapes) {
    const nextPath = toPath(frameShp.points)

    if (nextPath !== el.getAttribute('d')) {
      changes[ changesKey ].update.d = nextPath
    }
  } else {
    const allChildNodes = [ ...el.childNodes ]
    const childNodes = []

    for (let i = 0, l = allChildNodes.length; i < l; i++) {
      const n = allChildNodes[ i ]

      if (validNodeType(n.nodeName)) {
        childNodes.push(n)
      }
    }

    for (let i = 0, l = childFrameShapes.length; i < l; i++) {
      updateNode(childNodes[ i ], childFrameShapes[ i ], changes)
    }
  }

  if (shouldApplyChanges) {
    for (let i = 0, l = changes.length; i < l; i++) {
      const change = changes[ i ]
      const _el = change.el
      const remove = change.remove
      const update = change.update

      for (let _i = 0, _l = remove.length; _i < _l; _i++) {
        _el.removeAttribute(remove[ _i ])
      }

      for (let k in update) {
        _el.setAttribute(k, update[ k ])
      }
    }
  }

  return el
}

/**
 * Is a FrameShape valid?
 *
 * @param {FrameShape} frameShp
 *
 * @throws {TypeError} Throws if not valid
 *
 * @returns {true}
 *
 * @example
 * validFrameShape(frameShape)
 */
const validFrameShape = frameShp => {
  if (__DEV__) {
    if (typeof frameShp !== 'object' || Array.isArray(frameShp)) {
      throw new TypeError(`frameShape must be of type object`)
    }

    const attributes = frameShp.attributes
    const childFrameShapes = frameShp.childFrameShapes
    const points = frameShp.points

    if (typeof attributes === 'undefined') {
      throw new TypeError(`frameShape must include an attributes property`)
    }

    if (typeof attributes !== 'object' || Array.isArray(attributes)) {
      throw new TypeError(`frameShape attributes property must be of type object`)
    }

    if (typeof childFrameShapes === 'undefined' && typeof points === 'undefined') {
      throw new TypeError(`frameShape must have either a points or childFrameShapes property`)
    }

    if (points && (!Array.isArray(points))) {
      throw new TypeError(`frameShape points property must be of type array`)
    }

    if (childFrameShapes) {
      if (!Array.isArray(childFrameShapes)) {
        throw new TypeError(`frameShape childFrameShapes property must be of type array`)
      }

      for (let i = 0, l = childFrameShapes.length; i < l; i++) {
        const childFrameShape = childFrameShapes[ i ]

        if (typeof childFrameShape !== 'object' || typeof childFrameShape.attributes !== 'object') {
          throw new TypeError(`frameShape childFrameShapes property must be array of frameShapes`)
        }
      }
    }
  }

  return true
}

/**
 * Is a Node valid?
 *
 * @param {Node} el
 *
 * @throws {TypeError} Throws if not valid
 *
 * @returns {true}
 *
 * @example
 * validNode(el)
 */
const validNode = el => {
  if (__DEV__) {
    if (typeof el !== 'object' || !el.nodeName) {
      throw new TypeError(`el must be a DOM node`)
    }

    if (!validNodeType(el.nodeName)) {
      throw new TypeError(`el must be an SVG basic shape or group element`)
    }
  }

  return true
}

/**
 * Is a node name one of the accepted node types?
 *
 * @param {string} nodeName
 *
 * @returns {boolean}
 *
 * @example
 * validNodeType(nodeName)
 */
const validNodeType = nodeName => nodeTypes.indexOf(nodeName) !== -1

export { frameShape, node, plainShapeObject, updateNode }
