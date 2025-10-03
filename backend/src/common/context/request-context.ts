import { AsyncLocalStorage } from 'async_hooks';

export interface IRequestContextStore {
  userId?: string;
  tenantId?: string;
}

class RequestContextClass {
  private als = new AsyncLocalStorage<IRequestContextStore>();

  run(store: IRequestContextStore, cb: () => void) {
    this.als.run(store, cb);
  }

  get(): IRequestContextStore | undefined {
    return this.als.getStore();
  }
}

export const RequestContext = new RequestContextClass();
