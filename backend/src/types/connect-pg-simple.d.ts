declare module "connect-pg-simple" {
  import type session from "express-session";

  interface PgStoreOptions {
    conString?: string;
    createTableIfMissing?: boolean;
  }

  function connectPgSimple(sessionModule: typeof session): {
    new (options?: PgStoreOptions): session.Store;
  };

  export default connectPgSimple;
}
