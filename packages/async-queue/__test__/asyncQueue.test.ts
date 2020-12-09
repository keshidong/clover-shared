import AsyncQueue from '../src'

test('throw error when push not func', async () => {
  const queue = new AsyncQueue()
  try {
    // @ts-ignore
    const p = queue.push('The first parameter not function', 'blockTaskId')
    expect('Never execute here').not.toBe('Never execute here')
  } catch (error) {}
})

test('async function has been called', async () => {
  const queue = new AsyncQueue()
  const asyncFn = jest.fn().mockImplementation(async () => {})
  const p = queue.push(asyncFn, 'blockTaskId')
  expect(queue.dump('blockTaskId')).toEqual(
    [expect.objectContaining({
      enqueuedAt: expect.any(Date),
      asyncFn,
    })]
  )
  await p
  expect(asyncFn).toBeCalledTimes(1)
  expect(queue.dump('blockTaskId')).toEqual(undefined)
})

test('async function exec only once \
when push multi async func (avoid calling multiple interMethod(next) \
in the same block loop)', async () => {
  const queue = new AsyncQueue()
  const asyncFn1 = jest.fn().mockImplementation(async () => {})
  const asyncFn2 = jest.fn().mockImplementation(async () => {})

  queue.push(asyncFn1, 'blockTaskId')
  const p2 = queue.push(asyncFn2, 'blockTaskId')

  await p2
  expect(asyncFn1).toHaveBeenCalledTimes(1)
  expect(asyncFn2).toHaveBeenCalledTimes(1)
  expect(queue.dump('blockTaskId')).toEqual(undefined)
})

test('resolve async task', async () => {
  const queue = new AsyncQueue()
  const asyncFn = jest.fn().mockResolvedValue('resolve value')

  const p = queue.push(asyncFn, 'blockTaskId')
  const result = await p
  expect(result).toEqual('resolve value')
})

test('reject async task', async () => {
  const queue = new AsyncQueue()
  const asyncFn = jest.fn().mockRejectedValue('reject value')

  const p = queue.push(asyncFn, 'blockTaskId')
  try {
    await p
    expect('Never execute here').not.toBe('Never execute here')
  } catch (error) {
    expect(error).toEqual('reject value')
  }
})

test('exec async task after previous task has been completed', async () => {
  const queue = new AsyncQueue()
  const asyncFn1 = jest.fn().mockImplementation(async () => {})
  const asyncFn2 = jest.fn().mockImplementation(async () => {})

  const p1 = queue.push(asyncFn1, 'blockTaskId')
  expect(asyncFn1).toHaveBeenCalledTimes(1)

  const p2 = queue.push(asyncFn2, 'blockTaskId')
  expect(asyncFn2).not.toHaveBeenCalled()

  await p1
  expect(asyncFn2).toHaveBeenCalledTimes(1)

  await p2
  expect(asyncFn2).toHaveBeenCalledTimes(1)
})

test('remove correct async func \
when it done if a new function is pushed \
during the previous execution', async () => {
  const queue = new AsyncQueue()
  const asyncFn1 = jest.fn().mockImplementation(async () => {})
  const asyncFn2 = jest.fn().mockImplementation(async () => {})

  const p1 = queue.push(asyncFn1, 'blockTaskId')
  queue.push(asyncFn2, 'blockTaskId')
  await p1

  expect(queue.dump('blockTaskId')).toEqual(
    [expect.objectContaining({
      enqueuedAt: expect.any(Date),
      asyncFn: asyncFn2,
    })]
  )
})

test('the tasks will not block each other \
when to be pushed different block id', async () => {
  const queue = new AsyncQueue()
  const asyncFn1 = jest.fn().mockImplementation(async () => {})
  const asyncFn2 = jest.fn().mockImplementation(async () => {})

  queue.push(asyncFn1, 'blockTaskId1')
  expect(asyncFn1).toBeCalledTimes(1)

  queue.push(asyncFn2, 'blockTaskId2')
  expect(asyncFn2).toBeCalledTimes(1)
})

test('the tasks will clear after completion \
when to be pushed different block id', async () => {
  const queue = new AsyncQueue()
  const asyncFn1 = jest.fn().mockImplementation(async () => {})
  const asyncFn2 = jest.fn().mockImplementation(async () => {})

  const p1 = queue.push(asyncFn1, 'blockTaskId1')
  const p2 = queue.push(asyncFn2, 'blockTaskId2')

  await p1
  await p2
  expect(queue.dump('blockTaskId1')).toBeUndefined()
  expect(queue.dump('blockTaskId2')).toBeUndefined()
})
