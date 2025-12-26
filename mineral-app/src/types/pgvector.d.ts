declare module 'pgvector/pg' {
  export function registerType(Pool: any): void;
  export function toSql(vector: number[]): string;
}

