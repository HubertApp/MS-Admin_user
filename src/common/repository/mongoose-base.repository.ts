import { Model, Document } from 'mongoose';
import { IRepository } from '../interface/repository.interface';

export abstract class MongooseBaseRepository<T extends Document> implements IRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async findAll(): Promise<T[]> {
    return this.model.find().exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async create(item: Partial<T>): Promise<T> {
    const createdItem = new this.model(item);
    return createdItem.save() as Promise<T>;
  }

  async update(id: string, item: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, item, { new: true }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}