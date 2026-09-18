import { Injectable } from "@nestjs/common";
import { hash, verify } from "@node-rs/argon2";
import { ARGON2_OPTIONS } from "./password.constants.js";

@Injectable()
export class PasswordService {
  /*
    A real Argon2id hash of a random value, used when an account does not
    exist. Verifying against it costs the same as a real check, so the time a
    sign-in takes does not reveal whether the email is registered.
  */
  private readonly dummyHash = hash(crypto.randomUUID(), ARGON2_OPTIONS);

  hash(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  }

  async verify(storedHash: string, password: string): Promise<boolean> {
    try {
      return await verify(storedHash, password);
    } catch {
      // A malformed hash is a failed match, never a 500.
      return false;
    }
  }

  async verifyAgainstDummy(password: string): Promise<false> {
    await this.verify(await this.dummyHash, password);

    return false;
  }
}
