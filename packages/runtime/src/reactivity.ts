export type Accessor<T> = () => T;
export type Setter<T> = (value: T | ((prev: T) => T)) => T;

type CleanupFn = () => void;

interface Computation {
  execute: () => void;
  deps: Set<Source>;
  cleanups: CleanupFn[];
}

interface Source {
  subscribers: Set<Computation>;
}

class Signal<T> implements Source {
  public readonly subscribers = new Set<Computation>();

  public constructor(private value: T) {}

  public read(): T {
    trackDependency(this);
    return this.value;
  }

  public peek(): T {
    return this.value;
  }

  public write(next: T): T {
    if (Object.is(this.value, next)) {
      return this.value;
    }

    this.value = next;
    notifySubscribers(this.subscribers);
    return this.value;
  }
}

class Memo<T> implements Source, Computation {
  public readonly subscribers = new Set<Computation>();
  public readonly deps = new Set<Source>();
  public cleanups: CleanupFn[] = [];
  public value!: T;

  public constructor(private readonly fn: () => T) {
    this.execute();
  }

  public read(): T {
    trackDependency(this);
    return this.value;
  }

  public execute(): void {
    cleanupComputation(this);
    const previous = currentComputation;
    currentComputation = this;

    let nextValue!: T;
    try {
      nextValue = this.fn();
    } finally {
      currentComputation = previous;
    }

    if (!Object.is(nextValue, this.value)) {
      this.value = nextValue;
      notifySubscribers(this.subscribers);
    }
  }
}

const pendingComputations = new Set<Computation>();
let batchDepth = 0;
let currentComputation: Computation | null = null;

function trackDependency(source: Source): void {
  if (!currentComputation) {
    return;
  }

  source.subscribers.add(currentComputation);
  currentComputation.deps.add(source);
}

function cleanupComputation(computation: Computation): void {
  for (const source of computation.deps) {
    source.subscribers.delete(computation);
  }
  computation.deps.clear();

  const cleanups = computation.cleanups;
  computation.cleanups = [];
  for (const cleanup of cleanups) {
    cleanup();
  }
}

function runComputation(computation: Computation): void {
  if (batchDepth > 0) {
    pendingComputations.add(computation);
    return;
  }

  computation.execute();
}

function notifySubscribers(subscribers: Set<Computation>): void {
  const queue = Array.from(subscribers);
  for (const subscriber of queue) {
    runComputation(subscriber);
  }
}

function flushPending(): void {
  if (pendingComputations.size === 0) {
    return;
  }

  const queue = Array.from(pendingComputations);
  pendingComputations.clear();
  for (const computation of queue) {
    computation.execute();
  }

  if (pendingComputations.size > 0) {
    flushPending();
  }
}

export function createSignal<T>(initialValue: T): [Accessor<T>, Setter<T>] {
  const signal = new Signal(initialValue);

  const accessor: Accessor<T> = () => signal.read();
  const setter: Setter<T> = (value) => {
    const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(signal.peek()) : value;
    return signal.write(nextValue);
  };

  return [accessor, setter];
}

export function createEffect(fn: () => void): void {
  const effect: Computation = {
    deps: new Set<Source>(),
    cleanups: [],
    execute() {
      cleanupComputation(effect);
      const previous = currentComputation;
      currentComputation = effect;
      try {
        fn();
      } finally {
        currentComputation = previous;
      }
    },
  };

  effect.execute();
}

export function createMemo<T>(fn: () => T): Accessor<T> {
  const memo = new Memo(fn);
  return () => memo.read();
}

export function batch<T>(fn: () => T): T {
  batchDepth += 1;
  try {
    return fn();
  } finally {
    batchDepth -= 1;
    if (batchDepth === 0) {
      flushPending();
    }
  }
}

export function untrack<T>(fn: () => T): T {
  const previous = currentComputation;
  currentComputation = null;
  try {
    return fn();
  } finally {
    currentComputation = previous;
  }
}

export function onCleanup(fn: CleanupFn): void {
  if (!currentComputation) {
    throw new Error('onCleanup must be called inside a tracked computation.');
  }

  currentComputation.cleanups.push(fn);
}

export function onMount(fn: () => void): void {
  queueMicrotask(fn);
}

export const effect = createEffect;
