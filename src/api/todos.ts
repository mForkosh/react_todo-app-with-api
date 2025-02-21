import { Todo } from '../types/Todo';
import { client } from '../utils/fetchClient';

export const USER_ID = 1769;

export const getTodos = () => {
  return client.get<Todo[]>(`/todos?userId=${USER_ID}`);
};

export const addTodos = (data: Omit<Todo, 'id' | 'userId'>) => {
  return client.post<Todo>(`/todos`, { userId: USER_ID, ...data });
};

export const deleteTodos = (todoId: number) => {
  return client.delete(`/todos/${todoId}`);
};

export const changeTodo = (todoId: number, data: Omit<Todo, 'id'>) => {
  return client.patch<Todo>(`/todos/${todoId}`, { ...data });
};
// Add more methods here
