import * as io from 'io-ts'

export const badRequestError = io.type({
  type: io.literal('BadRequestError'),
  content: io.union([io.array(io.string), io.undefined])
})
export type BadRequestErrorCodec = typeof badRequestError
export type BadRequestError = io.TypeOf<BadRequestErrorCodec>

export const badResponseError = io.type(
  {
    type: io.literal('BadResponseError'),
    content: io.undefined
  },
  'BadResponseError'
)
export type BadResponseErrorCodec = typeof badResponseError
export type BadResponseError = io.TypeOf<BadResponseErrorCodec>

export const serverError = io.type(
  {
    type: io.literal('ServerError'),
    content: io.union([io.string, io.undefined])
  },
  'ServerError'
)
export type ServerErrorCodec = typeof serverError
export type ServerError = io.TypeOf<ServerErrorCodec>

export const badEncodingError = io.type(
  {
    type: io.literal('BadEncodingError'),
    content: io.union([io.array(io.string), io.undefined])
  },
  'BadEncodingError'
)
export type BadEncodingErrorCodec = typeof badEncodingError
export type BadEncodingError = io.TypeOf<BadEncodingErrorCodec>

export const networkError = io.type(
  {
    type: io.literal('NetworkError'),
    content: io.undefined
  },
  'NetworkError'
)
export type NetworlErrorCodec = typeof networkError
export type NetworkError = io.TypeOf<NetworlErrorCodec>

export const badErrorEncodingError = io.type(
  {
    type: io.literal('BadErrorEncodingError'),
    content: io.undefined
  },
  'BadErrorEncodingError'
)
export type BadErrorEncodingErrorCodec = typeof badErrorEncodingError
export type BadErrorEncodingError = io.TypeOf<BadErrorEncodingErrorCodec>

export const resourceFailureHandledError = io.type(
  {
    type: io.literal('ResourceFailureHandled'),
    content: io.undefined
  },
  'ResourceFailureHandled'
)
export type ResourceFailureHandledErrorCodec = typeof resourceFailureHandledError
export type ResourceFailureHandledError = io.TypeOf<
  ResourceFailureHandledErrorCodec
>

export const resourceInexistentError = io.type(
  {
    type: io.literal('ResourceInexistent'),
    content: io.undefined
  },
  'ResourceInexistent'
)

export type ResourceInexistentErrorCodec = typeof resourceInexistentError
export type ResourceInexistentError = io.TypeOf<ResourceInexistentErrorCodec>

export const commonResponseErrors = io.union(
  [
    badRequestError,
    badEncodingError,
    badResponseError,
    networkError,
    badErrorEncodingError,
    serverError,
    resourceInexistentError
  ],
  'commonResponseErrors'
)

export type CommonResponseErrors = io.TypeOf<typeof commonResponseErrors>
