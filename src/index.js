import { toPath, toPoints } from 'svg-points'

/**
 * Shape data as specified by the
 * {@link https://github.com/colinmeinke/points Points spec}.
 *
 * @typedef {Object[]} Points
 */

/**
 * An SVG shape as defined by https://github.com/colinmeinke/svg-points.
 *
 * @typedef {Object} PlainShapeObject
 */

/**
 * The data required to render a shape in Wilderness.
 *
 * @typedef {Object} FrameShape
 *
 * @property {Points} points
 * @property {Object} attributes
 * @property {FrameShape[]} childFrameShapes
 */

/**
 * A DOM node.
 *
 * @typedef {Object} Node
 */

/**
 * The data from a Node that is useful in Frame Shape and Plain Shape Object creation.
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
 * Creates a Frame Shape from a Node.
 *
 * @param {Node} node
 *
 * @returns {FrameShape}
 *
 * @example
 * frameShapeFromNode(node)
 */
const frameShape = el => {
  const { attributes, childNodes, type } = nodeData(el)

  if (type === 'g') {
    return {
      attributes,
      childFrameShapes: childNodes.filter(validNode).map(frameShape)
    }
  }

  return {
    attributes: removeCoreProps(type, attributes),
    points: toPoints(plainShapeObjectFromAttrs(type, attributes))
  }
}

/**
 * Creates a group Node from a Frame Shape array.
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
 * Creates a Node from a Frame Shape.
 *
 * @param {FrameShape} frameShape
 *
 * @returns {Node}
 *
 * @example
 * node(frameShape)
 */
const node = ({ attributes, childFrameShapes, points }) => {
  const el = childFrameShapes
    ? groupNode(childFrameShapes)
    : pathNode(points)

  Object.keys(attributes).map(attr => {
    el.setAttribute(attr, attributes[ attr ])
  })

  return el
}

/**
 * Creates Node Data given a Node.
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
 * Creates a Plain Shape Object from a Node.
 *
 * @param {Node} el
 *
 * @returns {PlainShapeObject}
 *
 * @example
 * plainShapeObject(el)
 */
const plainShapeObject = el => {
  const { attributes, childNodes, type } = nodeData(el)

  if (type === 'g') {
    return {
      ...attributes,
      type,
      shapes: childNodes.filter(validNode).map(plainShapeObject)
    }
  }

  return {
    ...attributes,
    ...plainShapeObjectFromAttrs(type, attributes)
  }
}

/**
 * Creates a Plain Shape Object from type and an attribute object.
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
 * Updates a Node from a Frame Shape.
 *
 * @param {Node} el
 * @param {FrameShape} frameShape
 *
 * @returns {Node}
 *
 * @example
 * updateNode()
 */
const updateNode = (el, { attributes: nextAttributes, childFrameShapes, points }) => {
  if (childFrameShapes) {
    const childNodes = [ ...el.childNodes ].filter(validNode)

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

/**
 * Is the node one of the accepted node types?
 *
 * @param {Node} node
 *
 * @returns {boolean}
 *
 * @example
 * validNode(node)
 */
const validNode = ({ nodeName }) => nodeTypes.map(({ name }) => name).indexOf(nodeName) !== -1

export { frameShape, node, plainShapeObject, updateNode }
