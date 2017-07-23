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
 * @property {Object} attributes - All HTML attributes of the Node.
 * @property {Object[]} childNodes
 * @property {string} type - The nodeName of the Node.
 */

/**
 * Wilderness' accepted node types.
 */
const nodeTypes = [
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
 * Core props for the defined node type.
 *
 * @param {string} type
 *
 * @returns {Object}
 *
 * @example
 * coreProps('rect')
 */
const coreProps = type => nodeTypes.filter(node => node.type === type)[ 0 ].coreProps

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
  const currentKeys = Object.keys(current)
  const nextKeys = Object.keys(next)
  const remove = currentKeys.filter(k => nextKeys.indexOf(k) === -1)

  const update = nextKeys.filter(k => (
    currentKeys.indexOf(k) !== -1 ||
    current[ k ] !== next[ k ]
  ))

  return { remove, update }
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

    Object.keys(attributes).map(attr => {
      el.setAttribute(attr, attributes[ attr ])
    })

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
      attributes[ name ] = value
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

  Object.keys(attributes).map(k => {
    if (props.indexOf(k) !== -1) {
      const v = attributes[ k ]
      const n = Number(v)
      result[ k ] = Number.isNaN(n) ? v : n
    }
  })

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

  Object.keys(attributes).map(k => {
    if (props.indexOf(k) === -1) {
      result[ k ] = attributes[ k ]
    }
  })

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
 * updateNode()
 */
const updateNode = (el, frameShp) => {
  if (validNode(el) && validFrameShape(frameShp)) {
    const { attributes: nextAttributes, childFrameShapes, points } = frameShp

    if (childFrameShapes) {
      const childNodes = [ ...el.childNodes ].filter(validNodeType)

      childFrameShapes.map((childFrameShape, i) => {
        updateNode(childNodes[ i ], childFrameShape)
      })
    } else {
      const nextPath = toPath(points)

      if (nextPath !== el.getAttribute('d')) {
        el.setAttribute('d', nextPath)
      }
    }

    const { attributes: currentAttributes } = el

    const { remove, update } = diff(currentAttributes, nextAttributes)

    remove.map(attr => {
      el.removeAttribute(attr)
    })

    update.map(attr => {
      el.setAttribute(attr, nextAttributes[ attr ])
    })

    return el
  }
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
      throw TypeError(`frameShape must be of type object`)
    }

    const { attributes, childFrameShapes, points } = frameShp

    if (typeof attributes === 'undefined') {
      throw TypeError(`frameShape must include an attributes property`)
    }

    if (typeof attributes !== 'object' || Array.isArray(attributes)) {
      throw TypeError(`frameShape attributes property must be of type object`)
    }

    if (typeof childFrameShapes === 'undefined' && typeof points === 'undefined') {
      throw TypeError(`frameShape must have either a points or childFrameShapes property`)
    }

    if (points && (!Array.isArray(points))) {
      throw TypeError(`frameShape points property must be of type array`)
    }

    if (childFrameShapes) {
      if (!Array.isArray(childFrameShapes)) {
        throw TypeError(`frameShape childFrameShapes property must be of type array`)
      }

      childFrameShapes.map(childFrameShape => {
        if (typeof childFrameShape !== 'object' || typeof childFrameShape.attributes !== 'object') {
          throw TypeError(`frameShape childFrameShapes property must be array of frameShapes`)
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
const validNodeType = ({ nodeName }) => nodeTypes.map(({ type }) => type).indexOf(nodeName) !== -1

export { frameShape, node, plainShapeObject, updateNode }
