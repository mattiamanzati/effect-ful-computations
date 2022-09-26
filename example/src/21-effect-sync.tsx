import { ListItem, Todo, User, UserId } from "./types";
import React from "react";
import * as U from "./utils";
import * as Effect from "@effect/core/io/Effect";
import * as Exit from "@effect/core/io/Exit";
import * as Chunk from "@tsplus/stdlib/collections/Chunk";
import { pipe } from "@tsplus/stdlib/data/Function";

const getTodos = Effect.sync(() => U.TODOS);
// ^? T.Effect<never, never, Todo[]>

class UserNotFound {
  readonly _tag = "UserNotFound";
  constructor(readonly userId: UserId) {}
}

const getUser = (userId: UserId) =>
  pipe(
    Effect.sync(() => U.USERS.find((e) => e.id === userId)),
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
    Effect.forEach(todos, (todo) => fetchListItem(todo))
  ),
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
