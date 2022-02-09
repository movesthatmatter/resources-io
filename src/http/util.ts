import * as io from 'io-ts'
import { HttpErrorCodec } from './httpErrors'

export const httpRequestPayload = <TData extends io.Mixed>(data: TData) =>
  io.type({
    protocol: io.literal('http'),
    data
  })

export const httpRequestPayloadFromProps = <TProps extends io.Props>(
  props: TProps
) => httpRequestPayload(io.type(props))

export const anyHttpRequestPayload = io.type({
  protocol: io.literal('http'),
  data: io.any
})

export type AnyHttpRequestPayloadCodec = typeof anyHttpRequestPayload
export type AnyHttpRequestPayload = io.TypeOf<typeof anyHttpRequestPayload>

// export type GenericHttpRequestPayloadCodec = ReturnType<typeof httpRequestPayload>;
// export type GenericHttpRequestPayload = io.TypeOf<GenericHttpRequestPayloadCodec>;

export const okHttpResponsePayload = <TData extends io.Mixed>(data: TData) =>
  io.type({
    protocol: io.literal('http'),
    ok: io.literal(true),
    data
  })

export const okHttpResponsePayloadFromProps = <TProps extends io.Props>(
  props: TProps
) => okHttpResponsePayload(io.type(props))

export type GenericOkHttpResponsePayloadCodec = ReturnType<
  typeof okHttpResponsePayload
>
export type GenericOkHttpResponsePayload = io.TypeOf<
  GenericOkHttpResponsePayloadCodec
>

// export const anyOkHttpResponsePayload = io.type({
//   protocol: io.literal('http'),
//   ok: io.literal(true),
//   data: io.any,
// });

export type AnyOkHttpResponsePayloadCodec = io.TypeC<{
  protocol: io.LiteralType<'http'>
  ok: io.LiteralType<true>
  data: any
}>
// export type AnyOkHttpResponsePayload = io.TypeOf<AnyOkHttpResponsePayloadCodec>;

export const errHttpResponsePayload = <TErr extends io.Mixed>(error: TErr) =>
  io.type({
    protocol: io.literal('http'),
    ok: io.literal(false),
    error
  })

// export const errHttpResponsePayloadFromProps = <TProps extends HttpErrorCodec['props']>(
//   props: TProps,
// ) => errHttpResponsePayload(io.type(props));

export type GenericErrHttpResponsePayloadCodec = ReturnType<
  typeof errHttpResponsePayload
>
export type GenericErrHttpResponsePayload = io.TypeOf<
  GenericErrHttpResponsePayloadCodec
>

export const errHttpResponsePayloadOfType = <TErr extends HttpErrorCodec>(
  error: TErr
) => {
  return errHttpResponsePayload(error)
}

export type ErrHttpResponsePayloadOfType<
  TErr extends HttpErrorCodec
> = GenericErrHttpResponsePayload & {
  error: io.TypeOf<TErr>
}

// export const anyErrHttpResponsePayload = io.type({
//   protocol: io.literal('http'),
//   ok: io.literal(false),
//   error: io.any,
// });
export type AnyErrHttpResponsePayloadCodec = io.TypeC<{
  protocol: io.LiteralType<'http'>
  ok: io.LiteralType<false>
  error: any
}>

// export type AnyErrHttpResponsePayloadCodec = typeof anyErrHttpResponsePayload;
// export type AnyErrHttpResponsePayload = io.TypeOf<AnyErrHttpResponsePayloadCodec>;

export const httpResponsePayload = <
  TOkCodec extends GenericOkHttpResponsePayloadCodec,
  TErrCodec extends GenericErrHttpResponsePayloadCodec
>(
  ok: TOkCodec,
  err: TErrCodec
) => io.union([ok, err])

export type GenericHttpResponsePayloadCodec = ReturnType<
  typeof httpResponsePayload
>
export type GenericHttpResponsePayload = io.TypeOf<
  GenericHttpResponsePayloadCodec
>

export const anyHttpResponsePayload = <
  TOkCodec extends AnyOkHttpResponsePayloadCodec,
  TErrCodec extends AnyErrHttpResponsePayloadCodec
>(
  ok: TOkCodec,
  err: TErrCodec
) => io.union([ok, err])

export type AnyHttpResponsePayloadCodec = ReturnType<
  typeof anyHttpResponsePayload
>
export type AnyHttpResponsePayload = io.TypeOf<AnyHttpResponsePayloadCodec>
