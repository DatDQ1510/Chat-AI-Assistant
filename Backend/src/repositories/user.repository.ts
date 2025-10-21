import { User } from "../models/user.model";

class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }
}

export default new UserRepository();