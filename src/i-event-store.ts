import { IEvent } from "./i-event";

export interface IEventStore {
  publish(event: IEvent): Promise<boolean>;
}
