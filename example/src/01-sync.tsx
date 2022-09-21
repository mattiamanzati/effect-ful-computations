import {ListItem, Todo, User} from "./types"
import React from "react"
import * as U from "./utils"

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