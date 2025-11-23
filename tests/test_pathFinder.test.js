import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PathFinder } from '../src/utils/PathFinder.js';

function makeNode(id, x, y, z, name) {
  return {
    id,
    mesh: {
      name: name || id,
      position: new THREE.Vector3(x, y, z),
      userData: {},
      material: {
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0
      }
    }
  };
}

function makeEdge(startNode, endNode, weight = 1) {
  return {
    startNode,
    endNode,
    metadata: { weight },
    line: { material: { color: new THREE.Color(0xffffff), opacity: 1, transparent: false }, userData: {} }
  };
}

test('PathFinder: BFS shortest path finds simple path', () => {
  const n1 = makeNode('1', 0, 0, 0);
  const n2 = makeNode('2', 1, 0, 0);
  const n3 = makeNode('3', 2, 0, 0);
  const edges = [makeEdge(n1, n2), makeEdge(n2, n3)];
  const nodes = [n1, n2, n3];

  const pf = new PathFinder({ add: () => {}, remove: () => {} }, {});
  pf.initialize(nodes, edges);
  pf.setStartNode(n1);
  pf.setEndNode(n3);
  const path = pf.findShortestPath();
  assert.deepEqual(path.map(n => n.id), ['1', '2', '3']);
});

test('PathFinder: A* finds path and getPathInfo reports distance', () => {
  const n1 = makeNode('1', 0, 0, 0);
  const n2 = makeNode('2', 3, 0, 0);
  const n3 = makeNode('3', 6, 0, 0);
  const edges = [makeEdge(n1, n2, 3), makeEdge(n2, n3, 3)];
  const nodes = [n1, n2, n3];

  const pf = new PathFinder({ add: () => {}, remove: () => {} }, {});
  pf.initialize(nodes, edges);
  pf.setStartNode(n1);
  pf.setEndNode(n3);
  const path = pf.findAStarPath();
  const info = pf.getPathInfo();
  assert.deepEqual(path.map(n => n.id), ['1', '2', '3']);
  assert.equal(info.exists, true);
  assert.equal(info.length, 3);
});
