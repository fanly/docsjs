// Minimal profile manager stubs for tests
export const SYSTEM_PROFILES: any = {};

export class ProfileManager {
  addProfile(_p: any): void {}
  getProfile(_name: string): any {
    return null;
  }
  findProfile(_name: string): any {
    return null;
  }
  list(): string[] {
    return [];
  }
}
