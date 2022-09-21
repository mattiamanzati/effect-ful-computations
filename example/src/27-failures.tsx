import { ListItem, Todo, User, UserId } from "./types";
import React from "react";
import * as U from "./utils";
import * as Effect from "@effect/core/io/Effect";
import * as FiberId from "@effect/core/io/FiberId";
import * as Exit from "@effect/core/io/Exit";
import * as Schedule from "@effect/core/io/Schedule";
import * as Chunk from "@tsplus/stdlib/collections/Chunk";
import * as Either from "@tsplus/stdlib/data/Either";
import { pipe } from "@tsplus/stdlib/data/Function";
import * as Duration from "@tsplus/stdlib/data/Duration";

class FetchError {
  readonly _tag = "FetchError";
  constructor(readonly error: unknown) {}
}

export const request = (input: RequestInfo, init?: RequestInit | undefined) =>
  Effect.asyncInterrupt<never, FetchError, Response>((resume) => {
    const controller = new AbortController();
    fetch(input, { ...(init ?? {}), signal: controller.signal })
      .then((response) => {
        resume(Effect.succeed(response));
      })
      .catch((error) => {
        resume(Effect.fail(new FetchError(error)));
      });
    return Either.left(
      Effect.succeed(() => {
        controller.abort();
      })
    );
  });
// ^- (input: RequestInfo, init?: RequestInit) => Effect<never, FetchError, Response>

class JsonBodyError {
  readonly _tag = "JsonBodyError";
  constructor(readonly error: unknown) {}
}

const decodeJson = function <T>(response: Response) {
  return Effect.tryCatchPromise(
    () => response.json() as Promise<T>,
    (error: unknown) => new JsonBodyError(error)
  );
};

const getTodos = pipe(
  request("https://jsonplaceholder.typicode.com/todos"),
  Effect.flatMap((response) => decodeJson<Todo[]>(response)),
  Effect.retry(
    pipe(
      Schedule.exponential(Duration.millis(100), 2),
      Schedule.whileInput((error: FetchError | JsonBodyError) => error._tag !== "JsonBodyError")
    )
  )
);
// ^- Effect<never, FetchError | JsonBodyError, Todo[]>

class UserNotFound {
  readonly _tag = "UserNotFound";
  constructor(readonly userId: UserId) {}
}

const getUser = (userId: UserId) =>
  pipe(
    request("https://jsonplaceholder.typicode.com/users/" + userId),
    Effect.flatMap((response) => decodeJson<User>(response))
  );
// ^- (userId: UserId) => T.Effect<never, UserNotFound, User>

const getUserName = (userId: UserId) => pipe(
    getUser(userId),
    Effect.map(user => user.username),
    Effect.catchTag("JsonBodyError", () => Effect.succeed("User#" + userId)),
    Effect.catchTag("UserNotFound", () => Effect.succeed("DeletedUser#" + userId)),
    Effect.orDie
)
// ^- Effect<never, never, string>

const fetchListItem = (todo: Todo) =>
  pipe(
    getUserName(todo.userId),
    Effect.map((username) => ({
      id: todo.id,
      username: username,
      title: todo.title,
      completed: todo.completed,
    }))
  );
// ^- (todo: Todo) => T.Effect<never, never, ListItem>

const getListItems = pipe(
  getTodos,
  Effect.flatMap((todos) =>
    Effect.forEachPar(todos, (todo) => fetchListItem(todo))
  ),
  Effect.withParallelism(10),
  Effect.map((e) => Array.from(Chunk.toCollection(e)))
);
// ^- T.Effect<never, UserNotFound, ListItem[]>

export default function TodoList() {
  const [items, setItems] = React.useState<ListItem[]>([]);

  React.useEffect(() => {
    const interrupt = Effect.unsafeRunWith(getListItems, (ex) => {
      if (Exit.isSuccess(ex)) {
        setItems(ex.value);
      } else {
        console.error(ex.cause);
      }
    });
    return () => interrupt(FiberId.none)((_) => undefined);
  }, []);

  return (
    <U.TodoListContainer>
      {items.map((listItem) => (
        <U.TodoListEntry key={listItem.id} {...listItem} />
      ))}
    </U.TodoListContainer>
  );
}
