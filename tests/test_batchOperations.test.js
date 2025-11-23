import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BatchOperations } from '../src/utils/BatchOperations.js';

function makeMaterial(colorHex = 0xffffff) {
  return { color: new THREE.Color(colorHex) };
}

function makeNodeObject(id, colorHex = 0x123456, size = 1) {
  const mesh = {
    name: id,
    position: new THREE.Vector3(),
    scale: new THREE.Vector3(1,1,1),
    material: makeMaterial(colorHex)
  };
  const node = {
    id,
    mesh,
    position: { x: 0, y: 0, z: 0 },
    metadata: {},
    options: { color: colorHex, size, type: 'sphere' },
    setType: (t) => { node.options.type = t; }
  };
  const obj = { userData: { type: 'node', node }, position: mesh.position, scale: mesh.scale, material: mesh.material };
  return obj;
}

function makeSelectionManager(objs) {
  return {
    getSelectedObjects: () => objs,
    getSelectedNodes: () => objs.filter(o => o.userData.type === 'node'),
    getSelectedEdges: () => objs.filter(o => o.userData.type === 'edge')
  };
}

test('BatchOperations: changeColor updates materials and history, undo restores', () => {
  const o1 = makeNodeObject('n1', 0x111111);
  const sel = makeSelectionManager([o1]);
  const ops = new BatchOperations(sel, null);

  ops.changeColor(0xff0000);
  assert.equal(o1.material.color.getHex(), 0xff0000);
  assert.equal(ops.getHistory().length, 1);

  ops.undo();
  assert.equal(o1.material.color.getHex(), 0x111111);
});

test('BatchOperations: moveObjects and undo', () => {
  const o1 = makeNodeObject('n1');
  const sel = makeSelectionManager([o1]);
  const ops = new BatchOperations(sel, null);

  ops.moveObjects(new THREE.Vector3(1,2,3));
  assert.deepEqual(o1.position, new THREE.Vector3(1,2,3));
  ops.undo();
  assert.deepEqual(o1.position, new THREE.Vector3(0,0,0));
});

test('BatchOperations: changeSize scales node and records history', () => {
  const o1 = makeNodeObject('n1', 0x111111, 2);
  const sel = makeSelectionManager([o1]);
  const ops = new BatchOperations(sel, null);

  ops.changeSize(4);
  // scale multiplied by 2
  assert.equal(o1.scale.x, 2);
  assert.equal(o1.scale.y, 2);
  assert.equal(o1.scale.z, 2);
  assert.equal(ops.getHistory().length, 1);
});
