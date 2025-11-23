import test from 'node:test';
import assert from 'node:assert/strict';
import { FutureDataParser } from '../src/utils/FutureDataParser.js';

const baseData = {
  system: 'Test',
  dataModel: {
    entities: {
      person: { properties: { age: { type: 'continuous', range: [0, 120] }, name: { type: 'categorical', values: [] } } }
    },
    relationships: {
      knows: { properties: { since: { type: 'temporal' } } }
    }
  },
  data: {
    entities: [
      { id: 'a', type: 'person', age: 30, name: 'Alice' },
      { id: 'b', type: 'person', age: 40, name: 'Bob' }
    ],
    relationships: [
      { id: 'ab', type: 'knows', source: 'a', target: 'b', since: '2020-01-01' }
    ]
  },
  visualMappings: {
    defaultPresets: {
      person: { size: { source: 'age', function: 'linear', params: { range: [1, 5] } } }
    }
  }
};

test('FutureDataParser: throws on missing required fields', async () => {
  const parser = new FutureDataParser();
  await assert.rejects(async () => parser.parseData({ dataModel: {}, data: {} }), /Missing required fields/);
});

test('FutureDataParser: parses entities and relationships', async () => {
  const parser = new FutureDataParser();
  const parsed = await parser.parseData(baseData);
  assert.equal(parsed.entities.length, 2);
  assert.equal(parsed.relationships.length, 1);
  assert.ok(parsed.dataModel.entities.person);
  assert.ok(parsed.visualMappings.defaultPresets.person.size);
});

test('FutureDataParser: processes property values according to type', async () => {
  const parser = new FutureDataParser();
  const data = JSON.parse(JSON.stringify(baseData));
  data.data.entities[0].age = '99'; // string that should parse to number and clamp if needed
  const parsed = await parser.parseData(data);
  const alice = parsed.entities.find(e => e.id === 'a');
  assert.equal(typeof alice.properties.age, 'number');
});
