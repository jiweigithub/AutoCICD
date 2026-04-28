export interface VaultClient {
  read(path: string): Promise<Record<string, string>>;
  write(path: string, data: Record<string, string>): Promise<void>;
  delete(path: string): Promise<void>;
}

export class NoopVaultClient implements VaultClient {
  private store = new Map<string, Record<string, string>>();

  async read(path: string): Promise<Record<string, string>> {
    return this.store.get(path) ?? {};
  }

  async write(path: string, data: Record<string, string>): Promise<void> {
    this.store.set(path, { ...data });
  }

  async delete(path: string): Promise<void> {
    this.store.delete(path);
  }
}

let vaultInstance: VaultClient | null = null;

export function setVaultClient(client: VaultClient): void {
  vaultInstance = client;
}

export function getVaultClient(): VaultClient {
  return vaultInstance ?? new NoopVaultClient();
}
