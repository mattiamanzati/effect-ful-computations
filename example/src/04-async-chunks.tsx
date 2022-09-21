import { ListItem, Todo, User, UserId } from "./types";
import React from "react";
import * as U from "./utils";

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

async function getListItems(): Promise<ListItem[]> {
  // get all todos
  const todosResponse = await fetch(
    "https://jsonplaceholder.typicode.com/todos"
  );
  const todos: Todo[] = await todosResponse.json();

  let result: ListItem[] = []
  const parallelCount = 10
  for(let i = 0; i < todos.length; i+= parallelCount){
    // start a batch of requests and wait to finish
    const requests = todos.slice(i, i + parallelCount).map(fetchTodoListItem)
    result = result.concat(await Promise.all(requests))
  }

  return result
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
