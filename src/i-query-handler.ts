import { IQuery } from "./i-query";
import { IQueryResult } from "./i-query-result";

export interface IQueryHandler<Q extends IQuery, R extends IQueryResult> {
  handle(query: Q): Promise<R>;
}
