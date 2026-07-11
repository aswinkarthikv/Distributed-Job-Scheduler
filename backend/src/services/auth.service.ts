import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { organizationRepository } from '../repositories/organization.repository';
import { CONFIG } from '../config';

export class AuthService {
  async register(data: { name: string; email: string; password: string; orgName: string }) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email address is already in use.');
    }

    // 1. Create Organization
    const organization = await organizationRepository.create(data.orgName);

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 3. Create User
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      organizationId: organization.id
    });

    // 4. Generate Token
    const token = this.generateToken(user.id, user.email, organization.id);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: {
          id: organization.id,
          name: organization.name
        }
      }
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password credentials.');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password credentials.');
    }

    const token = this.generateToken(user.id, user.email, user.organizationId);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: {
          id: user.organization.id,
          name: user.organization.name
        }
      }
    };
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      organization: {
        id: user.organization.id,
        name: user.organization.name
      }
    };
  }

  private generateToken(userId: string, email: string, organizationId: string): string {
    return jwt.sign(
      { id: userId, email, organizationId },
      CONFIG.jwtSecret,
      { expiresIn: '7d' }
    );
  }
}
export const authService = new AuthService();
