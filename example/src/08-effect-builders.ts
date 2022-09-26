import * as Effect from "@effect/core/io/Effect"
import * as Exit from "@effect/core/io/Exit"

// define the program
const program = Effect.sync(() => {
    console.log("Hello Effect!")
    return 42
})
// ^? Effect<never, never, number>

// run the program
Effect.unsafeRunWith(program, result => {
    if(Exit.isSuccess(result)){
        console.log("Computation succeeded with ", result.value)
    }else{
        console.log("Computation failed with", result.cause)
    }
})