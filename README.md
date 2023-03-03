# Events

### What is Events?

Events is a simple `Typescript/Javascript` framework to provide you with a 
solution to design your applications based around a CQQRS/Event Sourcing 
architecture.

The goal of this package is to provide a standard structure to how to event 
store applications.

This framework provides a simple way to implement event souring with any 
setup your stack requires. 

Events, Commands, States, Handlers, Projectors, Services all provided via 
basic abstractions.

This package does heavily reply on Typescript and is highly recommended

# installation

`npm i --save @libertytree/events`

## Command Handling:

### Creating our Command, Events & State Objects

```ts
import { ICommand, IEvent, IState } from "@libertytree/events";
interface AddItemToCartCommand extends ICommand {
  sku: string;
}

/**
 * Our event will be the output of the command.
 * This will be what we store for our Source of Truth.
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

/**
 * Our stateful object.
 * Here will be what our Data looks like once fully aggregated
 **/
interface CartState extends IState {
  items: Array<Product>;
}
```

### Creating our Command Handlers & Projectors

```ts
import { ICommandHandler, IProjector } from "@libertytree/events";

/**
 * This is where we implement our logic to turn the command into a
 * valid event and how the event projects onto state.
 *
 * The event should hold static values, this is very important for
 * projections
 **/

// Our Command Handler Interface, which will combing the relationship between 
// the Command and the event

interface IAddItemToCartCommandHandler
  extends ICommandHandler<AddItemToCartCommand, ItemAddedToCartEvent> {}

// Our implementation. We look here into our 'database' to enrich the event's 
// details

class AddItemToCartCommandHandler implements IAddItemToCartCommandHandler {
  async execute(command: AddItemToCartCommand): Promise<ItemAddedToCartEvent> {
    const event: ItemAddedToCartEvent = new ItemAddedToCartEvent(fakeProductDatabase[command.sku]);
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
```

## Now you've set everything up, let's tie everything together..

### Lets have a look at an example:

```ts
import { IEventStore, EventBasedService } from "@libertytree/events";

//Our Event DataStore,where we implement how & where our Events are stored
class EventStore implements IEventStore {
  async publish(event: IEvent): Promise<boolean> {
    globalEventStore.push(event);
    return true;
  }
}

/**
 * Our EventBasedService implementation, where we bring all the above together 
 * in one place, giving us an easy implementation to achieve everything we want
 * getCurrentState and updateState are the only 2 methods we need now, to put 
 * all of our pieces together
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
```

```ts
//we can then instantiate the service and it's respective components
const commandHandler = new AddItemToCartCommandHandler();
const projector = new AddItemProjector();
const eventStore = new EventStore();
const addItemToCartService = new AddItemToCartService(commandHandler, projector, eventStore);
await addItemToCartService.execute(addRaceCarToy);
```

## Queries & Query handlers

### Queryies and QueryHandlers are provided to offer a full solution to CQRS. 
### This is not implemented for sourcing queries. This is an optional structure 
### for querying

```ts
import { IQuery } from "./i-query";
import { IQueryHandler } from "./i-query-handler";
import { IQueryResult } from "./i-query-result";
//fish model
interface Fish {
  type: string;
  name: string;
}
//query implementation
class GetBoughtFishQuery implements IQuery {
  date: Date;
  fishType: string;
}
//query result
class BoughtFishQueryResult implements IQueryResult {
  fishAmt: Fish[];
}
//query handler
class GetBoughtFishQueryHandler
  implements IQueryHandler<GetBoughtFishQuery, BoughtFishQueryResult> {
  async handle(query: GetBoughtFishQuery): Promise<BoughtFishQueryResult> {
    //implement your query via your IQuery implementation
    const result: BoughtFishQueryResult = {
      fishAmt: [],
    };
    //return your result
    return result;
  }
}
```

# Congrats, You now have an event sources Shopping cart!

## If you want to go further:

### Event Sourcing is a complex topic, which has a verity of implementations and 
### flavours. This package is designed to provide an architectural structure for 
### how to make a service request fully event sourced.

### Please do go into further readings on the topic and have a play around.

### I am always happy to be getting feedback, If you would like to contact me, 
### please email us at: ossgroupp@protonmail.com
