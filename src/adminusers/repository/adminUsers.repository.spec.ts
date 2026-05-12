import { AdminUsersRepository } from './adminUsers.repository';

function makeModel() {
  const exec = jest.fn();
  const MockModel: any = jest.fn();
  MockModel.find = jest.fn().mockReturnValue({ exec });
  MockModel.findById = jest.fn().mockReturnValue({ exec });
  MockModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec });
  MockModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec });
  MockModel.findOne = jest.fn().mockReturnValue({ exec });
  return { MockModel, exec };
}

describe('AdminUsersRepository', () => {
  describe('findByEmail', () => {
    it('retourne l\'admin correspondant à l\'email', async () => {
      const { MockModel, exec } = makeModel();
      const admin = { email: 'jean@example.com' };
      exec.mockResolvedValue(admin);

      const repo = new AdminUsersRepository(MockModel);
      const result = await repo.findByEmail('jean@example.com');

      expect(MockModel.findOne).toHaveBeenCalledWith({ email: 'jean@example.com' });
      expect(result).toBe(admin);
    });

    it('retourne null si aucun admin ne correspond à l\'email', async () => {
      const { MockModel, exec } = makeModel();
      exec.mockResolvedValue(null);

      const repo = new AdminUsersRepository(MockModel);
      const result = await repo.findByEmail('inconnu@example.com');

      expect(result).toBeNull();
    });
  });
});
