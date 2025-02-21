/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  addTodos,
  changeTodo,
  deleteTodos,
  getTodos,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { TodoItem } from './components/TodoItem/TodoItem';
import classNames from 'classnames';
import { useErrorMessage } from './utils/useErrorMessage';
import { FooterContent } from './components/FooterContent/FooterContent';
import { TypeFilterParams } from './types/filterParams';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

export const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [userTodos, setUserTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<null | Todo>(null);
  const [filterBy, setFilterBy] = useState<TypeFilterParams>('All');
  const [errorMessage, setErrorMessage] = useErrorMessage('');
  const [isActive, setIsActive] = useState<number[]>([]);
  const [activeTodo, setActiveTodo] = useState<null | Todo>(null);

  const todoInput = useRef<HTMLInputElement>(null);
  const {
    todosListNotEmpty,
    allTodosIsComlete,
    isCompleteTodo,
    countNotComplete,
  } = useMemo(() => {
    let complete = 0;
    let active = 0;

    userTodos.forEach(t => {
      if (t.completed) {
        complete++;
      } else {
        active++;
      }
    });

    return {
      todosListNotEmpty: userTodos.length > 0,
      allTodosIsComlete: userTodos.length === complete,
      isCompleteTodo: complete > 0,
      countNotComplete: active,
    };
  }, [userTodos]);

  const visibleTodos = userTodos.filter(todo => {
    switch (filterBy) {
      case 'Completed':
        return todo.completed;
      case 'Active':
        return !todo.completed;
      default:
        return true;
    }
  });

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizeTodo = inputValue.trim();

    if (normalizeTodo.length === 0) {
      setErrorMessage('Title should not be empty');

      return;
    }

    const newTodo = { title: normalizeTodo, completed: false };

    addTodos(newTodo)
      .then(res => {
        setUserTodos(curr => [...curr, res]);
        setInputValue('');
      })
      .catch(() => setErrorMessage('Unable to add a todo'))
      .finally(() => {
        setTempTodo(null);
        setTimeout(() => todoInput.current?.focus(), 0);
      });

    setTempTodo({ ...newTodo, id: 0, userId: 0 });
    setErrorMessage('');
  }

  function removeTodo(id: number) {
    setIsActive(curr => [...curr, id]);

    return deleteTodos(id)
      .then(() => setUserTodos(cur => cur.filter(t => t.id !== id)))
      .catch(er => {
        setErrorMessage('Unable to delete a todo');
        throw er;
      })
      .finally(() => {
        setIsActive(cur => cur.filter(v => v !== id));
        todoInput.current?.focus();
      });
  }

  function removeAllComplete() {
    userTodos.forEach(t => {
      if (t.completed) {
        removeTodo(t.id);
      }
    });
  }

  function changeDataTodo(todo: Todo) {
    setIsActive(cur => [...cur, todo.id]);

    return changeTodo(todo)
      .then(res => {
        setUserTodos(curr => curr.map(t => (t.id !== todo.id ? t : res)));
      })
      .catch(er => {
        setErrorMessage('Unable to update a todo');
        throw er;
      })
      .finally(() => {
        setIsActive(cur => cur.filter(v => v !== todo.id));
      });
  }

  function changeAllStatus() {
    if (allTodosIsComlete) {
      userTodos.forEach(t => changeDataTodo({ ...t, completed: false }));
    } else {
      userTodos.forEach(t =>
        !t.completed ? changeDataTodo({ ...t, completed: true }) : null,
      );
    }
  }

  useEffect(() => {
    todoInput.current?.focus();
    getTodos()
      .then(setUserTodos)
      .catch(() => {
        setErrorMessage('Unable to load todos');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // get user todos

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          {todosListNotEmpty && (
            <button
              type="button"
              className={classNames('todoapp__toggle-all', {
                active: allTodosIsComlete,
              })}
              data-cy="ToggleAllButton"
              onClick={() => changeAllStatus()}
            />
          )}

          {/* Add a todo on form submit */}
          <form onSubmit={submitForm}>
            <input
              ref={todoInput}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={inputValue}
              onChange={e => setInputValue(e.currentTarget.value)}
              disabled={Boolean(tempTodo)}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          <TransitionGroup>
            {visibleTodos.map(todo => (
              <CSSTransition key={todo.id} timeout={300} classNames="item">
                <TodoItem
                  todo={todo}
                  activeTodo={activeTodo}
                  isProcessed={isActive.includes(todo.id)}
                  onDeleteTodo={id => removeTodo(id)}
                  onChangeTodo={t => changeDataTodo(t)}
                  onChangeActiveTodo={t => setActiveTodo(t)}
                />
              </CSSTransition>
            ))}
            {tempTodo && (
              <CSSTransition key={0} timeout={300} classNames="temp-item">
                <TodoItem
                  todo={tempTodo}
                  isProcessed={true}
                  activeTodo={null}
                />
              </CSSTransition>
            )}
          </TransitionGroup>
        </section>

        {todosListNotEmpty && (
          <FooterContent
            countNotComplete={countNotComplete}
            filterBy={filterBy}
            isCompleteTodo={isCompleteTodo}
            onChangeFilterBy={fp => setFilterBy(fp)}
            onDeleteCompletTodos={() => removeAllComplete()}
          />
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification',
          'is-danger',
          'is-light',
          'has-text-weight-normal',
          { hidden: !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
      </div>
    </div>
  );
};
