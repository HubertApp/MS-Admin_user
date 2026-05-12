import { Document } from 'mongoose';
import { MongooseBaseRepository } from './mongoose-base.repository';

interface TestDoc extends Document {
  name: string;
}

class TestRepository extends MongooseBaseRepository<TestDoc> {}

function makeModel() {
  const exec = jest.fn();
  const MockModel: any = jest.fn().mockImplementation((data: unknown) => ({
    ...((data as object) ?? {}),
    save: jest.fn(),
  }));
  MockModel.find = jest.fn().mockReturnValue({ exec });
  MockModel.findById = jest.fn().mockReturnValue({ exec });
  MockModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec });
  MockModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec });
  return { MockModel, exec };
}

describe('MongooseBaseRepository', () => {
  describe('findAll', () => {
    it('délègue à model.find().exec()', async () => {
      const { MockModel, exec } = makeModel();
      const docs = [{ name: 'a' }, { name: 'b' }];
      exec.mockResolvedValue(docs);

      const result = await new TestRepository(MockModel).findAll();

      expect(MockModel.find).toHaveBeenCalled();
      expect(result).toBe(docs);
    });

    it('retourne un tableau vide quand la collection est vide', async () => {
      const { MockModel, exec } = makeModel();
      exec.mockResolvedValue([]);

      const result = await new TestRepository(MockModel).findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('délègue à model.findById(id).exec()', async () => {
      const { MockModel, exec } = makeModel();
      const doc = { name: 'test' };
      exec.mockResolvedValue(doc);

      const result = await new TestRepository(MockModel).findById('abc123');

      expect(MockModel.findById).toHaveBeenCalledWith('abc123');
      expect(result).toBe(doc);
    });

    it('retourne null quand le document n\'existe pas', async () => {
      const { MockModel, exec } = makeModel();
      exec.mockResolvedValue(null);

      const result = await new TestRepository(MockModel).findById('inexistant');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('instancie le modèle avec les données et appelle save()', async () => {
      const { MockModel } = makeModel();
      const saved = { _id: 'new-id', name: 'Jean' };
      const saveMock = jest.fn().mockResolvedValue(saved);
      MockModel.mockImplementation(() => ({ save: saveMock }));

      const result = await new TestRepository(MockModel).create({ name: 'Jean' } as any);

      expect(MockModel).toHaveBeenCalledWith({ name: 'Jean' });
      expect(saveMock).toHaveBeenCalled();
      expect(result).toBe(saved);
    });
  });

  describe('update', () => {
    it('délègue à model.findByIdAndUpdate avec { new: true }', async () => {
      const { MockModel, exec } = makeModel();
      const updated = { name: 'Marie' };
      exec.mockResolvedValue(updated);

      const result = await new TestRepository(MockModel).update('abc123', { name: 'Marie' } as any);

      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith('abc123', { name: 'Marie' }, { new: true });
      expect(result).toBe(updated);
    });

    it('retourne null quand le document n\'existe pas', async () => {
      const { MockModel, exec } = makeModel();
      exec.mockResolvedValue(null);

      const result = await new TestRepository(MockModel).update('inexistant', {} as any);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('délègue à model.findByIdAndDelete(id).exec()', async () => {
      const { MockModel, exec } = makeModel();
      const deleted = { name: 'Jean' };
      exec.mockResolvedValue(deleted);

      const result = await new TestRepository(MockModel).delete('abc123');

      expect(MockModel.findByIdAndDelete).toHaveBeenCalledWith('abc123');
      expect(result).toBe(deleted);
    });

    it('retourne null quand le document n\'existe pas', async () => {
      const { MockModel, exec } = makeModel();
      exec.mockResolvedValue(null);

      const result = await new TestRepository(MockModel).delete('inexistant');

      expect(result).toBeNull();
    });
  });
});
