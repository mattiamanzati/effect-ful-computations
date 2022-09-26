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

---
layout: image-left
image: /image-agenda.avif
---

# Today's agenda

A deep dive in the world of computations

- State of the art with plain JavaScript
- Problems you may have you don't know about 
- Are we satisfied?
- Is there a better way to define them?

<!--
Today we're gonna dive together in the world of computations.
We're gonna start by acknoledge what's the state of the art of building computations with JavaScript, we'll see some problems you may have in your application and don't know about, and finally we'll see if we are satisfied and how to eventually improve the definition of computations.
-->

---
layout: image-right
image: /image-todo-list.avif
---

# Let's do computations

Wanna build a TODO application?

```ts{all}
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
What a better way to acknoledge the situation then building a real application?

Let's build together a TODO management application.

Our application domain objects will be something along this lines: well have a set of Users  and a set of TODOs that should be assigned to an user, have a title and eventually marked as completed
-->

---
layout: fact
---

# Monday
Let's get stuff done

---
layout: showcase-left
image: /image-01-sync.gif
---

# A sample computation

Let's take a look at an easy one

- Fetch list of TODOs
- Fetch assigned User Name
- Create a list of Items to render

<!--
It's Monday, and today we'll focus on building our user interface.

Here on the left we can see our beautiful UI, with a main menu, and from the main menu we can access a screen to interact with all of our TODOs.

Rather than explaining you the entire application, we'll focus on a simple computation that retrieves data for the UI. It's job is very simple, it fetches the list of todos, for each todo it gets the user name, and then it builds an array with just the data needed by the UI.
-->

---
layout: default
---

# Sync computation

Everything is in memory

```ts {all} {maxHeight:'450px'}
function getListItems(): ListItem[] {
    const result: ListItem[] = []

    for(let todo of U.TODOS){
        const user: User = U.USERS.find(e => e.id === todo.userId)!
        result.push({ ...user, ...todo });
    }
    return result
}

export default function TodoList(){
    const items: ListItem[] = getListItems()
    // ...
}
```

<!--
Rather than building the entire backend for our application, we'll start by just doing some computation in memory using some sample data.

We'll just write some logic and leave the actual data fetching implementation of data to future Mattia, and for sure he'll be more than happy to implement that.

We'll then loop for each todo, for each todo we'll find its assigned user based on the user id, and we'll finally build the data that will be used by our render component.

In our component we can now simply call that function, and produce the output by just looping the items and no additional work is needed here in render.
-->

---
layout: fact
---

# Tuesday
I Promise<> you everything will be fine
<!--
Future-Mattia really thinks that past Mattia is a piece of garbage.
-->
---
layout: default
---

# Everything is actually Async

You know, fetching and things

```ts {all} {maxHeight:'450px'}
async function getListItems(): Promise<ListItem[]> {
  const result: ListItem[] = [];

  const todosResponse = await fetch('https://jsonplaceholder.typicode.com/todos');
  const todos: Todo[] = await todosResponse.json();

  for (let todo of todos) {
    const userResponse = await fetch('https://jsonplaceholder.typicode.com/users/' + todo.userId);
    const user: User = await userResponse.json();

    result.push({ ...user, ...todo });
  }

  return result;
}

export default function TodoList() {
  // ...
  getListItems().then(setItems)
  // ...
}
```

<!--
Turn's out that fetching data from the backend is an asynchronous operation.
This means that we have to rewrite all the dumb code written by past Mattia and lift it to returning Promises.

We'll use fetch to ask our backend the list of TODOs, we'll convert the response to a JSON object, for each todo we'll also fetch its assigned user and finally build the data object needed by our UI. 

Seems like that by just sprinkling here and there async and await we have rewritten our computation to be fully async.

Everything work as intended and our application is finally using real data.
Are we ready to release this application?
-->

---
layout: fact
---

# Wednesday
Awaiting takes too much time

<!--
Past Mattia did it again. He messed up.
Turns out that loading data is really really slow.
-->

---
layout: showcase-left
image: /image-01.gif
---

# Finding the bottleneck

What is taking too much?

- Await means totally sequential
- Lot of time may be wasted waiting

Can we do something else while waiting?
Usually anything that:
- does not modify any external sources
- has no dependency in result of current computation

<!--
After a short session of debugging, we find out that performing one request after the other results in too much time being wasted.

Can we do something else instead of waisting time? Sure, we can easily do anything that does not requires the result of the current computation that is running.
-->

---
layout: default
---
# Async in parallel

Running computations and wait for all with Promise.all

```ts {all} {maxHeight:'450px'}
async function fetchTodoListItem(todo: Todo): Promise<ListItem> {
  const userResponse = await fetch('https://jsonplaceholder.typicode.com/users/' + todo.userId);
  const user: User = await userResponse.json();

  return { ...user, ...todo };
}

async function getListItems(): Promise<ListItem[]> {
  const todosResponse = await fetch('https://jsonplaceholder.typicode.com/todos');
  const todos: Todo[] = await todosResponse.json();

  const listItemRequests: Promise<ListItem>[] = todos.map((todo) => fetchTodoListItem(todo));
  return await Promise.all(listItemRequests);
}
```
<!--
By looking at our code we found out that given the single todo item we can fetch its related user and create the single item needed by the UI in parallel.

Our main computation can now change and instead of running a request and wait for its result one by one, we can just issue all the work to be done concurrently.
Finally we wait for all the results and return the data to the UI.

Are we ready to release this application?
-->
---
layout: fact
---

# Thursday
Parallelism is'nt unlimited

<!--
Well, we arent. After some testing we figure out that issuing too many fetch requests concurrently is'nt a great experience.
-->

---
layout: showcase-left
image: /image-02-async.gif
---

# Limiting concurrency

Issuing too many fetch requests has problems

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
layout: default
---
# Poor man's concurrency limit

Just execute N requests, and wait for them to finish before starting next N requests

```ts {all} {maxHeight:'450px'}
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
```

...but what happens if one request takes too much?

<!--
A first attempt at solving this issue may be something like this approach.
Instead of spawning all the promises at once, we create buckets of them, and before proceeding with the next bucket, we wait for all the requests of the current bucket to be completed.

But what happens if one request of the batch takes too much?
-->
---
layout: default
---
# Work stealing can maximize concurrency

```ts {all} {maxHeight:'450px'}
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
```
<!--
A better approach would involve implementing a work-stealing approach.
The way it works is that we have a list of jobs to do, we define a worker that steals a job from the queue ensuring no other will attempt to perform it, and continue running until there are no more jobs.
A fixed amount of workers can be started and the computation is finished when all workers have finished.

With this approach there is a guarantee that the maximum allowed level of concurrency is reached everytime.

Are we now ready to release this application?
-->
---
layout: fact
---

# Friday
Weird issues
<!--
Almost there. There is one weird issue left in our application.
-->

---
layout: showcase-left
image: /image-05-interruption.gif
---

# Interruption

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
layout: default
---

# I'll stop when you'll tell me to!

Interruption is signaled from callsite, so we need to start there.

```ts {all} {maxHeight:'450px'}
const controller = new AbortController()
getListItems(controller.signal).then(setItems);

return () => controller.abort()
```

<!--
In order to implement interruption, first thing to do would be to define in callsite a way to interrupt the long running computation. JavaScript has introduced an AbortController and an AbortSignal class in order to define this type of scenarios.

We can easily construct one of those and hook it up such as the component gets unmounted, we stop any running computation.
-->

---
layout: default
---

# Passing it around...

That AbortSignal needs to arrive all the way down...

```ts {all} {maxHeight:'450px'}
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
```
<!--
What's unfortunate is that now we have to manually pass around that signal all the way down into our computation up to the fetch request.
-->
---
layout: default
---

# ...and around again...

...up to our request we need to eventually abort.

```ts {all} {maxHeight:'450px'}
async function fetchTodoListItem(todo: Todo, signal: AbortSignal): Promise<ListItem> {
  const userResponse = await fetch('https://jsonplaceholder.typicode.com/users/' + todo.userId, { signal });
  const user: User = await userResponse.json();

  return { ...user, ...todo };
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
"It works on my machine"
---
layout: fact
---

# 💩
## RIP Backend.

<!--
Unfortunately the Backend became unreliable. That meant that occasionaly fetch request to it would fail due to too much workload.
-->

---
layout: default
---

# ...just try again...

Some kind of resiliency is required in real world applications; 💩 happens.

```ts {all} {maxHeight:'450px'}
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
```

<!--
We need to act quick. To allow our application to continue to work we implemented poorly a retry logic with an exponential backoff. This allows the frontend app to retry upon any kind of failure while fetching data from the backend.
-->
---
layout: fact
---

# Sunday
Such exceptional day

---
layout: fact
---

# Sunday
Such exceptional day

By Exceptional I mean with a lot of unhandled exceptions.


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
layout: fact
---

# 😫
## I felt exhausted

---
layout: default
---

# Before...

```ts {all} {maxHeight:'450px'}
function getListItems(): ListItem[] {
  const result: ListItem[] = [];

  for (let todo of U.TODOS) {
    const user: User = U.USERS.find((e) => e.id === todo.userId)!;
    result.push({ ...user, ...todo });
  }
  return result;
}
```

---
layout: default
---

# ...After

```ts {1-17|19-32|34-39} {maxHeight:'450px'}
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

function waitMillis(millis: number, signal: AbortSignal) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(true), millis);
    signal.addEventListener('abort', () => clearTimeout(timeout));
  });
}
```
<!--
At the end of the week I felt very disappointed.
I felt like I spent more time fighting with the platform, than building and implementing Business critical application logic.
-->

---
layout: fact
---

Current state of the art?
# DISASTER

---
layout: default
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

<!--
And those problems are not just a frontend thing related to data fetching, they happen in the backend too.
Here's some examples...
-->

---
layout: default
---

# Promise is'nt going to solve anything

- no control over execution, it already happened
- no built in retry logic
- no built in interruption
- no concurrency control
- no typed errors in _Promise< A >_

... in short, it does'nt solve any real problem. 

---
layout: center
---

# How can we solve those problems?
We need a better computation primitive


---
layout: center
---

# Fibers solved lot of those problems in React!

- May be interrupted before finishing<br/>
  <small>work can be discarded if obsolete</small>
- May be executed concurrently<br/>
  <small>prepare multiple version of the same UI</small>
- May fail sometimes, and sometimes recover<br/>
  <small>error boundaries</small>

---
layout: center
---

# Effect
Structured concurrency library backed by a powerful Fiber-based runtime

<!--
Effect is a structured concurrency library that is optimized for ease of use and that is backed by a powerful runtime "such as the one you're may be familiar with for React fibers". 

Effect aims to be a better computation primitive than promise, and solve lot of real world problems such as the ones we have seen before.
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
layout: showcase-left
image: /image-lazy.png
---
# Solving problem #1
Instead of Promising a value, Effect is lazy and can be executed as many times as you want

```ts {all} {maxHeight:'450px'}
import * as Effect from "@effect/core/io/Effect"
import * as Exit from "@effect/core/io/Exit"

// describes the computation
const program = Effect.sync(() => {
    console.log("Hello Effect!")
    return 42
})

// execute the description of the computation
for(let i = 0; i < 10; i++){
  Effect.unsafeRunWith(program, result => {
      if(Exit.isSuccess(result)){
          console.log("Computation " + i + 
            " succeeded with ", result.value)
      }else{
          console.log("Computation " + i + 
            " failed with", result.cause)
      }
  })
}
```
<!--
One of the biggest problem with Promise is that is'nt lazy.
That means that we have no control over execution, with effect instead of building programs by running computations, we instead have a lazy structure that describes the behaviour of a computation. That description is then traversed and interpreted by a Runtime that allows to run our computation.
This means that things like retry logic can be easily implemented by just re-executing the computation definition as many times as we like.

As we can see in the last line of code, executing an Effect into the runtime can be done by calling unsafeRun and we can provide a callback that will recive the effect "exit".
-->


---
layout: showcase-left
---

# Exit<E, A>

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
layout: default
---

# Sync Effect

Simple sync computations to get things done quickly:

```ts {all} {maxHeight:'450px'}
import * as Effect from "@effect/core/io/Effect";

const getTodos = Effect.sync(() => U.TODOS);
// ^? T.Effect<never, never, Todo[]>

const getUser = (userId: UserId) =>
  Effect.sync(() => U.USERS.find((e) => e.id === userId));
// ^? (userId: UserId) => T.Effect<never, never, User | undefined>
```

<!--
Lets start as the previous week by building the tinest block, as we were building with legos.

Let's implement a basic sync function to retrive the entire list of todos.
We can use the "sync" method from the effect module to convert a regular sync computation into an effect.

Now we can also build our computation that given an UserId, gets the user with that id.

We do the same as before, but defined as a function as we take in the userid and returns an effect that when executed by the runtime, resolves the User.
By hovering our effect signature, we can see clearly that the return type also involves an undefined.
This may be unwanted, usually as we said before in the A parameter there's the expected type of the result, and undefined seems not a value for a happy path of our computation.
-->

---
layout: showcase-left
image: /image-typed-failure.png
---

# Solving problem #2

Using explicit error types gives better information about the computation

```ts {all} {maxHeight:'450px'}
import * as Effect from "@effect/core/io/Effect";

class UserNotFound {
  readonly _tag = "UserNotFound";
  constructor(readonly userId: UserId) {}
}

const getUser = (userId: UserId) =>
  pipe(
    Effect.sync(() => 
      U.USERS.find((e) => e.id === userId)),
    Effect.flatMap((user) =>
      user ? 
        Effect.succeed(user) : 
        Effect.fail(new UserNotFound(userId))
    )
  );
// ^? (userId: UserId) => 
//        T.Effect<never, UserNotFound, User>
```

<!--
What we can do instead, is leverage the error channel and make so our computations goes into a Failure if an user does not exists.

To do that, we need to chain our effects, and look up at the result of the previous one to continue.
Chaining Effects can be done by using the "flatMap" function, which takes a function that has as parameter the result of the previous effects, and returns a new effect to be executed.

Here we then take a look at the value, and if its an user we continue by succeding, or else we fail with a UserNotFound failure.

By hovering the type definition of our new computation, we can now clearly see how the error channel now contains our UserNotFound failure and better describes the computation than the Promise alternative.
-->

---
layout: default
---

# Inference helps a lot!

Errors simply gets borrowed along the computation, as they should

```ts {all} {maxHeight:'450px'}
import * as Effect from "@effect/core/io/Effect";

const fetchListItem = (todo: Todo) =>
  pipe(
    getUser(todo.userId),
    Effect.map((user) => ({ ...user, ...todo }))
  );
// ^? (todo: Todo) => T.Effect<never, UserNotFound, ListItem>

const getListItems = pipe(
  getTodos,
  Effect.flatMap((todos) =>
    Effect.forEach(todos, (todo) => fetchListItem(todo))
  )
);
// ^? T.Effect<never, UserNotFound, ListItem[]>
```

<!--
Going on with our little lego pieces, we stumble upon our fetchListItem function, which given a full Todo object, fetches its associated User and builds a single list item needed by the UI.

Here we just call getUser to get an Effect that fetches the user, and then if everything is fine and we are on the happy path, we transform the output of the user, and produce our data object.

What's really neat here is how Effect is taking fully advantage of the type system inference and carrying on the error type from the getUser function.

That's it, we've built our computation in sync using effect.
-->

---
layout: fact
---

# Tuesday
Going async and fetching data.

---
layout: default
---

# A simple fetch request

Naive APIs may rely on Promise, but no worries, you can transform them into an Effect

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
// ^? (input: RequestInfo, init?: RequestInit) => Effect<never, FetchError, Response>
```

<!--
A new day, a new adventure in Effect.

Today we're gonna fetch some data. And that unfortunately means Promises again.
Luckly we can use the tryCatchPromise to get an Effect out of a promise.

As we've discussed before, Promises are'nt great at typing errors. That's why the constructor besides taking a lazy promise, also requires a function to transform the thrown error into a Failure.
-->


---
layout: default
---

# Composing Effects

More stuff, means more errors

```ts {all} {maxHeight:'450px'}

declare const decodeJson: (response: Response) => Effect<never, JsonBodyError, any>
declare const parseTodos: (value: any) => Effect<never, InvalidTodoObjectError, Todo[]>

const getTodos = pipe(
    request("https://jsonplaceholder.typicode.com/todos"),
    Effect.flatMap(response => decodeJson(response)),
    Effect.flatMap(data => parseTodos(data)),
);
// ^? Effect<never, FetchError | JsonBodyError | InvalidTodoObjectError, Todo[]>
```

<!--
And for sure fetching data introduces a lot of errors, but thanks to composition, errors just stack on the error channel.
-->

---
layout: default
---

# Handling failures

💩 happens, but sometimes we can recover

```ts {all} {maxHeight:'450px'}
const getUserName = (userId: UserId) => pipe(
    getUser(userId),
    // ^? Effect<never, FetchError | JsonBodyError | UserNotFound, string>
    Effect.map(user => user.username),
    Effect.catchTag("FetchError", () => Effect.succeed("User#" + userId)),
    Effect.catchTag("UserNotFound", () => Effect.succeed("DeletedUser#" + userId)),
    Effect.orDie
)
// ^? Effect<never, never, string>
```

<!--
So all the failures just stack in there?

Effect has some combinators that allows to try to recover from failures or abort entirely the computation with no chance of recovery.
-->

---
layout: fact
---

# Wednesday
Taking advantage of concurrency

---
layout: default
---

# Solving problem #3

Parallelism is taken care by the runtime, just tell the runtime to do so

```ts {all} {maxHeight:'450px'}
const getListItems = pipe(
  getTodos,
  Effect.flatMap((todos) =>
    Effect.forEachPar(todos, (todo) => fetchListItem(todo))
  )
);
// ^? T.Effect<never, UserNotFound, ListItem[]>
```
<!--
Oh, do you remember what a pain was to implement concurrency with Promises and async/await?

Effect has builtin support for concurrent computations, so to take full advantage of them you just need to tell the runtime to execute effects in parallel, with no extra code to be implemented.
-->


---
layout: fact
---

# Thursday
Limiting concurrency.


---
layout: default
---

# Solving problem #4

The runtime has options to configure how effects should be run

```ts {all} {maxHeight:'450px'}
const getListItems = pipe(
  getTodos,
  Effect.flatMap((todos) =>
    Effect.forEachPar(todos, (todo) => fetchListItem(todo))
  ),
  Effect.withParallelism(10)
);
// ^? T.Effect<never, UserNotFound, ListItem[]>
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
layout: default
---

# Solving problem #5

Interruption is defined at lower level, and automatically propagated by the runtime

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
// ^? (input: RequestInfo, init?: RequestInit) => Effect<never, FetchError, Response>
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
layout: default
---

# Solving problem #6

Effect has a builtin fully configurable retry-policy based on Schedule

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
// ^? Effect<never, FetchError | JsonBodyError, Todo[]>
```

<!--
Effect has also builtin support for retry options.
Thanks to the Schedule module, we can compose a lot of builtin retry logic, here for example we tell effect to retry with an exponential backoff, and we also tell that it does not make sense to do that to some kind of failures, like a JsonBodyError.
-->

---
layout: fact
---

# Sunday
Extra: Dependency injection!

---
layout: default
---

# Solving problem you will have #7

As your application grows, you'll for sure start having dependencies

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
// ^? Effect<UserService, never, string>
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
layout: default
---

# Dependency automatically stacks

Again, it's just composition (TM)

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
// ^? T.Effect<UserService | TodoService, never, ListItem[]>

const liveGetListItems = pipe(
    getListItems,
    Effect.provideService(UserService, { getUser }),
    Effect.provideService(TodoService, { getTodos })
)
// ^? T.Effect<never, never, ListItem[]>
```

<!--
Again, effect uses composable APIs, and that means that if you compose multiple computations with multiple service requirements, they will compose too.

Finally we can provide dependencies to our computation and as you can see, the requirements on the type argument gets cleared away as we provide all the required services.

This feature is really handy, as you can provide different service implementations based on the environment (for example if you are running tests) or if there is a customer tenant that requires a differen implementation than all the other.
-->

---
layout: default
---
# What Effect solved

Effect has taken care for us of:

- control over execution
- retry logic
- interruption
- concurrency control
- typed errors
- dependency injection

---
layout: fact
---

# There's more!




---
layout: default
---

# Your first Effect

Effects can be built from a pure value in the same way you do with Promise

```ts
const sample1 = Promise.resolve("value")
// ^? Promise<string>

const sample2 = Effect.succeed("value")
// ^? Effect<never, never, string>
```

or in case of a failure

```ts
const failure1 = Promise.reject(new UserNotFoundError())
// ^? Promise<never>

const failure2 = Effect.fail(new UserNotFoundError())
// ^? Effect<never, UserNotFoundError, never>
```

<!--
How can we create an instance of an effect?
There are several ways to do that, 
the simplest way would be to create an effect from a value or a failure, in the same way we do it with promises.

TypeScript users will also see how the type of an Effect better describes the computation, by giving hints of all the possible failures our computation will result into.
-->

---
layout: default
---

# Async Effect

Effects can be also asynchronous

```ts
const async1 = new Promise<string>((resolve, reject) => {
    setTimeout(() => resolve("value"), 1000)
    // ... or ...
    reject(new UserNotFoundError())
})
// ^? Promise<string>

const async2 = Effect.async<never, UserNotFoundError, string>(callback => {
    setTimeout(() => callback(Effect.succeed("value")), 1000)
    // ... or ...
    callback(Effect.fail(new UserNotFoundError()))
})
// ^? Effect<never, UserNotFoundError, string>

const async3 = Effect.tryPromise(() => fetch("http://api.myhost.it"))
// ^? Effect<never, unknown, Response>
```

<!--
We can also build asynchronous effects, in the same way we do with promises.

The same benefits for typescript users apply here, by just looking at the type we get full informations about the computation.

Obviuously the platform has lot of APIs that work with promises, we can transform a promise into an asyncronous effect anytime by just using "tryPromise".
-->
