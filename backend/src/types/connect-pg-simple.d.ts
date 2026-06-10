declare module "connect-pg-simple" {
  import type session from "express-session";

  interface PgStoreOptions {
    conString?: string;
    conObject?: {
      connectionString?: string;
      ssl?: boolean | { rejectUnauthorized?: boolean };
    };
    createTableIfMissing?: boolean;
  }

  function connectPgSimple(sessionModule: typeof session): {
    new (options?: PgStoreOptions): session.Store;
  };

  export default connectPgSimple;
}
