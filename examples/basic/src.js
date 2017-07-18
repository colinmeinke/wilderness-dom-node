import { frameShape, node } from '../../src'

const svg = document.querySelector('svg')
const rect = svg.querySelector('rect')
const shape = frameShape(rect)

setTimeout(() => {
  svg.removeChild(rect)
}, 2500)

setTimeout(() => {
  shape.attributes.stroke = 'red'
  svg.appendChild(node(shape))
}, 5000)
