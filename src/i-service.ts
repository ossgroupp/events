import { ICommand } from "./i-command";
import { ICommandHandler } from "./i-command-handler";
import { IEvent } from "./i-event";
import { IProjector } from "./i-projector";
import { IState } from "./i-state";
import { IEventStore } from "./i-event-store";

export interface IService {
  execute(command: ICommand): Promise<IState>;
}

export abstract class EventBasedService<
  Command extends ICommand,
  Event extends IEvent,
  State extends IState
> implements IService {
  protected abstract updateState(state: State): Promise<void>;
  protected abstract getCurrentState(event: Event): Promise<State>;

  constructor(
    private commandHandler: ICommandHandler<Command, Event>,
    private projector: IProjector<Event, State>,
    private eventStore: IEventStore
  ) {}

  async execute(command: Command): Promise<State> {
    const event = await this.commandHandler.execute(command);
    const currentState = await this.getCurrentState(event);
    const newState = await this.projector.project(currentState, event);
    await this.updateState(newState);
    await this.eventStore.publish(event);
    return newState;
  }
}
