import { ICommand } from "./i-command";
import { IEvent } from "./i-event";

export interface ICommandHandler<C extends ICommand, E extends IEvent> {
  execute(command: C): Promise<E>;
}
