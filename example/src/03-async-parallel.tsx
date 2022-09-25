import { ListItem, Todo, User, UserId } from './types';
import React from 'react';
import * as U from './utils';

async function getListItems(): Promise<ListItem[]> {
  const todosResponse = await fetch('https://jsonplaceholder.typicode.com/todos');
  const todos: Todo[] = await todosResponse.json();

  const listItemRequests: Promise<ListItem>[] = todos.map((todo) => fetchTodoListItem(todo));
  return await Promise.all(listItemRequests);
}

async function fetchTodoListItem(todo: Todo): Promise<ListItem> {
  const userResponse = await fetch('https://jsonplaceholder.typicode.com/users/' + todo.userId);
  const user: User = await userResponse.json();

  return { ...user, ...todo };
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
