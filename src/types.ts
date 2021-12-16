import * as io from 'io-ts'
import { Resource } from './Resource'

export type RequestOf<R extends Resource<any, any, any>> = io.TypeOf<R['requestPayloadCodec']>
export type OkResponseOf<R extends Resource<any, any, any>> = io.TypeOf<R['responseOkPayloadCodec']>
export type ErrResponseOf<R extends Resource<any, any, any>> = io.TypeOf<
  R['responseErrPayloadCodec']
>
export type ResponseOf<R extends Resource<any, any, any>> = OkResponseOf<R> | ErrResponseOf<R>
