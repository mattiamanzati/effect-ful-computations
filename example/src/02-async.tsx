import { ListItem, Todo, User, UserId } from './types';
import React from 'react';
import * as U from './utils';

async function getListItems(): Promise<ListItem[]> {
  const result: ListItem[] = [];

  // get all todos
  const todosResponse = await fetch('https://jsonplaceholder.typicode.com/todos');
  const todos: Todo[] = await todosResponse.json();

  for (let todo of todos) {
    // get its assigned user data
    const userResponse = await fetch('https://jsonplaceholder.typicode.com/users/' + todo.userId);
    const user: User = await userResponse.json();

    // push the list item into result
    result.push({...user, ...todo});
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
