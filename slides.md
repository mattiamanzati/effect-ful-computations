---
# try also 'default' to start simple
theme: default
# random image from a curated Unsplash collection by Anthony
# like them? see https://unsplash.com/collections/94734566/slidev
background: https://source.unsplash.com/collection/94734566/1920x1080
# apply any windi css classes to the current slide
class: 'text-center'
# https://sli.dev/custom/highlighters.html
highlighter: shiki
# show line numbers in code blocks
lineNumbers: true
# some information about the slides, markdown enabled
info: |
  ## Slidev Starter Template
  Presentation slides for developers.

  Learn more at [Sli.dev](https://sli.dev)
# persist drawings in exports and build
drawings:
  persist: false
# use UnoCSS (experimental)
css: unocss
---

# Effect-ful computations with Fibers

Mattia Manzati @ React Alicante 2022

<!--
Today's gonna be a week long journey.
And this will not be a journey in some mystical fantasy land with unicorns and dragons, princess.
No, not at all.
This will be the real journey that any developer, like you or me, will someday start out there in the JavaScript world when building any application.
-->

---
layout: image-right
image: >-
  https://images.unsplash.com/photo-1527150602-a98f7a6f2746?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3024&q=80
---

# Today's Companion

Let's build a TODO management application.

```ts{all|1-5|7-13}
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

```

<!--
Before embarking our journey, let me introduce you our companion, the application we'll be building.

Guess what? It's a TODO Management application. 
Developers somehow really like to build them and everyone likes to publish on the internet tutorials about them.

Our application domain objects will be something along this lines: well have a set of Users  and a set of TODOs that should be assigned to an user, have a title and eventually marked as completed.
-->
---
layout: fact
---

# Monday

---
layout: showcase-left
image: /image-01-sync.gif
---

## Mockup

Here's our computation:

- Fetch list of TODOs
- Fetch assigned User Name
- Create a list of Items to render

<!--
It's Monday, and today we'll focus on building our user interface.

Here on the left we can see our beautiful UI, with a main menu, and from the main menu we can access a screen to interact with all of our TODOs.

Rather than explaining you the entire application, we'll focus on a simple computation that retrieves data for the UI. It's job is very simple, it fetches the list of todos, for each todo it gets the user name, and then it builds an array with just the data needed by the UI.
-->

---
layout: center
---

## Sync computation

```ts {all|4|6-15|8|9-14|20|22-24} {maxHeight:'450px'}
function getListItems(): ListItem[] {
    const result: ListItem[] = []

    const todos: Todo[] = U.TODOS

    for(let i = 0; i < todos.length; i++){
        const todo = todos[i]
        const user: User = U.USERS.find(e => e.id === todo.userId)!
        result.push({
            id: todo.id,
            title: todo.title,
            username: user.username,
            completed: todo.completed
        })
    }
    return result
}

export default function TodoList(){
    const items: ListItem[] = getListItems()

    return <U.TodoListContainer>
        {items.map(listItem => <U.TodoListEntry key={listItem.id} {...listItem} />)}
    </U.TodoListContainer>
}
```

<!--
Rather than building the entire backend for our application, we'll start by just doing some computation in memory using some sample data.

We'll just write some logic and leave the actual data fetching implementation of data to future Mattia, and for sure he'll be more than happy to implement that.

Let's start by getting our dummy TODOs from our variable.
We'll then loop for each todo, for each todo we'll find its assigned user based on the user id, and we'll finally build the data that will be used by our render component.

In our component we can now simply call that function, and produce the output by just looping the items and no additional work is needed here in render.
-->

---
layout: fact
---

# Tuesday

<!--
Future-Mattia really thinks that past Mattia is a piece of garbage.
-->
---
layout: center
---

## Everything is actually Async

```ts {all|1|4-8|14-18|20-26|32-36} {maxHeight:'450px'}
async function getListItems(): Promise<ListItem[]> {
  const result: ListItem[] = [];

  // get all todos
  const todosResponse = await fetch(
    "https://jsonplaceholder.typicode.com/todos"
  );
  const todos: Todo[] = await todosResponse.json();

  // for each todo
  for (let i = 0; i < todos.length; i++) {
    const todo = todos[i];

    // get its user data
    const userResponse = await fetch(
      "https://jsonplaceholder.typicode.com/users/" + todo.userId
    );
    const user: User = await userResponse.json()

    // push the list item into result
    result.push({
      id: todo.id,
      title: todo.title,
      username: user.username,
      completed: todo.completed,
    });
  }
  return result;
}

export default function TodoList() {
  const [items, setItems] = React.useState<ListItem[]>([])
  
  React.useEffect(() => {
    getListItems().then(setItems)
  }, [])

  // ...
}
```

<!--
Turn's out that fetching data from the backend is an asynchronous operation.
This means that we have to rewrite all the dumb code written by past Mattia and lift it to returning Promises [X].

Here's our new and revised computation.

We'll use fetch to ask our backend the list of TODOs, we'll convert the response to a JSON object [X], and thanks to async/await we can easily rewrite our code to work in async mode by just putting here and there some async and await keywords.

As past mattia did, [X] for each todo we'll also fetch its assigned user [X] and finally build the data object needed by our UI. 

[X] We'll also need to change that a little to accomodate our async code.

Everything work as intended and our application is finally using real data.
Are we ready to release this application?
-->

---
layout: fact
---

# Wednesday

<!--
Past Mattia did it again. He messed up.
Turns out that loading data one after the other is really really slow.
-->

---
layout: center
---

## Something can be done concurrently

```ts {all} {maxHeight:'450px'}
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
```

<!--
By looking at our code we found out that this piece of computation can be safely executed concurrently, as given the single todo item it can do its job of fetching its related user and create the single item needed by the UI.

So we can start by extracting the behaviour in a separate function.
-->

---
layout: center
---
## Async means we can wait for stuff concurrently

```ts {all|9-11|12} {maxHeight:'450px'}
async function getListItems(): Promise<ListItem[]> {
  // get all todos
  const todosResponse = await fetch(
    "https://jsonplaceholder.typicode.com/todos"
  );
  const todos: Todo[] = await todosResponse.json();

  // starts all fetch concurrently
  const listItemRequests: Promise<ListItem>[] = todos.map((todo) =>
    fetchTodoListItem(todo)
  );
  return await Promise.all(listItemRequests);
}
```
<!--
Our main computation will now change and instead of running requests and wait for its result one by one, we can just issue all the work to be done concurrently.
Finally we wait for all the results and return the data to the UI.

Are we ready to release this application?
-->
---
layout: fact
---

# Thursday

<!--
Well, we arent. After some testing we figure out that issuing too many fetch requests concurrently is'nt a great experience.
-->

---
layout: showcase-left
image: /image-02-async.gif
---

## Concurrency

Issuing too many fetch requests:

- Requests may hang too much
- Lower end devices may crash
- The browser already has a limit

<!--
There are few issues with that approach, namely as we can see requests were hanging there for too much.
I had reports were this approach is so memory inefficient that crashed some lower end devices.
And last but not least it does not make any sense to schedule more requests than the amount the browser will actually attempt to perform concurrently.

We are effectively looking to build some sort of rate limiter here, where instead of processing everything, we limit to a fixed amount of jobs to be done concurrenty.
-->
---
layout: center
---
## Poor man's concurrency limit

```ts {all|12|13} {maxHeight:'450px'}
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
```
<!--
A first attempt at solving this issue may be something like this approach.
Instead of spawning all the promises at once, we create buckets of them, and before proceeding with the next bucket, we wait for all the requests of the current bucket to be completed.
-->
---
layout: center
---
## Work stealing can maximize concurrency

```ts {all|10-11|13-22|16|17-18|19|25} {maxHeight:'450px'}
async function getListItems(): Promise<ListItem[]> {
  // get all todos
  const todosResponse = await fetch(
    "https://jsonplaceholder.typicode.com/todos"
  );
  const todos: Todo[] = await todosResponse.json();

  // prepare the job queue
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
```
<!--
Beware, this is not the optimal solution to the problem, a better approach would involve implementing a work-stealing approach.
[#] a fixed amount of workers is defined [#] and then started.
[#] As long there is work to do, [#] the worker will pick up the first job available from the queue, [#] and then run it waiting for its completion.
With this approach there is a guarantee that the maximum allowed level of concurrency is reached everytime.

Are we now ready to release this application?
-->
---
layout: fact
---

# Friday

<!--
Almost there. There is one weird issue left in our application.
-->


---
layout: showcase-left
image: /image-05-interruption.gif
---

## Interruption

What is it?
- Outside world may request to interrupt
- Async operations may require to abort upon interruption
- Upon interruption some cleanup operation may be required
<!--
It seems like that going back and forward into our todo list, results in taking too much to load our TODOs list.
It may seem akward at the beginning, but if you think about it, it makes a lot of sense.

When the user steps out of the TODO list component, we need to trigger the interruption of our long running computation.
But what exactly means interrupting?

Interrupting means being able to ask a computation from outside of it to gracefully shut down. The computation may perform some tasks upon interruption, such as aborting an HTTP request, or release any subscription acquired to run.
-->

---
layout: center
---

## No way to interrupt me!

```ts {4-6} {maxHeight:'450px'}
export default function TodoList() {
  const [items, setItems] = React.useState<ListItem[]>([])
  
  React.useEffect(() => {
    getListItems().then(setItems)
  }, [])

  // ...
}
```
<!--
If we take a step back at were our computation is invoked, we can clearly see that no cleanup function is defined, so once we started fetching, it cannot be interrupted in any way.
-->

---
layout: center
---

## Nevermind, I'll stop when you'll tell me to!

```ts {4-9} {maxHeight:'450px'}
export default function TodoList() {
  const [items, setItems] = React.useState<ListItem[]>([])
  
  React.useEffect(() => {
    // start fetching handling interruption
    const controller = new AbortController()
    getListItems(controller.signal).then(setItems);
    return () => controller.abort()
  }, []);

  // ...
}
```

<!--
In order to fix that, first thing to do would be to define in callsite a way to interrupt the long running computation. JavaScript has introduced an AbortController and an AbortSignal class in order to define this type of scenarios.

We can easily construct one of those and hook it up such as the component gets unmounted, we stop any running computation.
-->

---
layout: center
---

## Passing it around...

```ts {all|1-4|19} {maxHeight:'450px'}
async function getListItems(signal: AbortSignal): Promise<ListItem[]> {
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
      .map((todo) => fetchTodoListItem(todo, controller.signal));
    result = result.concat(await Promise.all(requests));
  }

  return result;
}
```
<!--
What's unfortunate is that now we have to manually pass around that signal all the way down into our computation up to the fetch request.
-->
---
layout: center
---

## ...and around again...

```ts {all|3|8} {maxHeight:'450px'}
async function fetchTodoListItem(
  todo: Todo,
  signal: AbortSignal
): Promise<ListItem> {
  // fetch user data
  const userResponse = await fetch(
    "https://jsonplaceholder.typicode.com/users/" + todo.userId,
    { signal }
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
```
<!--
And finally after passing it all around, our abortsignal reached our fetch call and the HTTP request gets aborted.

Are we ready to release our application?
-->

---
layout: fact
---

# 🚀
## Friday, 17:59

<!--
Yes we are!
What a delightful way to end our office hours.
-->
---
layout: fact
---

# Saturday
---
layout: fact
---

# 💩
## RIP Backend.

<!--
Unfortunately the Backend became unreliable. That meant that occasionaly fetch request to it would fail due to too much workload.
-->

---
layout: center
---

## ...just try again...

```ts {all|5|21-25} {maxHeight:'450px'}
async function fetchTodoListItem(
  todo: Todo,
  signal: AbortSignal
): Promise<ListItem> {
  let retryTimeout = 100;
  while (true) {
    try {
      // fetch user data
      const userResponse = await fetch(
        "https://jsonplaceholder.typicode.com/users/" + todo.userId,
        { signal }
      );
      // build list item
      const user: User = await userResponse.json();
      return {
        id: todo.id,
        title: todo.title,
        username: user.username,
        completed: todo.completed,
      };
    } catch (e) {
      // wait an exponential timeout up to 10s and retry
      retryTimeout = Math.max(10000, retryTimeout * 2);
      await waitMillis(retryTimeout, signal);
    }
  }
}
```

<!--
We need to act quick. To allow our application to continue to work we implemented poorly a retry logic with an exponential backoff. This allows the frontend app to retry upon any kind of failure while fetching data from the backend.
-->
---
layout: fact
---

# Sunday
## Such exceptional day

---
layout: fact
---

# Sunday
## Such exceptional day
### By Exceptional I mean with a lot of unhandled exceptions.


---
layout: showcase-left
image: /image-err.png
---

## An Exceptional Sunday

Just to name a few of them:

- Uncaught TypeError: Failed to fetch
- Uncaught SyntaxError: Unexpected token '<', "<" is not valid JSON
- Uncaught TypeError: null is not a function
- Uncaught RangeError: Maximum call stack size exceeded

<!--
Well, there's still lot to do.
Handling all of those should be easy right? Just some try/catch here and there right?
And I can guarantee that all of the implementations see before lacks something here and there.
Up to now we have discussed mostly what happens on the "happy" path, but unfortunately things can always go wrong...
-->

---
layout: two-cols
---

# Before...

```ts {all} {maxHeight:'450px'}
function getListItems(): ListItem[] {
    const result: ListItem[] = []

    const todos: Todo[] = U.TODOS

    for(let i = 0; i < todos.length; i++){
        const todo = todos[i]
        const user: User = U.USERS.find(e => e.id === todo.userId)!
        result.push({
            id: todo.id,
            title: todo.title,
            username: user.username,
            completed: todo.completed
        })
    }
    return result
}

export default function TodoList(){
    const items: ListItem[] = getListItems()

    return <U.TodoListContainer>
        {items.map(listItem => <U.TodoListEntry key={listItem.id} {...listItem} />)}
    </U.TodoListContainer>
}
```

::right::

# ...After

```ts {all|1-27|29-52|55-60|62-79} {maxHeight:'450px'}
async function fetchTodoListItem(
  todo: Todo,
  signal: AbortSignal
): Promise<ListItem> {
  let retryTimeout = 100;
  while (true) {
    try {
      // fetch user data
      const userResponse = await fetch(
        "https://jsonplaceholder.typicode.com/users/" + todo.userId,
        { signal }
      );
      // build list item
      const user: User = await userResponse.json();
      return {
        id: todo.id,
        title: todo.title,
        username: user.username,
        completed: todo.completed,
      };
    } catch (e) {
      // wait an exponential timeout up to 10s and retry
      retryTimeout = Math.max(10000, retryTimeout * 2);
      await waitMillis(retryTimeout, signal);
    }
  }
}

async function getListItems(signal: AbortSignal): Promise<ListItem[]> {
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
      .map((todo) => fetchTodoListItem(todo, controller.signal));
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
```
<!--
At the end of the week I felt very disappointed.
I felt like I spent more time fighting with the platform, than building and implementing Business critical application logic.
-->
---
layout: fact
---

# 😫
## Can we do better?
---
layout: fact
---

## Promise is'nt going to solve anything


---
layout: center
---

# Not just on frontend...

Looking for a way to define a computation that:
- May be executed concurrently<br/>
  <small>multiple fetch request / multiple incoming HTTP requests</small>
- May be interrupted before finishing<br/>
  <small>component unmounted / client connection closed</small>
- May fail sometimes, and sometimes recover<br/>
  <small>unreachable server / connection timeouts</small>
- May mix sync and async steps<br/>
  <small>read from storage or fetch a resource / compute some values or store into database </small>


---
layout: center
---

# ...React Fiber does that!

- May be executed concurrently<br/>
  <small>prepare multiple version of the same UI</small>
- May be interrupted before finishing<br/>
  <small>work can be discarded if obsolete</small>
- May fail sometimes, and sometimes recover<br/>
  <small>error boundaries</small>
- May mix sync and async steps<br/>
  <small>classic components or suspend</small>

---
layout: center
---

# Effect
A data structure to define computations in a Fiber-based runtime

<!--
And that's what Effect tries to solve.
Effect is a data structure that define computations, and those are then executed on a Fiber-based runtime. Effect is based on an existing Scala library called ZIO and models lot of its data structure around it.

Effect APIs are pipeable and based on good functiona programming priciples. 

Instead of trying to teach you what a Monad is (and I never fully understood it), effect takes the good part of functional programming like composability, purity and immutability to create an experience focused on DX and productivity.

When using libraries like RxJS you may already have used "pipe" to compose a set of transformation, and that kind of style of APIs is the one you'll find while using effect.

-->
---
layout: center
---
# Effect<R, E, A>
_R_ equirements, _E_ rrors, ..._A_ success!

<!--
The effect datatype is the core of the whole package and has 3 type parameters. R which stands for Requirements, E that stands for Error and A for... A SUCCESS!
This allows to have all the information of how a computation may work by just looking at an effect type parameters. Every API is designed to try to leverage as much as possible automatic inference of those type parameters.
-->
---
layout: center
---

```ts {all|13-17} {maxHeight:'450px'}
import * as Effect from "@effect/core/io/Effect"
import * as Exit from "@effect/core/io/Exit"

// define the program
const program = Effect.sync(() => {
    console.log("Hello Effect!")
    return 42
})
// ^- Effect<never, never, number>

// start execution and return a function to interrupt execution
const interruptor = Effect.unsafeRunWith(program, result => {
    if(Exit.isSuccess(result)){
        console.log("Computation succeeded with ", result.value)
    }else{
        console.log("Computation failed with", result.cause)
    }
})
```
<!--
With effect instead of building programs by running computations, we instead have a lazy structure that describes the behaviour of a computation. That description is then traversed and interpreted by a Runtime that allows to run our computation.
This means that things like retry logic can be easily implemented by just re-executing the computation definition as many times as we like.

As we can see in the last line of code, executing an Effect into the runtime can be done by calling unsafeRun and we can provide a callback that will recive the effect "exit".
-->

---
layout: center
---

## Exit<E, A>

Running an effect, may result in an exit:

- Success (with value of type A)
- Failure
  - Failure (recoverable of type E)
  - Die (unrecoverable of type unknown)
  - Interruption

<!--
What does the exit contains?

An exit may be a success or a failure.
If the computation succeeded, the exit will be a success and value will contain the result of type A of the computation.
If the computation failed, the exit will contain the "cause" of the failure, and that data structure may contain one or more reason of failure, those can be a failure of type E, or an unexpected error, or an interruption signal.
-->


---
layout: fact
---

## Let's get things done...with Effect.

---
layout: fact
---

# Monday
A synchronous sample

---
layout: center
---

## Our first Effect

```ts {all} {maxHeight:'450px'}
import * as Effect from "@effect/core/io/Effect";

const getTodos = Effect.sync(() => U.TODOS);
// ^- T.Effect<never, never, Todo[]>
```

<!--
Lets start to build our application by the tinest block, as we were building with legos.

Let's implement a basic sync function to retrive the entire list of todos.
As we did before, we'll start using some sample data and just read that.
We can use the "sync" method from the effect module to convert a regular sync computation into an effect.
If we inspect the result type, we'll see an Effect wich has no requirements, no possible errors, and returns a list of TODOs.

Since effect is just a description of a computation, if there are no parameters I can just define the effect as a constant, and run it as many times as I like by just calling unsafeRun multiple times.
-->


---
layout: center
---

## Our first Effect

```ts {all} {maxHeight:'450px'}
import * as Effect from "@effect/core/io/Effect";

const getUser = (userId: UserId) =>
  Effect.sync(() => U.USERS.find((e) => e.id === userId));
// ^- (userId: UserId) => T.Effect<never, never, User | undefined>
```
<!--
Now we can also build our computation that given an UserId, gets the user with that id.
We do the same as before, but defined as a function as we take in the userid and returns an effect that when executed by the runtime, resolves the User.
By hovering our effect signature, we can see clearly that the return type also involves an undefined.
This may be unwanted, usually as we said before in the A parameter there's the expected type of the result, and undefined seems not a value for a happy path of our computation.
-->


---
layout: center
---

## Using the error channel

```ts {all|3-6|4|5|11|12|15} {maxHeight:'450px'}
import * as Effect from "@effect/core/io/Effect";

class UserNotFound {
  readonly _tag = "UserNotFound";
  constructor(readonly userId: UserId) {}
}

const getUser = (userId: UserId) =>
  pipe(
    Effect.sync(() => U.USERS.find((e) => e.id === userId)),
    Effect.flatMap((user) =>
      user ? Effect.succeed(user) : Effect.fail(new UserNotFound(userId))
    )
  );
// ^- (userId: UserId) => T.Effect<never, UserNotFound, User>
```

<!--
What we can do instead, is leverage the error channel and make so our computations goes into a Failure if an user does not exists.

[#] First we define a class that represents the error type, [#] we use a tag field to give a unique identifier to the error, and then we update our computation.

By using flatMap we chain together Effects, allowing to return a new effect based on the result of the previous one, if it succeeded.

[#] Here we then take a look at the value, and if its an user we continue by succeding, or else we fail with a UserNotFound failure.

By hovering the type definition of our new computation, we can clearly see how the error channel now contains our UserNotFound failure.
-->

---
layout: center
---

## Transforming the output

```ts {all} {maxHeight:'450px'}
import * as Effect from "@effect/core/io/Effect";

const fetchListItem = (todo: Todo) =>
  pipe(
    getUser(todo.userId),
    Effect.map((user) => ({
      id: todo.id,
      username: user.username,
      title: todo.title,
      completed: todo.completed,
    }))
  );
// ^- (todo: Todo) => T.Effect<never, UserNotFound, ListItem>
```

<!--
Going on with our little lego pieces, we stumble upon our fetchListItem function, which given a full Todo object, fetches its associated User and builds a single list item needed by the UI.

Here we just call getUser to get an Effect that fetches the user, and then if everything is fine and we are on the happy path, we transform the output of the user, and produce our data object.

What's really neat here is how Effect is taking fully advantage of the type system inference and carrying on the error type from the getUser function.
-->


---
layout: center
---

## Putting it together

```ts {all} {maxHeight:'450px'}
const getListItems = pipe(
  getTodos,
  Effect.flatMap((todos) =>
    Effect.forEach(todos, (todo) => fetchListItem(todo))
  )
);
// ^- T.Effect<never, UserNotFound, ListItem[]>
```

<!--
Finally its time to just put together our lego pieces.
[#] We get all the todos, and once all todos are retrived, 
[#] we loop through them, and for each one of them we build our list item.

That's it, we've built our computation in sync using effect.
-->

---
layout: fact
---

# Tuesday
Going async and fetching data.

---
layout: center
---

## A simple fetch request

```ts {all} {maxHeight:'450px'}
class FetchError {
  readonly _tag = "FetchError";
  constructor(readonly error: unknown) {}
}

export const request = (input: RequestInfo, init?: RequestInit | undefined) =>
  Effect.tryCatchPromise(
    () => fetch(input, init),
    (error: unknown) => new FetchError(error)
  )
// ^- (input: RequestInfo, init?: RequestInit) => Effect<never, FetchError, Response>
```

<!--
A new day, a new adventure in Effect.

Today we're gonna fetch some data. And that unfortunately means Promises again.
Luckly we can use the tryCatchPromise to get an Effect out of a promise.

As we've discussed before, Promises are'nt great at typing errors. That's why the constructor besides taking a lazy promise, also requires a function to transform the thrown error into a Failure.
-->


---
layout: center
---

## Raising failures

```ts {all} {maxHeight:'450px'}
class JsonBodyError {
  readonly _tag = "JsonBodyError";
  constructor(readonly error: unknown) {}
}

const decodeJson = (response: Response) =>
  Effect.tryCatchPromise(
    () => response.json(),
    (error: unknown) => new JsonBodyError(error)
  );

const getTodos = pipe(
    request("https://jsonplaceholder.typicode.com/todos"),
    Effect.flatMap(response => decodeJson(response))
);
// ^- Effect<never, FetchError | JsonBodyError, any>
```

<!--
Here we composed our previous request computation, with a new computation that given the response try to parse the JSON, and that may fail too.

Again, the beautiful thing about the Effect API, is that by looking at the type signature you can get a lot of informations. Here we can clearly see that composing Effects also composed the possible errors we can get while running those.

Here you can also see how the output is now any, and well, that's true, we also need to parse the JSON and ensure it satisfies the Todo structure, but that can be implemented in the same way as decodeJson, its mostly the same operation of transforming some input and eventually having some failure.
-->

---
layout: center
---

## How effect instructions are built

```ts {all} {maxHeight:'450px'}
class SyncOp<A>{
    readonly _tag = "SyncOp"
    constructor(
        readonly fn: () => A
    ){}
}
export function sync<A>(fn: () => A){
    return new SyncOp(fn)
}

class AsyncOp<A>{
    readonly _tag = "AsyncOp"
    constructor(
        readonly fn: () => Promise<A>
    ){}
}
export function async<A>(fn: () => Promise<A>){
    return new AsyncOp(fn)
}

export type Effect<A> = SyncOp<A> | AsyncOp<A>
```

<!--
And that's all, no need to sprinkle async/await everywhere.
Effect can handle both sync and async operations thanks to its Fiber runtime.

On this topic I want also to point out that effect is'nt doing any lifting here.
How? Internally effect is just a structure as said before, so there are different primitives for sync and async work. The effect datatype is just an union of those possible instructions, and the Fiber runtime will perform the operation in sync or async based on the kind of instruction received.
-->

---
layout: fact
---

# Wednesday
Taking advantage of concurrency

---
layout: center
---

## Concurrency

```ts {all} {maxHeight:'450px'}
const getListItems = pipe(
  getTodos,
  Effect.flatMap((todos) =>
    Effect.forEach(todos, (todo) => fetchListItem(todo))
  )
);
// ^- T.Effect<never, UserNotFound, ListItem[]>
```
<!--
Oh, do you remember what a pain was to implement concurrency with Promises and async/await?
Here's our computation right now, running one request after the other.
Wanna see how's simple to change it to concurrently?
-->


---
layout: center
---

## Concurrency

```ts {all} {maxHeight:'450px'}
const getListItems = pipe(
  getTodos,
  Effect.flatMap((todos) =>
    Effect.forEachPar(todos, (todo) => fetchListItem(todo))
  )
);
// ^- T.Effect<never, UserNotFound, ListItem[]>
```
<!--
Can you spot the difference?
Really easy, we just tell Effect to run in parallel those fetchListItem.
And that's it. Effect thanks to its fiber runtime will perform those work in parallel, safely shutting down all parallel work if any of them fails.

That's the beauty of the Fiber runtime of effect, it guarantees that every computation gets interrupted if not needed anymore.
-->


---
layout: fact
---

# Thursday
Limiting concurrency.


---
layout: center
---

## Parallelism

```ts {all} {maxHeight:'450px'}
const getListItems = pipe(
  getTodos,
  Effect.flatMap((todos) =>
    Effect.forEachPar(todos, (todo) => fetchListItem(todo))
  )
);
// ^- T.Effect<never, UserNotFound, ListItem[]>
```
<!--
Another day, another challenge.
Do you remember how hard was to properly take care of concurrency and maximising the amout of parallel requests?
-->

---
layout: center
---

## Parallelism is easy!

```ts {all} {maxHeight:'450px'}
const getListItems = pipe(
  getTodos,
  Effect.flatMap((todos) =>
    Effect.forEachPar(todos, (todo) => fetchListItem(todo))
  ),
  Effect.withParallelism(10)
);
// ^- T.Effect<never, UserNotFound, ListItem[]>
```
<!--
Well, again thanks to the effect runtime that's really easy.
We just tell to the runtime to have a maximum amount of parallel jobs and that's really it!
No need to rewrite the entire code, just tell the runtime what to do.
-->

---
layout: fact
---

# Friday
What about interruption?


---
layout: center
---

## Interruption

```ts {all} {maxHeight:'450px'}
export const request = (input: RequestInfo, init?: RequestInit | undefined) =>
  Effect.asyncInterrupt<never, FetchError, Response>((resume) => {
    const controller = new AbortController();
    fetch(input, { ...(init ?? {}), signal: controller.signal })
      .then((response) => {
        resume(Effect.succeed(response));
      })
      .catch((error) => {
        resume(Effect.fail(new FetchError(error)));
      });

    // return what to do on interrupt
    return Either.left(
      Effect.sync(() => {
        controller.abort();
      })
    );
  });
// ^- (input: RequestInfo, init?: RequestInit) => Effect<never, FetchError, Response>
```

<!--
Do you remember how we handled interruptions with async/await?
We had so much to change and pass along aaaaall the way that abort signal.

Effect has builtin support for interruption, instead of passing a signal along, how to handle interruption can be defined in every single lego brick of our computation.

when an interruption is requested from outside, the Effect runtime will ensure that the interrupt is properly handled and our abort controller gets invoked, and our request gets aborted.
-->

---
layout: fact
---

# Saturday
Retrying if you can.

---
layout: center
---

## Retry policy

```ts {all} {maxHeight:'450px'}
const getTodos = pipe(
  request("https://jsonplaceholder.typicode.com/todos"),
  Effect.flatMap((response) => decodeJson<Todo[]>(response)),
  Effect.retry(
    pipe(
      Schedule.exponential(Duration.millis(100), 2),
      Schedule.whileInput((error) => error._tag !== "JsonBodyError")
    )
  )
);
// ^- Effect<never, FetchError | JsonBodyError, Todo[]>
```

<!--
Effect has also builtin support for retry options.
Thanks to the Schedule module, we can compose a lot of builtin retry logic, here for example we tell effect to retry with an exponential backoff, and we also tell that it does not make sense to do that to some kind of failures, like a JsonBodyError.
-->

---
layout: fact
---

# Sunday
Handling failures

---
layout: center
---

## Handling failures

```ts {all} {maxHeight:'450px'}
const getUserName = (userId: UserId) => pipe(
    getUser(userId),
    // ^- Effect<never, FetchError | JsonBodyError | UserNotFound, string>
    Effect.map(user => user.username),
    Effect.catchTag("FetchError", () => Effect.succeed("User#" + userId)),
    Effect.catchTag("UserNotFound", () => Effect.succeed("DeletedUser#" + userId)),
    Effect.orDie
)
// ^- Effect<never, never, string>
```

<!--
What about those failures?
Effect has some combinators that allows to try to recover from failures or abort entirely the computation with no chance of recovery.
In our application, we found out that if there is a fetch error or a user not found, the UI may work also with a fake user name. We catch the error by tag, and then recover with the appropriate username.
Unfortunately there are scenarios where there is no sensible way to recover.
In those cases you can use orDie to turn your failure in an untyped exception.
-->

---
layout: center
---

## Builtin typed dependency injection

```ts {all} {maxHeight:'450px'}
interface UserService {
  getUser: (userId: UserId) => Effect.Effect<never, UserNotFound, User>;
}
const UserService = Tag<UserService>();

const getUserName = (userId: UserId) =>
  pipe(
    Effect.serviceWithEffect(UserService, (impl) => impl.getUser(userId)),
    Effect.map((user) => user.username),
    Effect.catchTag("UserNotFound", () =>
      Effect.succeed("DeletedUser#" + userId)
    ),
    Effect.orDie
  );
// ^- Effect<UserService, never, string>
```

<!--
And finally, what about the requirements type parameters?
Thanks to the effect runtime and the type system, effect has a fully typed dependency injection system, that allows to automatically compose and define requirements for each computation.

First you need to define the shape of the service required by the computation, but that is just at type level.
We then build a Tag that gets used as a value to uniquely identify our service.

Finally to access the dependencies of our computation, we can use combinators like serviceWithEffect to access the service implementation and chain the execution of a computation based on the implementation.

As we can see by hovering the type signature, the inference did its job, and fully understood that this computation, in order to be executed, requires an implementation of the user service to be passed in.
-->

---
layout: center
---

## Dependency automatically stacks

```ts {all} {maxHeight:'450px'}
interface TodoService {
  getTodos: Effect<never, never, Todo[]>;
}
const TodoService = Tag<TodoService>();

const getListItems = pipe(
  Effect.serviceWithEffect(TodoService, (impl) => impl.getTodos),
  Effect.flatMap((todos) =>
    Effect.forEachPar(todos, (todo) => fetchListItem(todo))
  ),
  Effect.withParallelism(10)
);
// ^- T.Effect<UserService | TodoService, never, ListItem[]>
```

<!--
Again, effect uses composable APIs, and that means that if you compose multiple computations with multiple service requirements, they will compose too.
-->


---
layout: center
---

## Providing dependencies

```ts {all} {maxHeight:'450px'}
const liveGetListItems = pipe(
    getListItems,
    Effect.provideService(UserService, { getUser }),
    Effect.provideService(TodoService, { getTodos })
)
// ^- T.Effect<never, never, ListItem[]>
```

<!--
Finally we can provide dependencies to our computation and as you can see, the requirements on the type argument gets cleared away as we provide all the required services.

This feature is really handy, as you can provide different service implementations based on the environment (for example if you are running tests) or if there is a customer tenant that requires a differen implementation than all the other.
-->
---
layout: fact
---

# There's more!