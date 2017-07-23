/* globals describe it expect */

import { frameShape, node, plainShapeObject, updateNode } from '../src'

const createGroup = () => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.appendChild(createPath())
  g.appendChild(createPath())
  return g
}

const createPath = () => {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M0,0H10')
  return path
}

describe('frameShape', () => {
  it('should throw if not passed a Node', () => {
    expect(() => frameShape('potato')).to.throw('el must be a DOM node')
  })

  it('should throw if not passed a valid Node', () => {
    const el = document.createElement('div')
    expect(() => frameShape(el)).to.throw('el must be an SVG basic shape or group element')
  })

  it('should return a FrameShape with correct attributes', () => {
    const el = createPath()

    el.setAttribute('fill', 'yellow')
    el.classList.add('potato')

    const { attributes } = frameShape(el)

    expect(attributes).to.have.property('fill')
    expect(attributes).to.have.property('class')
    expect(attributes.fill).to.equal('yellow')
    expect(attributes.class).to.equal('potato')
  })

  it('should return a FrameShape with correct points', () => {
    const el = createPath()
    const { points } = frameShape(el)
    const expectedPoints = [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }]
    expect(points).to.eql(expectedPoints)
  })

  it('should return a group FrameShape with correct attributes', () => {
    const el = createGroup()

    el.setAttribute('fill', 'yellow')
    el.classList.add('potato')

    const { attributes } = frameShape(el)

    expect(attributes).to.have.property('fill')
    expect(attributes).to.have.property('class')
    expect(attributes.fill).to.equal('yellow')
    expect(attributes.class).to.equal('potato')
  })

  it('should return a group FrameShape without a points property', () => {
    const el = createGroup()
    expect(frameShape(el)).to.not.have.property('points')
  })

  it('should return a group FrameShape with correct childFrameShapes', () => {
    const el = createGroup()

    el.childNodes[ 0 ].setAttribute('fill', 'yellow')
    el.childNodes[ 1 ].setAttribute('fill', 'red')

    const { childFrameShapes } = frameShape(el)

    const expectedPoints = [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }]

    expect(childFrameShapes[ 0 ]).to.have.property('attributes')
    expect(childFrameShapes[ 0 ]).to.have.property('points')
    expect(childFrameShapes[ 1 ]).to.have.property('attributes')
    expect(childFrameShapes[ 1 ]).to.have.property('points')
    expect(childFrameShapes[ 0 ].attributes).to.have.property('fill')
    expect(childFrameShapes[ 0 ].attributes.fill).to.equal('yellow')
    expect(childFrameShapes[ 1 ].attributes).to.have.property('fill')
    expect(childFrameShapes[ 1 ].attributes.fill).to.equal('red')
    expect(childFrameShapes[ 0 ].points).to.eql(expectedPoints)
    expect(childFrameShapes[ 1 ].points).to.eql(expectedPoints)
  })
})

describe('node', () => {
  it('should throw if FrameShape is not an object', () => {
    expect(() => node('potato')).to.throw('frameShape must be of type object')
  })

  it('should throw if FrameShape does not have attributes property', () => {
    const frameShp = { points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }] }
    expect(() => node(frameShp)).to.throw('frameShape must include an attributes property')
  })

  it('should throw if FrameShape attributes property is invalid', () => {
    const frameShp = { attributes: 'potato', points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }] }
    expect(() => node(frameShp)).to.throw('frameShape attributes property must be of type object')
  })

  it('should throw if FrameShape does not have a points or childFrameShapes property', () => {
    const frameShp = { attributes: {} }
    expect(() => node(frameShp)).to.throw('frameShape must have either a points or childFrameShapes property')
  })

  it('should throw if FrameShape points property is invalid', () => {
    const frameShp = { attributes: {}, points: 'potato' }
    expect(() => node(frameShp)).to.throw('frameShape points property must be of type array')
  })

  it('should throw if childFrameShapes points property is invalid', () => {
    expect(() => node({ attributes: {}, childFrameShapes: 'potato' }))
      .to.throw('frameShape childFrameShapes property must be of type array')

    expect(() => node({ attributes: {}, childFrameShapes: [ 'potato' ] }))
      .to.throw('frameShape childFrameShapes property must be array of frameShapes')
  })

  it('should return a Node with the correct structure', () => {
    const el = node({
      attributes: {},
      points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }]
    })

    expect(el.nodeName).to.equal('path')
  })

  it('should return a Node with the correct attributes', () => {
    const el = node({
      attributes: { fill: 'yellow', 'class': 'potato' },
      points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }]
    })

    expect(el.getAttribute('d')).to.equal('M0,0H10')
    expect(el.getAttribute('fill')).to.equal('yellow')
    expect(el.classList.contains('potato')).to.equal(true)
  })

  it('should return a group Node with the correct structure', () => {
    const el = node({
      attributes: {},
      childFrameShapes: [
        {
          attributes: {},
          points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }]
        },
        {
          attributes: {},
          points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }]
        }
      ]
    })

    expect(el.nodeName).to.equal('g')
    expect(el.childNodes[ 0 ].nodeName).to.equal('path')
    expect(el.childNodes[ 1 ].nodeName).to.equal('path')
  })

  it('should return a group Node with the correct attributes', () => {
    const el = node({
      attributes: { fill: 'yellow' },
      childFrameShapes: [
        {
          attributes: { fill: 'red' },
          points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }]
        },
        {
          attributes: { fill: 'green' },
          points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }]
        }
      ]
    })

    expect(el.getAttribute('fill')).to.equal('yellow')
    expect(el.childNodes[ 0 ].getAttribute('fill')).to.equal('red')
    expect(el.childNodes[ 0 ].getAttribute('d')).to.equal('M0,0H10')
    expect(el.childNodes[ 1 ].getAttribute('fill')).to.equal('green')
    expect(el.childNodes[ 1 ].getAttribute('d')).to.equal('M0,0H10')
  })
})

describe('plainShapeObject', () => {
  it('should throw if not passed a Node', () => {
    expect(() => plainShapeObject('potato')).to.throw('el must be a DOM node')
  })

  it('should throw if not passed a valid Node', () => {
    const el = document.createElement('div')
    expect(() => plainShapeObject(el)).to.throw('el must be an SVG basic shape or group element')
  })

  it('should return the correct PlainShapeObject', () => {
    const el = createPath()

    el.setAttribute('fill', 'yellow')
    el.classList.add('potato')

    const expectedPlainShapeObject = {
      type: 'path',
      d: 'M0,0H10',
      fill: 'yellow',
      'class': 'potato'
    }

    expect(plainShapeObject(el)).to.eql(expectedPlainShapeObject)
  })

  it('should return the correct group PlainShapeObject', () => {
    const el = createGroup()

    el.setAttribute('fill', 'yellow')
    el.childNodes[ 0 ].setAttribute('fill', 'red')
    el.childNodes[ 1 ].setAttribute('fill', 'green')

    const expectedPlainShapeObject = {
      type: 'g',
      shapes: [
        {
          type: 'path',
          d: 'M0,0H10',
          fill: 'red'
        },
        {
          type: 'path',
          d: 'M0,0H10',
          fill: 'green'
        }
      ],
      fill: 'yellow'
    }

    expect(plainShapeObject(el)).to.eql(expectedPlainShapeObject)
  })
})

describe('updateNode', () => {
  it('should throw if not passed a Node as the first argument', () => {
    const frameShp = { attributes: {}, points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }] }
    expect(() => updateNode('potato', frameShp)).to.throw('el must be a DOM node')
  })

  it('should throw if not passed a valid Node as the first argument', () => {
    const el = document.createElement('div')
    const frameShp = { attributes: {}, points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }] }
    expect(() => updateNode(el, frameShp)).to.throw('el must be an SVG basic shape or group element')
  })

  it('should throw if not passed a FrameShape as the second argument', () => {
    const el = createPath()
    expect(() => updateNode(el, 'potato')).to.throw('frameShape must be of type object')
  })

  it('should correctly update d attribute of the Node', () => {
    const el = createPath()

    const frameShp = {
      attributes: {},
      points: [{ x: 10, y: 10, moveTo: true }, { x: 20, y: 10 }]
    }

    updateNode(el, frameShp)

    expect(el.getAttribute('d')).to.equal('M10,10H20')
  })

  it('should correctly update other attributes of the Node', () => {
    const el = createPath()

    const frameShp = {
      attributes: { fill: 'red', 'class': 'potato' },
      points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }]
    }

    updateNode(el, frameShp)

    expect(el.getAttribute('fill')).to.equal('red')
    expect(el.classList.contains('potato')).to.equal(true)
  })

  it('should correctly update other attributes of the group Node', () => {
    const el = createGroup()

    const frameShp = {
      attributes: { fill: 'red' },
      childFrameShapes: [
        { attributes: {}, points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }] },
        { attributes: {}, points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }] }
      ]
    }

    updateNode(el, frameShp)

    expect(el.getAttribute('fill')).to.equal('red')
  })

  it('should correctly update d attributes of the group Node children', () => {
    const el = createGroup()

    const frameShp = {
      attributes: {},
      childFrameShapes: [
        { attributes: {}, points: [{ x: 10, y: 10, moveTo: true }, { x: 20, y: 10 }] },
        { attributes: {}, points: [{ x: 20, y: 20, moveTo: true }, { x: 30, y: 20 }] }
      ]
    }

    updateNode(el, frameShp)

    expect(el.childNodes[ 0 ].getAttribute('d')).to.equal('M10,10H20')
    expect(el.childNodes[ 1 ].getAttribute('d')).to.equal('M20,20H30')
  })

  it('should correctly update other attributes of the group Node childred', () => {
    const el = createGroup()

    const frameShp = {
      attributes: {},
      childFrameShapes: [
        { attributes: { fill: 'black' }, points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }] },
        { attributes: { fill: 'white' }, points: [{ x: 0, y: 0, moveTo: true }, { x: 10, y: 0 }] }
      ]
    }

    updateNode(el, frameShp)

    expect(el.childNodes[ 0 ].getAttribute('fill')).to.equal('black')
    expect(el.childNodes[ 1 ].getAttribute('fill')).to.equal('white')
  })
})
