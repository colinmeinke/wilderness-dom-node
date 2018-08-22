# Wilderness DOM node &middot; [![gzip size](http://img.badgesize.io/https://unpkg.com/wilderness-dom-node/dist/wilderness-dom-node.production.js?compression=gzip&label=gzip%20size&style=flat)](https://unpkg.com/wilderness-dom-node/dist/wilderness-dom-node.production.js) [![test coverage](https://img.shields.io/coveralls/colinmeinke/wilderness-dom-node/master.svg?style=flat)](https://coveralls.io/github/colinmeinke/wilderness-dom-node) [![travisci](https://img.shields.io/travis/colinmeinke/wilderness-dom-node.svg?style=flat)](https://travis-ci.org/colinmeinke/wilderness-dom-node) [![npm version](https://img.shields.io/npm/v/wilderness-dom-node.svg?style=flat)](https://www.npmjs.com/package/wilderness-dom-node)

A set of functions to convert between SVG DOM nodes,
Plain Shape Objects and Frame Shapes.

## Definitions

### Plain Shape Object

A Plain Shape Object is the most basic way of defining shapes within
[Wilderness](https://github.com/colinmeinke/wilderness).
The core properties of a Plain Shape Object can be found in the
[SVG Points spec](https://github.com/colinmeinke/svg-points#readme).

### Frame Shape

A Frame Shape is an object commonly used internally within Wilderness.
A Frame Shape has two properties, `attributes` and a `points`
([see the points spec](https://github.com/colinmeinke/points)).

## Functions

### plainShapeObject

The `plainShapeObject` function converts a SVG DOM node to a Plain
Shape Object. It will also add all of the node's HTML attributes as
properties of the Plain Shape Object.

```js
import { plainShapeObject } from 'wilderness-dom-node'

console.log(
  plainShapeObject(document.querySelector('rect'))
)

// {
//   type: 'rect',
//   x: 20,
//   y: 20,
//   width: 60,
//   height: 60,
//   fill: 'yellow'
// }
```

### frameShape

The `frameShape` function converts a SVG DOM node to a Frame Shape.

```js
import { frameShape } from 'wilderness-dom-node'

console.log(
  frameShape(document.querySelector('rect'))
)

// {
//   attributes: {
//     fill: 'yellow'
//   },
//   points: [
//     { x: 20, y: 20, moveTo: true }
//     { x: 80, y: 20 },
//     { x: 80, y: 80 },
//     { x: 20, y: 80 },
//     { x: 20, y: 20 }
//   ]
// }
```

### node

The `node` function converts a Frame Shape to a SVG DOM node.

```js
import { node } from 'wilderness-dom-node'

const frameShape = {
  attributes: {
    fill: 'yellow'
  },
  points: [
    { x: 20, y: 20, moveTo: true }
    { x: 80, y: 20 },
    { x: 80, y: 80 },
    { x: 20, y: 80 },
    { x: 20, y: 20 }
  ]
}

document.querySelector('svg').appendChild(
  node(frameShape)
)
```

### updateNode

The `updateNode` function updates the attributes of a SVG DOM node given
a Frame Shape.

```js
import { updateNode } from 'wilderness-dom-node'

const frameShape = {
  attributes: {
    fill: 'yellow'
  },
  points: [
    { x: 20, y: 20, moveTo: true }
    { x: 80, y: 20 },
    { x: 80, y: 80 },
    { x: 20, y: 80 },
    { x: 20, y: 20 }
  ]
}

updateNode(document.querySelector('.blue-square'), frameShape)
```
