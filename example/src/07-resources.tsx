import { ListItem, Todo, User, UserId } from "./types";
import React from "react";
import * as U from "./utils";

async function fetchTodoListItem(
  todo: Todo,
  signal: AbortSignal,
  spinner: LoadingSpinner
): Promise<ListItem> {
  let retryTimeout = 100;
  while (true) {
    // fetch user data
    const release = spinner.acquire()
    try{
        const userResponse = await fetch(
          "https://jsonplaceholder.typicode.com/users/" + todo.userId,
          { signal }
        );

        if (userResponse.status === 200) {
            // build list item
            const user: User = await userResponse.json();
            return {
              id: todo.id,
              title: todo.title,
              username: user.username,
              completed: todo.completed,
            };
          } else {
            // wait an exponential timeout and retry
            retryTimeout = retryTimeout * 2;
            await waitMillis(retryTimeout, signal);
          }
    }finally{
        release()
    }
  }
}

async function getListItems(signal: AbortSignal, spinner: LoadingSpinner): Promise<ListItem[]> {
  // create abort signal
  const controller = new AbortController();
  signal.addEventListener("abort", () => controller.abort());

  // get all todos
  const todosResponse = await fetch(
    "https://jsonplaceholder.typicode.com/todos",
    { signal: controller.signal }
  );
  const todos: Todo[] = await todosResponse.json();

  let result: ListItem[] = [];
  const parallelCount = 10;
  for (let i = 0; i < todos.length; i += parallelCount) {
    // start a batch of requests and wait to finish
    const requests = todos
      .slice(i, i + parallelCount)
      .map((todo) => fetchTodoListItem(todo, controller.signal, spinner));
    result = result.concat(await Promise.all(requests));
  }

  return result;
}

// waits for millis, aborting if signaled.
function waitMillis(millis: number, signal: AbortSignal) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(true), millis);
    signal.addEventListener("abort", () => clearTimeout(timeout));
  });
}

class LoadingSpinner{
    constructor(
        readonly onStateChange: (loading: boolean) => void,
    ){}
    runningCount = 0

    acquire(): () => void{
        if(this.runningCount === 0) this.onStateChange(true)
        this.runningCount++
        return () => {
            this.runningCount--
            if(this.runningCount === 0) this.onStateChange(false)
        }
    }
}

export default function TodoList() {
  const [items, setItems] = React.useState<ListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  const spinner = React.useMemo(() => new LoadingSpinner(setIsLoading), [setIsLoading])

  React.useEffect(() => {
    // start fetching handling interruption
    const controller = new AbortController();
    getListItems(controller.signal, spinner).then(setItems);
    return () => controller.abort();
  }, [spinner]);

  return (
    <U.TodoListContainer isLoading={isLoading}>
      {items.map((listItem) => (
        <U.TodoListEntry key={listItem.id} {...listItem} />
      ))}
    </U.TodoListContainer>
  );
}
