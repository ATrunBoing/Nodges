import test from 'node:test';
import assert from 'node:assert/strict';
import { DataModelValidator } from '../src/utils/DataModelValidator.js';

const makeValidData = () => ({
  system: 'Test System',
  dataModel: {
    entities: {
      default: {
        properties: {
          score: { type: 'continuous', range: [0, 100] },
          tag: { type: 'categorical', values: ['A', 'B'] },
          vec: { type: 'vector', dimensions: ['x', 'y'] },
          loc: { type: 'spatial', coordinates: ['x', 'y', 'z'] },
          active: { type: 'boolean' }
        }
      }
    },
    relationships: {
      default: {
        properties: {
          weight: { type: 'continuous', range: [0, 10] }
        }
      }
    }
  },
  data: {
    entities: [
      { id: 'n1', type: 'default', score: 50, tag: 'A', vec: { x: 1, y: 2 }, loc: { x: 0, y: 0, z: 0 }, active: true },
      { id: 'n2', type: 'default', score: 75, tag: 'B', vec: { x: 3, y: 4 }, loc: { x: 1, y: 1, z: 1 }, active: false }
    ],
    relationships: [
      { id: 'e1', type: 'default', source: 'n1', target: 'n2', weight: 5 }
    ]
  }
});

test('DataModelValidator: valid data passes with no errors', () => {
  const validator = new DataModelValidator();
  const data = makeValidData();
  const res = validator.validate(data);
  assert.equal(res.isValid, true);
  assert.equal(res.errors.length, 0);
});

test('DataModelValidator: missing required fields produces errors', () => {
  const validator = new DataModelValidator();
  const bad = { dataModel: {}, data: { entities: [] } }; // missing system
  const res = validator.validate(bad);
  assert.equal(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('Missing required field: system')));
});

test('DataModelValidator: auto-correct fills metadata defaults without changing validity', () => {
  const validator = new DataModelValidator();
  const data = makeValidData();
  // remove only metadata to avoid breaking id references
  delete data.metadata;
  const res = validator.validate(data);
  assert.equal(res.isValid, true);
  assert.ok(res.autoCorrections.length >= 1);
  assert.ok(res.correctedData.metadata.created);
  assert.equal(res.correctedData.metadata.version, '1.0');
});
