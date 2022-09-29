import { ListItem, Todo, User, UserId } from "./types";
import React from "react";
import * as U from "./utils";
import * as Effect from "@effect/core/io/Effect";
import * as Exit from "@effect/core/io/Exit";
import * as Chunk from "@tsplus/stdlib/collections/Chunk";
import { pipe } from "@tsplus/stdlib/data/Function";

class FetchError {
  readonly _tag = "FetchError";
  constructor(readonly error: unknown) {}
}

export const request = (input: RequestInfo, init?: RequestInit | undefined) =>
  Effect.tryCatchPromise(
    () => fetch(input, init),
    (error: unknown) => new FetchError(error)
  );
// ^? (input: RequestInfo, init?: RequestInit) => Effect<never, FetchError, Response>

class JsonBodyError {
  readonly _tag = "JsonBodyError";
  constructor(readonly error: unknown) {}
}

const decodeJson = function<T>(response: Response) {
  return Effect.tryCatchPromise(
    () => response.json() as Promise<T>,
    (error: unknown) => new JsonBodyError(error)
  );
}

const getTodos = pipe(
    request("https://jsonplaceholder.typicode.com/todos"),
    Effect.flatMap(response => decodeJson<Todo[]>(response))
);
// ^? Effect<never, FetchError | JsonBodyError, Todo[]>

class UserNotFound {
  readonly _tag = "UserNotFound";
  constructor(readonly userId: UserId) {}
}

const getUser = (userId: UserId) =>
  pipe(
    request("https://jsonplaceholder.typicode.com/users/" + userId),
    Effect.flatMap(response => decodeJson<User>(response)),
    Effect.flatMap((user) =>
      user ? Effect.succeed(user) : Effect.fail(new UserNotFound(userId))
    )
  );
// ^? (userId: UserId) => T.Effect<never, UserNotFound, User>

const fetchListItem = (todo: Todo) =>
  pipe(
    getUser(todo.userId),
    Effect.map((user) => ({
      id: todo.id,
      username: user.username,
      title: todo.title,
      completed: todo.completed,
    }))
  );
// ^? (todo: Todo) => T.Effect<never, UserNotFound, ListItem>

const getListItems = pipe(
  getTodos,
  Effect.flatMap((todos) =>
    Effect.forEachPar(todos, (todo) => fetchListItem(todo))
  ),
  Effect.withParallelism(5),
  Effect.map((e) => Array.from(Chunk.toCollection(e)))
);
// ^? T.Effect<never, UserNotFound, ListItem[]>

export default function TodoList() {
  const [items, setItems] = React.useState<ListItem[]>([]);

  React.useEffect(() => {
    Effect.unsafeRunWith(getListItems, (ex) => {
      if (Exit.isSuccess(ex)) {
        setItems(ex.value);
      } else {
        console.error(ex.cause);
      }
    });
  }, []);

  return (
    <U.TodoListContainer>
      {items.map((listItem) => (
        <U.TodoListEntry key={listItem.id} {...listItem} />
      ))}
    </U.TodoListContainer>
  );
}
