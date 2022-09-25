import { ListItem, Todo, User, UserId } from './types';
import React from 'react';
import * as U from './utils';

async function fetchTodoListItem(todo: Todo, signal: AbortSignal): Promise<ListItem> {
  let retryTimeout = 100;
  while (true) {
    try {
      const userResponse = await fetch('https://jsonplaceholder.typicode.com/users/' + todo.userId, { signal });
      const user: User = await userResponse.json();

      return { ...user, ...todo };
    } catch (e) {
      retryTimeout = Math.max(10000, retryTimeout * 2);
      await waitMillis(retryTimeout, signal);
    }
  }
}

async function getListItems(signal: AbortSignal): Promise<ListItem[]> {
  let result: ListItem[] = [];

  const controller = new AbortController();
  signal.addEventListener('abort', () => controller.abort());

  const todosResponse = await fetch('https://jsonplaceholder.typicode.com/todos');
  const todos: Todo[] = await todosResponse.json();

  const parallelCount = 10;
  for (let i = 0; i < todos.length; i += parallelCount) {
    const requests = todos.slice(i, i + parallelCount).map((todo) => fetchTodoListItem(todo, controller.signal));
    result = result.concat(await Promise.all(requests));
  }

  return result;
}

function waitMillis(millis: number, signal: AbortSignal) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(true), millis);
    signal.addEventListener('abort', () => clearTimeout(timeout));
  });
}

export default function TodoList() {
  const [items, setItems] = React.useState<ListItem[]>([]);

  React.useEffect(() => {
    // start fetching handling interruption
    const controller = new AbortController();
    getListItems(controller.signal).then(setItems);
    return () => controller.abort();
  }, []);

  return (
    <U.TodoListContainer>
      {items.map((listItem) => (
        <U.TodoListEntry key={listItem.id} {...listItem} />
      ))}
    </U.TodoListContainer>
  );
}
