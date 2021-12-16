import {
  resourceFailureHandledError,
  badEncodingError,
  ResourceFailureHandledError,
  BadEncodingError,
  BadRequestError,
  badRequestError
} from './errors'
import { FormModelCodec, FormModelKeysMap } from './http'
import * as io from 'io-ts'
import { Either, isLeft, isRight } from 'fp-ts/lib/Either'
import { map } from 'fp-ts/lib/Record'
import { Err, Ok, Result } from 'ts-results'

// This is needed for being part of the same namespace!
export * from './types'

export const isPayloadOfCodec = <C extends io.Mixed>(
  c: C,
  payload: unknown
): payload is io.TypeOf<C> => {
  return isRight(c.decode(payload))
}

export const isResourceFailureHandledError = (e: unknown): e is ResourceFailureHandledError =>
  isPayloadOfCodec(resourceFailureHandledError, e)
export const isBadEncodingError = (e: unknown): e is BadEncodingError =>
  isPayloadOfCodec(badEncodingError, e)
export const isBadRequestError = (e: unknown): e is BadRequestError =>
  isPayloadOfCodec(badRequestError, e)

export const emptyRequest = io.union([io.undefined, io.null, io.void, io.type({})])

const record = <KS extends io.KeyofC<any>, T extends io.Any>(
  k: KS,
  type: T
): Record<keyof KS['keys'], T> => map<KS, T>(() => type)(k.keys) as any

export const getValidationErrorCodec = <M extends FormModelCodec>(model: M) =>
  io.type({
    type: io.literal('ValidationErrors'),
    content: io.type({
      fields: io.partial(record(io.keyof(model), io.union([io.string, io.undefined])))
    })
  })

// export type ValidationError = io.TypeOf<ReturnType<typeof getValidationErrorCodec>>;
export type ValidationError<M extends FormModelKeysMap> = {
  type: 'ValidationErrors'
  content: {
    fields: { [k in keyof M]: string | undefined }
  }
}

export const withPaginatorRequest = <TCodec extends io.Mixed>(codec: TCodec) =>
  io.partial({
    pageIndex: io.number,
    pageSize: io.number,
    query: codec
  })

export const withPaginatorResponse = <TCodec extends io.Mixed>(codec: TCodec) =>
  io.type({
    items: io.array(codec),
    itemsTotal: io.number,
    currentIndex: io.number
  })

declare type PaginatorWitoutItems = Omit<
  io.TypeOf<ReturnType<typeof withPaginatorResponse>>,
  'items'
>
export declare type PaginatedResponse<TType> = PaginatorWitoutItems & {
  items: TType[]
}

export const eitherToResult = <T, E>(either: Either<E, T>): Result<T, E> => {
  if (isLeft(either)) {
    return new Err(either.left)
  }

  return new Ok(either.right)
}

export const isObject = (m: unknown): m is object => m !== null && typeof m === 'object'

// Use this to get inherited keys as well
export const keyInObject = <X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> => prop in obj
