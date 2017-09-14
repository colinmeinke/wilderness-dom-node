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
 * Wilderness' accepted node types.
 */
const nodeTypes = nodeCoreProps.map(({ type }) => type)

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
const coreProps = type => nodeCoreProps.filter(node => node.type === type)[ 0 ].coreProps

/**
 * Diffs two objects and returns an object with remove and update props.
 *
 * @param {Object} current
 * @param {Object} next
 *
 * @returns {Object}
 *
 * @example
 * diff(current, next)
 */
const diff = (current, next) => {
  const result = { remove: [], update: [] }

  for (let currentKey in current) {
    if (typeof next[ currentKey ] === 'undefined') {
      result.remove.push(currentKey)
    }
  }

  for (let nextKey in next) {
    if (typeof current[ nextKey ] === 'undefined' || current[ nextKey ] !== next[ nextKey ]) {
      result.update.push(nextKey)
    }
  }

  return result
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
    const { attributes, childNodes, type } = nodeData(el)

    if (type === 'g') {
      return {
        attributes,
        childFrameShapes: childNodes.filter(validNodeType).map(frameShape)
      }
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
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  childFrameShapes.map(node).map(n => group.appendChild(n))
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
    const { attributes, childFrameShapes, points } = frameShp

    const el = childFrameShapes
      ? groupNode(childFrameShapes)
      : pathNode(points)

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
  const { attributes: attrs, childNodes, nodeName: type } = el
  const attributes = {}

  if (el.hasAttributes()) {
    [ ...attrs ].map(({ name, value }) => {
      if (attributeBlacklist.indexOf(name) === -1) {
        attributes[ name ] = value
      }
    })
  }

  return { attributes, childNodes: [ ...childNodes ], type }
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
    const { attributes, childNodes, type } = nodeData(el)

    if (type === 'g') {
      return {
        ...attributes,
        type,
        shapes: childNodes.filter(validNodeType).map(plainShapeObject)
      }
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
const updateNode = (el, frameShp) => {
  if (__DEV__) {
    if (!validNode(el)) {
      throw new TypeError(`The first argument of the updateNode function must be a valid DOM node`)
    }

    if (!validFrameShape(frameShp)) {
      throw new TypeError(`The second argument of the updateNode function must be a valid frameShape`)
    }
  }

  if (frameShp.childFrameShapes) {
    const childNodes = [ ...el.childNodes ].filter(validNodeType)

    for (let i = 0, l = frameShp.childFrameShapes.length; i < l; i++) {
      updateNode(childNodes[ i ], frameShp.childFrameShapes[ i ])
    }
  } else {
    const nextPath = toPath(frameShp.points)

    if (nextPath !== el.getAttribute('d')) {
      el.setAttribute('d', nextPath)
    }
  }

  const result = diff(el.attributes, frameShp.attributes)

  for (let i = 0, l = result.remove.length; i < l; i++) {
    el.removeAttribute(result.remove[ i ])
  }

  for (let i = 0, l = result.update.length; i < l; i++) {
    const attr = result.update[ i ]
    el.setAttribute(attr, frameShp.attributes[ attr ])
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

    const { attributes, childFrameShapes, points } = frameShp

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

      childFrameShapes.map(childFrameShape => {
        if (typeof childFrameShape !== 'object' || typeof childFrameShape.attributes !== 'object') {
          throw new TypeError(`frameShape childFrameShapes property must be array of frameShapes`)
        }
      })
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

    if (!validNodeType(el)) {
      throw new TypeError(`el must be an SVG basic shape or group element`)
    }
  }

  return true
}

/**
 * Is a Node one of the accepted node types?
 *
 * @param {Node} node
 *
 * @returns {boolean}
 *
 * @example
 * validNodeType(node)
 */
const validNodeType = ({ nodeName }) => nodeTypes.indexOf(nodeName) !== -1

export { frameShape, node, plainShapeObject, updateNode }
