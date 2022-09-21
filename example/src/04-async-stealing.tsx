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
  const workerCount = 5
  const workers: Promise<void>[] = []
  let jobIndex = 0
  for(let i = 0; i < workerCount; i++){
    // start a job-stealing worker
    workers.push((async function(){
        while(jobIndex < todos.length){
            const todo = todos[jobIndex]
            jobIndex++
            result[jobIndex] = await fetchTodoListItem(todo)
        }
    })())
  }

  // wait for all workers to finish
  await Promise.all(workers)

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
