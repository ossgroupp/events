import { IEvent } from "./i-event";
import { IState } from "./i-state";

export interface IProjector<Event extends IEvent, State extends IState> {
  project(currentState: State, event: Event): Promise<State>;
}
