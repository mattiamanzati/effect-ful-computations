import * as Effect from "@effect/core/io/Effect"

// define the program
const program = Effect.sync(() => {
    console.log("Hello Effect!")
    return 42
})
// ^- Effect<never, never, number>

// can interop with legacy by returning a promise
const promise = Effect.unsafeRunPromise(program)
// ^- Promise<number>