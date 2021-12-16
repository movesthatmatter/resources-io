import * as io from 'io-ts'
import { HttpInputValidationError, HttpInputValidationErrorCodec } from './form'

export const httpGenericError = () =>
  io.type({
    type: io.literal('HttpGenericError'),
    message: io.union([io.string, io.undefined])
  })

export type HttpGenericErrorCodec = ReturnType<typeof httpGenericError>
export type HttpGenericError = io.TypeOf<HttpGenericErrorCodec>

export const httpCustomError = <T extends io.Mixed>(content: T) =>
  io.type({
    type: io.literal('HttpCustomError'),
    content
  })

export type HttpCustomErrorCodec = ReturnType<typeof httpCustomError>
export type HttpCustomError = io.TypeOf<HttpCustomErrorCodec>

export const httpCustomTypeErrorFromProps = <T extends io.Props>(content: T) =>
  httpCustomError(io.type(content))

export type HttpErrorCodec =
  | HttpGenericErrorCodec
  | HttpCustomErrorCodec
  | HttpInputValidationErrorCodec
export type HttpError = HttpGenericError | HttpCustomError | HttpInputValidationError
