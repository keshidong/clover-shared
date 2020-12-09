export type AwaitQueueTask<T> = () => (Promise<T> | T)

type MicroTask<T> = {
  enqueuedAt: Date;
  executedAt?: Date;
  asyncFn: AwaitQueueTask<T>,
  resolve: (...args: any[]) => any;
	reject: (error: Error) => void;
}

type MacroTask = Map<string, MicroTask<unknown>[]>

class AsyncQueue {
  pendingMacroTasks: MacroTask = new Map()
  push<T> (fn: AwaitQueueTask<T>, macroId: string) {
    if (typeof fn !== 'function') {
			throw new TypeError('the first parameter must be an asynchronous function.')
    }

    return new Promise((resolve, reject) => {
      let microTasks = this.pendingMacroTasks.get(macroId)
      if (!microTasks) {
        microTasks = []
        this.pendingMacroTasks.set(macroId, microTasks)
      }
      
      microTasks.push({
        enqueuedAt: new Date(),
        asyncFn: fn,
        resolve,
				reject,
      })

      if (microTasks.length === 1) {
        this.next(macroId)
      }
    })
  }
  private async next(macroId: string) {
    const microTasks = this.pendingMacroTasks.get(macroId)
    if (!microTasks) {
      console.error('microTasks not array, an error occurred inside the code')
      return
    }
    if (microTasks.length === 0) {
      this.pendingMacroTasks.delete(macroId)
      return
    }
    const task = microTasks[0]
    if (!task) {
      console.error('task not exit, an error occurred inside the code')
      return
    }
    task.executedAt = new Date()
    // execute task
    try {
      const result = await task.asyncFn()
      task.resolve(result)
    } catch (error) {
      task.reject(error)
    }

    // Remove the first pending task (the completed one) from the queue.
    microTasks.shift()

    this.next(macroId)
  }
  dump(macroId: string) {
    return this.pendingMacroTasks.get(macroId)
  }
}

export default AsyncQueue
