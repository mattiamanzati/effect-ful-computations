import { ListItem, Todo, User, UserId } from "./types";
import React from "react";
import * as U from "./utils";

async function getListItems(): Promise<ListItem[]> {
  // get all todos
  const todosResponse = await fetch(
    "https://jsonplaceholder.typicode.com/todos"
  );
  const todos: Todo[] = await todosResponse.json();

  // starts all fetch in parallel
  const listItemRequests: Promise<ListItem>[] = todos.map((todo) =>
    fetchTodoListItem(todo)
  );
  return await Promise.all(listItemRequests);
}

async function fetchTodoListItem(todo: Todo): Promise<ListItem> {
  // fetch user data
  const userResponse = await fetch(
    "https://jsonplaceholder.typicode.com/users/" + todo.userId
  );
  const user: User = await userResponse.json();

  // build list item
  return {
    id: todo.id,
    title: todo.title,
    username: user.username,
    completed: todo.completed,
  };
}

export default function TodoList() {
  const [items, setItems] = React.useState<ListItem[]>([]);

  React.useEffect(() => {
    getListItems().then(setItems);
  }, []);

  return (
    <U.TodoListContainer>
      {items.map((listItem) => (
        <U.TodoListEntry key={listItem.id} {...listItem} />
      ))}
    </U.TodoListContainer>
  );
}
