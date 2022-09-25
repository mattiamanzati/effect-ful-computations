import { ListItem, Todo, User } from './types';
import React from 'react';
import * as U from './utils';

function getListItems(): ListItem[] {
  const result: ListItem[] = [];

  for (let todo of U.TODOS) {
    const user: User = U.USERS.find((e) => e.id === todo.userId)!;
    result.push({ ...user, ...todo });
  }
  return result;
}

export default function TodoList() {
  const items: ListItem[] = getListItems();

  return (
    <U.TodoListContainer>
      {items.map((listItem) => (
        <U.TodoListEntry key={listItem.id} {...listItem} />
      ))}
    </U.TodoListContainer>
  );
}
