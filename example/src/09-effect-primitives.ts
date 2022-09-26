import * as Effect from '@effect/core/io/Effect';
import * as Exit from '@effect/core/io/Exit';

const a = Promise.resolve('value');
// ^-  Promise<string>

const b = Effect.succeed('value');
// ^- Effect<never, never, string>

class UserNotFoundError {}

const failure1 = Promise.reject(new UserNotFoundError());
// ^-  Promise<never>

const failure2 = Effect.fail(new UserNotFoundError());
// ^- Effect<never, UserNotFoundError, never>

// ASYNC

const async1 = new Promise<string>((resolve, reject) => {
  setTimeout(() => resolve('value'), 1000);
  // ... or ...
  reject(new UserNotFoundError());
});
// ^- Promise<string>

const async2 = Effect.async<never, UserNotFoundError, string>((callback) => {
  setTimeout(() => callback(Effect.succeed('value')));
  // ... or ...
  callback(Effect.fail(new UserNotFoundError()));
});
// ^- Effect<never, UserNotFoundError, string>

const async3 = Effect.tryPromise(() => fetch('http://api.myhost.it'));
// ^- Effect<never, unknown, Response>

/*
const program = Effect.sync(() => {
    console.log("Hello Effect!")
    return 42
})

for(let i = 0; i < 10; i++){
    Effect.unsafeRunWith(program, result => {
        if(Exit.isSuccess(result)){
            console.log("Computation " + i + " succeeded with ", result.value)
        }else{
            console.log("Computation " + i + " failed with", result.cause)
        }
    })
  }*/

class UserNotFound {
  readonly _tag = 'UserNotFound';
  constructor(readonly userId: number) {}
}

Effect.unsafeRunWith(Effect.fail(new UserNotFound(999)), (result) => {
  if (Exit.isSuccess(result)) {
    console.log('succeeded with ', result.value);
  } else {
    console.log('failed with', result.cause);
  }
});
