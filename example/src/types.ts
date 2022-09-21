export type UserId = number;
export interface User {
  id: UserId;
  username: string;
}

export type TodoId = number;
export interface Todo {
  id: TodoId;
  userId: UserId;
  title: string;
  completed: boolean;
}

export interface ListItem {
  id: TodoId;
  title: string;
  completed: boolean
  username: string;
}
