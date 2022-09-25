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

  const parallelCount = 10;
  for (let i = 0; i < todos.length; i += parallelCount) {
    const requests = todos.slice(i, i + parallelCount).map(todo => fetchTodoListItem(todo));
    result = result.concat(await Promise.all(requests));
  }

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
