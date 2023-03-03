import {
  EventBasedService,
  ICommand,
  ICommandHandler,
  IEvent,
  IEventStore,
  IProjector,
  IState,
} from "../../src/app";

type Product = {
  name: string;
  price: number;
  sku: string;
};

describe("An EventBasedService ", () => {
  // Our Fake Product Database
  const fakeProductDatabase: { [key: string]: Product } = {
    SKRCT: { name: "RaceCar Toy", price: 34.34, sku: "SKRCT" },
    SKGHF: { name: "Gaming Headphones", price: 19.34, sku: "SKGHF" },
  };
  //Our command will add an item to the cart
  interface AddItemToCartCommand extends ICommand {
    sku: string;
  }

  /**
   * Our Event Will be the output of the command. This will be what we store, for our Source of Truth.
   * You should always Increment your event versions when/if you ever want to change an event's implementation,
   * Don't change you're current code, rewrite your event/projection
   **/
  class ItemAddedToCartEvent implements IEvent {
    eventName = "ItemAddedToCart";
    version: 1;
    timestamp: Date;
    item: Product;

    constructor(item: Product, timestamp?: Date) {
      this.item = item;
      this.timestamp = timestamp || new Date();
    }
  }

  //Oour stateful object. Here will be what our Data looks like once fully aggregated
  interface CartState extends IState {
    items: Array<Product>;
  }

  // Our Command Handler Interface, which wil combign the relationship between the Command and the event
  interface IAddItemToCartCommandHandler
    extends ICommandHandler<AddItemToCartCommand, ItemAddedToCartEvent> {}

  //Our implementation. We look here into our 'database' to enrich the event's details
  class AddItemToCartCommandHandler implements IAddItemToCartCommandHandler {
    async execute(command: AddItemToCartCommand): Promise<ItemAddedToCartEvent> {
      const event: ItemAddedToCartEvent = new ItemAddedToCartEvent(
        fakeProductDatabase[command.sku]
      );
      return event;
    }
  }
  //Our Projector, where we apply the changes to state based off the event aggregate
  class AddItemProjector implements IProjector<ItemAddedToCartEvent, CartState> {
    async project(currentState: CartState, event: ItemAddedToCartEvent): Promise<CartState> {
      return {
        index: currentState.index + 1,
        items: [...currentState.items, event.item],
      };
    }
  }
  //Our Event DataStore,where we implement how & where our Events are stored
  class EventStore implements IEventStore {
    async publish(event: IEvent): Promise<boolean> {
      globalEventStore.push(event);
      return true;
    }
  }

  /**
   * Our EventBasedService implementation, where we bring all the above together in one place, giving us an easy implementation to achieve everything we want
   * getCurrentState and updateState are the only 2 methods we need now, to put all of our pieces together
   **/
  class AddItemToCartService extends EventBasedService<
    AddItemToCartCommand,
    ItemAddedToCartEvent,
    CartState
  > {
    constructor(
      commandHandler: AddItemToCartCommandHandler,
      addItem: AddItemProjector,
      store: EventStore
    ) {
      super(commandHandler, addItem, store);
    }
    //here we are updating our state to take the latest changes
    protected async updateState(state: CartState): Promise<void> {
      globalState = state;
    }

    //here we implement how we get our current state from our event
    protected async getCurrentState(_: ItemAddedToCartEvent): Promise<CartState> {
      return globalState;
    }
  }

  const addRaceCarToy: AddItemToCartCommand = { sku: fakeProductDatabase["SKRCT"].sku };
  const addGamingHeadphones: AddItemToCartCommand = { sku: fakeProductDatabase["SKGHF"].sku };

  /**
   * We are going to make an event based cart Application, this whole application
   * will be event sourced and store, and keep the events and states all stored for us
   * **/
  let globalState: CartState;
  let globalEventStore: Array<IEvent>;
  let commandHandler: AddItemToCartCommandHandler;
  let projector: AddItemProjector;
  let eventStore: EventStore;
  let service: AddItemToCartService;

  beforeEach(() => {
    commandHandler = new AddItemToCartCommandHandler();
    projector = new AddItemProjector();
    eventStore = new EventStore();
    service = new AddItemToCartService(commandHandler, projector, eventStore);
    globalState = {
      items: [],
      index: 0,
    };
    globalEventStore = [];
  });

  it("Will execute, projecting events into a store", async () => {
    await service.execute(addRaceCarToy);
    expect(globalEventStore.length).toBe(1);
    await service.execute(addRaceCarToy);
    expect(globalEventStore.length).toBe(2);
    globalEventStore.forEach((event) => {
      expect(event.eventName).toBe("ItemAddedToCart");
    });
  });

  it("Will execute, building up state", async () => {
    const commandHandler = new AddItemToCartCommandHandler();
    const projector = new AddItemProjector();
    const eventStore = new EventStore();

    const service = new AddItemToCartService(commandHandler, projector, eventStore);
    expect(globalState.index).toBe(0);
    expect(globalState.items.length).toBe(0);
    await service.execute(addRaceCarToy);
    expect(globalState.index).toBe(1);
    expect(globalState.items[0].name).toBe("RaceCar Toy");
    await service.execute(addGamingHeadphones);
    expect(globalState.index).toBe(2);
    expect(globalState.items.length).toBe(2);
    expect(globalState.items[1].name).toBe("Gaming Headphones");
  });
});
