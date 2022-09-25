import { ListItem, Todo, User, UserId } from './types';
import React from 'react';
import * as U from './utils';

async function fetchTodoListItem(todo: Todo): Promise<ListItem> {
  const userResponse = await fetch('https://jsonplaceholder.typicode.com/users/' + todo.userId);
  const user: User = await userResponse.json();

  return { ...user, ...todo };
}

async function getListItems(): Promise<ListItem[]> {
  let result: ListItem[] = [];

  const todosResponse = await fetch('https://jsonplaceholder.typicode.com/todos');
  const todos: Todo[] = await todosResponse.json();

  let nextJobIndex = 0;
  async function worker() {
    while (nextJobIndex < todos.length) {
      const jobIndex = nextJobIndex++
      result[jobIndex] = await fetchTodoListItem(todos[jobIndex]);
    }
  }

  const workerCount = 5;
  const workers: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  return result;
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
