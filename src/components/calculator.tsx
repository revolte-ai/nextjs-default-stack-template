'use client';

import { useEffect, useMemo, useReducer } from 'react';

type Operator = '+' | '−' | '×' | '÷';
type HistoryItem = { id: number; expression: string; result: string };
type State = {
  display: string;
  storedValue: number | null;
  operator: Operator | null;
  waitingForOperand: boolean;
  expression: string;
  error: string | null;
  history: HistoryItem[];
};
type Action =
  | { type: 'digit'; value: string }
  | { type: 'decimal' }
  | { type: 'operator'; value: Operator }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'backspace' }
  | { type: 'toggle-sign' }
  | { type: 'percent' }
  | { type: 'reuse'; value: string };

const initialState: State = {
  display: '0',
  storedValue: null,
  operator: null,
  waitingForOperand: false,
  expression: '',
  error: null,
  history: [],
};

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return 'Error';
  return Number(value.toPrecision(12)).toLocaleString('en-US', {
    maximumFractionDigits: 10,
  });
}

function calculate(left: number, operator: Operator, right: number) {
  if (operator === '+') return left + right;
  if (operator === '−') return left - right;
  if (operator === '×') return left * right;
  if (right === 0) return null;
  return left / right;
}

function reducer(state: State, action: Action): State {
  if (action.type === 'clear') return { ...initialState, history: state.history };
  if (action.type === 'reuse') {
    return { ...state, display: action.value, error: null, waitingForOperand: true };
  }
  if (action.type === 'digit') {
    const display =
      state.waitingForOperand || state.error
        ? action.value
        : state.display === '0'
          ? action.value
          : state.display + action.value;
    return { ...state, display, error: null, waitingForOperand: false };
  }
  if (action.type === 'decimal') {
    if (state.display.includes('.') && !state.waitingForOperand) return state;
    return {
      ...state,
      display: state.waitingForOperand || state.error ? '0.' : state.display + '.',
      error: null,
      waitingForOperand: false,
    };
  }
  if (action.type === 'backspace') {
    if (state.waitingForOperand || state.error)
      return { ...state, display: '0', error: null, waitingForOperand: false };
    const display = state.display.length > 1 ? state.display.slice(0, -1) : '0';
    return { ...state, display: display === '-' ? '0' : display };
  }
  if (action.type === 'toggle-sign') {
    if (state.display === '0') return state;
    return {
      ...state,
      display: state.display.startsWith('-') ? state.display.slice(1) : '-' + state.display,
      error: null,
    };
  }
  if (action.type === 'percent') {
    const value = Number(state.display.replaceAll(',', '')) / 100;
    return { ...state, display: formatNumber(value), waitingForOperand: true, error: null };
  }
  if (action.type === 'operator') {
    const current = Number(state.display.replaceAll(',', ''));
    if (state.storedValue !== null && state.operator && !state.waitingForOperand) {
      const result = calculate(state.storedValue, state.operator, current);
      if (result === null)
        return {
          ...state,
          display: '0',
          error: 'Cannot divide by zero',
          storedValue: null,
          operator: null,
        };
      return {
        ...state,
        display: formatNumber(result),
        storedValue: result,
        operator: action.value,
        waitingForOperand: true,
        expression: `${formatNumber(result)} ${action.value}`,
      };
    }
    return {
      ...state,
      storedValue: current,
      operator: action.value,
      waitingForOperand: true,
      expression: `${state.display} ${action.value}`,
      error: null,
    };
  }
  if (action.type === 'equals') {
    if (state.storedValue === null || !state.operator) return state;
    const right = Number(state.display.replaceAll(',', ''));
    const result = calculate(state.storedValue, state.operator, right);
    if (result === null)
      return {
        ...state,
        display: '0',
        error: 'Cannot divide by zero',
        storedValue: null,
        operator: null,
        waitingForOperand: true,
      };
    const formatted = formatNumber(result);
    return {
      ...state,
      display: formatted,
      expression: `${formatNumber(state.storedValue)} ${state.operator} ${formatNumber(right)}`,
      storedValue: null,
      operator: null,
      waitingForOperand: true,
      error: null,
      history: [
        {
          id: Date.now(),
          expression: `${formatNumber(state.storedValue)} ${state.operator} ${formatNumber(right)}`,
          result: formatted,
        },
        ...state.history,
      ].slice(0, 6),
    };
  }
  return state;
}

const keys = [
  { label: 'C', action: { type: 'clear' } as Action, style: 'utility' },
  { label: '⌫', action: { type: 'backspace' } as Action, style: 'utility' },
  { label: '%', action: { type: 'percent' } as Action, style: 'utility' },
  { label: '÷', action: { type: 'operator', value: '÷' } as Action, style: 'operator' },
  { label: '7', action: { type: 'digit', value: '7' } as Action, style: 'number' },
  { label: '8', action: { type: 'digit', value: '8' } as Action, style: 'number' },
  { label: '9', action: { type: 'digit', value: '9' } as Action, style: 'number' },
  { label: '×', action: { type: 'operator', value: '×' } as Action, style: 'operator' },
  { label: '4', action: { type: 'digit', value: '4' } as Action, style: 'number' },
  { label: '5', action: { type: 'digit', value: '5' } as Action, style: 'number' },
  { label: '6', action: { type: 'digit', value: '6' } as Action, style: 'number' },
  { label: '−', action: { type: 'operator', value: '−' } as Action, style: 'operator' },
  { label: '1', action: { type: 'digit', value: '1' } as Action, style: 'number' },
  { label: '2', action: { type: 'digit', value: '2' } as Action, style: 'number' },
  { label: '3', action: { type: 'digit', value: '3' } as Action, style: 'number' },
  { label: '+', action: { type: 'operator', value: '+' } as Action, style: 'operator' },
  { label: '±', action: { type: 'toggle-sign' } as Action, style: 'number' },
  { label: '0', action: { type: 'digit', value: '0' } as Action, style: 'number' },
  { label: '.', action: { type: 'decimal' } as Action, style: 'number' },
  { label: '=', action: { type: 'equals' } as Action, style: 'equals' },
];

export function Calculator() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const currentOperator = useMemo(() => state.operator, [state.operator]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Action> = {
        '+': { type: 'operator', value: '+' },
        '-': { type: 'operator', value: '−' },
        '*': { type: 'operator', value: '×' },
        '/': { type: 'operator', value: '÷' },
        '%': { type: 'percent' },
        Enter: { type: 'equals' },
        '=': { type: 'equals' },
        Escape: { type: 'clear' },
        Backspace: { type: 'backspace' },
        '.': { type: 'decimal' },
      };
      const action = keyMap[event.key];
      if (/^\d$/.test(event.key)) dispatch({ type: 'digit', value: event.key });
      else if (action) dispatch(action);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <main className="calculator-shell">
      <section className="calculator-card" aria-label="Everyday calculator">
        <div className="calculator-heading">
          <div>
            <p className="eyebrow">Pocket arithmetic</p>
            <h1>Make it add up.</h1>
          </div>
          <span className="keyboard-hint">⌘ keys ready</span>
        </div>
        <div className="calculator-grid">
          <div className="calculator-main">
            <div className="display" aria-live="polite">
              <p className="display-expression">{state.expression || 'Ready when you are'}</p>
              <p className={`display-value ${state.error ? 'display-error' : ''}`}>
                {state.error ?? state.display}
              </p>
              {currentOperator && <span className="operator-badge">{currentOperator}</span>}
            </div>
            <div className="keypad" aria-label="Calculator keypad">
              {keys.map((key) => (
                <button
                  className={`key key-${key.style}`}
                  key={key.label}
                  type="button"
                  onClick={() => dispatch(key.action)}
                  aria-label={key.label === '⌫' ? 'Backspace' : key.label}
                >
                  {key.label}
                </button>
              ))}
            </div>
          </div>
          <aside className="history-panel">
            <div className="history-heading">
              <div>
                <p className="eyebrow">Your trail</p>
                <h2>Recent math</h2>
              </div>
              <span className="history-count">{state.history.length}/6</span>
            </div>
            {state.history.length === 0 ? (
              <div className="history-empty">
                <span className="empty-mark">∑</span>
                <p>Your completed calculations will land here.</p>
              </div>
            ) : (
              <div className="history-list">
                {state.history.map((item) => (
                  <button
                    className="history-item"
                    key={item.id}
                    type="button"
                    onClick={() => dispatch({ type: 'reuse', value: item.result })}
                  >
                    <span>{item.expression}</span>
                    <strong>= {item.result}</strong>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
        <p className="footer-note">
          Fast hands, clear answers <span>•</span> works with your keyboard
        </p>
      </section>
    </main>
  );
}
