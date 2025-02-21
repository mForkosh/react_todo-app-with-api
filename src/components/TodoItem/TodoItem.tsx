import React, { useEffect, useRef, useState } from 'react';
import { Todo } from '../../types/Todo';
import classNames from 'classnames';
type Props = {
  todo: Todo;
  activeTodo: Todo | null;
  isProcessed: boolean;
  onDeleteTodo?: (id: number) => Promise<void>;
  onChangeTodo?: (t: Todo) => Promise<void>;
  onChangeActiveTodo?: (t: Todo | null) => void;
};

export const TodoItem: React.FC<Props> = ({
  todo,
  isProcessed,
  activeTodo,
  onDeleteTodo = () => null,
  onChangeTodo = () => null,
  onChangeActiveTodo = () => null,
}) => {
  const [inputValue, setInputValue] = useState('');
  const activeInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInputValue(activeTodo ? activeTodo.title : '');
    activeInput.current?.focus();
  }, [activeTodo]);

  function changeTitle(e?: React.FocusEvent<HTMLFormElement>) {
    e?.preventDefault();

    if (inputValue.length === 0) {
      onDeleteTodo(todo.id)
        ?.then(() => onChangeActiveTodo(null))
        .catch(() =>
          setTimeout(() => {
            activeInput.current?.focus();
          }, 0),
        );

      return;
    }

    if (inputValue === activeTodo?.title) {
      onChangeActiveTodo(null);

      return;
    }

    onChangeTodo({ ...todo, title: inputValue })?.catch(() =>
      setTimeout(() => {
        activeInput.current?.focus();
      }, 0),
    );
  }

  function onPressKeyInForm(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      changeTitle();
    } else if (e.key === 'Escape') {
      onChangeActiveTodo(null);
    }
  }

  return (
    <div
      data-cy="Todo"
      className={classNames('todo', { completed: todo.completed })}
    >
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className="todo__status-label">
        <input
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={todo.completed}
          onChange={() => onChangeTodo({ ...todo, completed: !todo.completed })}
        />
      </label>

      {activeTodo === todo ? (
        <form onKeyDown={onPressKeyInForm} onBlur={changeTitle}>
          <input
            ref={activeInput}
            placeholder="Empty todo will be deleted"
            data-cy="TodoTitleField"
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.currentTarget.value)}
            className="todo__title-field"
            disabled={isProcessed}
          />
        </form>
      ) : (
        <>
          <span
            data-cy="TodoTitle"
            className="todo__title"
            onDoubleClick={() => onChangeActiveTodo(todo)}
          >
            {todo.title}
          </span>
          <button
            type="button"
            className="todo__remove"
            data-cy="TodoDelete"
            onClick={() => onDeleteTodo(todo.id)}
          >
            ×
          </button>
        </>
      )}
      <div
        data-cy="TodoLoader"
        className={classNames('modal overlay', { 'is-active': isProcessed })}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );
};
