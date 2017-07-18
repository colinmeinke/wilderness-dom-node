# Wilderness DOM node

Converts SVG DOM node <> Frame Shape.

**Only 2.7kb gzipped.**

Firstly, let's define a *Frame Shape*. A Frame Shape is an object
commonly used internally within
[Wilderness](https://github.com/colinmeinke/wilderness).
A Frame Shape has two properties, `attributes` and a `points`
[see the points spec](https://github.com/colinmeinke/points).

## frameShape

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

## node

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
