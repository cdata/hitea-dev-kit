export type TaskCallback = () => void | Promise<void>;

export class Scheduler {
  #running: boolean = false;
  #idleCallback: ReturnType<typeof requestIdleCallback> | null = null;

  constructor(readonly taskCallback: TaskCallback) {}

  start() {
    if (this.#running) {
      return;
    }

    this.#running = true;
    this.#step();
  }

  stop() {
    if (this.#idleCallback != null) {
      cancelIdleCallback(this.#idleCallback);
    }

    this.#running = false;
  }

  #step = () => {
    if (this.#running === false) {
      return;
    }

    this.#idleCallback = requestIdleCallback(async () => {
      try {
        await this.taskCallback();
      } catch (error) {
        console.warn('Error in scheduler task');
        console.error(error);
      }

      this.#step();
    });
  };
}
