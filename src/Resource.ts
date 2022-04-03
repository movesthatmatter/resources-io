import * as io from 'io-ts'
import { Err, Ok } from 'ts-results'
import { AsyncResultWrapper, AsyncErr } from 'ts-async-results'
import {
  badRequestError,
  commonResponseErrors,
  CommonResponseErrors,
  BadRequestErrorCodec,
  ResourceFailureHandledError,
  BadRequestError
} from './errors'
import {
  isBadEncodingError,
  isBadRequestError,
  isPayloadOfCodec,
  isResourceFailureHandledError,
  eitherToResult,
  isObject,
  keyInObject
} from './util'
import errorReporter from 'io-ts-reporters'
import { toPrettyPrint } from 'src'

type BaseRequestPayloadCodec = io.Mixed
type BaseResponseOkPayloadCodec = io.Mixed

type SingleBaseResponseErrPayloadCodec = io.TypeC<{
  type: any
  content: any
}>

type BaseResponseErrPayloadCodec =
  | SingleBaseResponseErrPayloadCodec
  | io.UnionC<
      [
        SingleBaseResponseErrPayloadCodec,
        SingleBaseResponseErrPayloadCodec,
        ...Array<SingleBaseResponseErrPayloadCodec>
      ]
    >

const responseAsOkResult = <TDataCodec extends io.Mixed>(data: TDataCodec) =>
  io.type(
    {
      ok: io.literal(true),
      data
    },
    'ResponseAsOkResult'
  )
type ResponseAsOkResultCodec = ReturnType<typeof responseAsOkResult>
type ResponseAsOkResult = io.TypeOf<ResponseAsOkResultCodec>

const responseAsErrResult = <TErrCodec extends io.Mixed>(error: TErrCodec) =>
  io.type(
    {
      ok: io.literal(false),
      error
    },
    'ResponseAsErrorResult'
  )
type ResponseAsErrResultCodec = ReturnType<typeof responseAsErrResult>
type ResponseAsErrResult = io.TypeOf<ResponseAsErrResultCodec>

const responseAsResult = <
  TOkCodec extends ResponseAsOkResultCodec,
  TErrCodec extends ResponseAsErrResultCodec
>(
  ok: TOkCodec,
  customErr: TErrCodec
) =>
  io.union(
    [ok, io.union([responseAsErrResult(commonResponseErrors), customErr])],
    'ResponseAsResult'
  )

type ResponseAsResultCodec = ReturnType<typeof responseAsResult>
type ResponseAsResult = io.TypeOf<ResponseAsResultCodec>

export class Resource<
  RequestPayloadCodec extends BaseRequestPayloadCodec,
  ResponseOkPayloadCodec extends BaseResponseOkPayloadCodec,
  ResponseErrPayloadCodec extends BaseResponseErrPayloadCodec = BadRequestErrorCodec,
  RequestPayload = io.TypeOf<RequestPayloadCodec>,
  ResponseOkPayload = io.TypeOf<ResponseOkPayloadCodec>,
  ResponseErrPayload = io.TypeOf<ResponseErrPayloadCodec>
> {
  public requestPayloadCodec: RequestPayloadCodec
  public responseOkPayloadCodec: ResponseOkPayloadCodec
  public responseErrPayloadCodec: ResponseErrPayloadCodec
  public name?: string

  constructor(
    requestPayloadCodec: RequestPayloadCodec,
    responseOkPayloadCodec: ResponseOkPayloadCodec,
    responseErrPayloadCodec: ResponseErrPayloadCodec
  )
  constructor(
    requestPayloadCodec: RequestPayloadCodec,
    responseOkPayloadCodec: ResponseOkPayloadCodec,
    responseErrPayloadCodec: ResponseErrPayloadCodec,
    name?: string
  )
  constructor(
    requestPayloadCodec: RequestPayloadCodec,
    responseOkPayloadCodec: ResponseOkPayloadCodec,
    name?: string
  )
  constructor(
    requestPayloadCodec: RequestPayloadCodec,
    responseOkPayloadCodec: ResponseOkPayloadCodec,
    responseErrPayloadCodecOrName: ResponseErrPayloadCodec | string | undefined,
    name?: string
  ) {
    this.requestPayloadCodec = requestPayloadCodec
    this.responseOkPayloadCodec = responseOkPayloadCodec

    if (
      responseErrPayloadCodecOrName &&
      typeof responseErrPayloadCodecOrName !== 'string'
    ) {
      this.responseErrPayloadCodec = responseErrPayloadCodecOrName
    } else {
      this.responseErrPayloadCodec = badRequestError as ResponseErrPayloadCodec
    }

    if (typeof responseErrPayloadCodecOrName === 'string') {
      this.name = responseErrPayloadCodecOrName
    }

    if (name) {
      this.name = name
    }
  }

  private get allPossibleErrorsCodec() {
    return io.union(
      [commonResponseErrors, this.responseErrPayloadCodec],
      'AllPossibleErrors'
    )
  }

  set resourceName(name: string) {
    this.name = name
  }

  setName(name: string) {
    this.name = name
  }

  request(
    requestPayload: RequestPayload,
    senderFn: (requestPayload: RequestPayload) => Promise<{ data: unknown }>
  ) {
    return new AsyncResultWrapper<
      ResponseOkPayload,
      CommonResponseErrors | ResponseErrPayload
    >(async () => {
      try {
        const { data } = await senderFn(requestPayload)

        const responseAsResultCodec = responseAsResult(
          io.type({
            ok: io.literal(true),
            data: this.responseOkPayloadCodec
          }),
          io.type({
            ok: io.literal(false),
            error: this.allPossibleErrorsCodec
          })
        )

        const decoded = responseAsResultCodec.decode(data)
        const result = eitherToResult(decoded)

        // This happens when the Response Data is not encoded properly!
        if (!result.ok) {
          const errorReport = errorReporter.report(decoded)
          const error = new Err({
            type: 'BadEncodedResponseError',
            content: errorReport
          } as const)

          console.error(
            '[resources-io] Request received a BadEncodedResponseError',
            {
              resourceName: this.name,
              requestPayloadName: this.requestPayloadCodec.name,
              responseOkPayloadName: this.responseOkPayloadCodec.name,
              responseErrPayloadName: this.responseErrPayloadCodec.name,
              requestPayload: toPrettyPrint(requestPayload),
              rawResponsePayload: toPrettyPrint(data),
              error: toPrettyPrint(error),
              errorReport
            }
          )

          return error
        }

        // This happens when the Response Data is encoded properly but the Response is an Err
        if (!result.val.ok) {
          const error = this.getResponseError(result.val)

          console.error('[resources-io] Request received an ErrResponse', {
            resourceName: this.name,
            requestPayloadName: this.requestPayloadCodec.name,
            responseOkPayloadName: this.responseOkPayloadCodec.name,
            responseErrPayloadName: this.responseErrPayloadCodec.name,
            requestPayload: toPrettyPrint(requestPayload),
            rawResponsePayload: toPrettyPrint(data),
            error: toPrettyPrint(error),
            errorReport: undefined
          })

          return error
        }

        return new Ok(result.val.data)
      } catch (e) {
        // TODO: This is tied to the AXIOS payload, which isn't good!
        //  It should at most use fetch or have it dynamically loaded by the requester somehow
        //  Or somehow adhere to a certin interface!
        if (
          isObject(e) &&
          keyInObject(e, 'response') &&
          isObject(e.response) &&
          keyInObject(e.response, 'data')
        ) {
          const error = this.getResponseError(e.response.data)

          // This usually fails due to network error or other library errors
          console.error('[resources-io] Request (Network or Library) Failure', {
            resourceName: this.name,
            requestPayloadName: this.requestPayloadCodec.name,
            responseOkPayloadName: this.responseOkPayloadCodec.name,
            responseErrPayloadName: this.responseErrPayloadCodec.name,
            requestPayload: toPrettyPrint(requestPayload),
            rawResponsePayload: toPrettyPrint(e.response.data),
            error: toPrettyPrint(error),
            errorReport: undefined
          })

          return error
        }

        const error = new Err({
          type: 'BadRequestError',
          content: undefined
        } as const)

        console.error(
          '[resources-io] Request was Badly Encoded (BadRequestError)',
          {
            resourceName: this.name,
            requestPayloadName: this.requestPayloadCodec.name,
            responseOkPayloadName: this.responseOkPayloadCodec.name,
            responseErrPayloadName: this.responseErrPayloadCodec.name,
            requestPayload: toPrettyPrint(requestPayload),
            rawResponsePayload: toPrettyPrint(e),
            error: toPrettyPrint(error),
            errorReport: undefined
          }
        )

        return error
      }
    })
  }

  private getResponseError = (
    e: unknown
  ): Err<CommonResponseErrors | ResponseErrPayload> => {
    const customErrorResult = eitherToResult(
      responseAsErrResult(this.allPossibleErrorsCodec).decode(e)
    )

    if (!customErrorResult.ok) {
      return new Err({
        type: 'BadErrorEncodingError',
        content: undefined
      })
    }

    return new Err(customErrorResult.val.error)
  }

  parseRequest(data: unknown) {
    const decoded = this.requestPayloadCodec.decode(data)

    return new AsyncResultWrapper<RequestPayload, BadRequestError>(
      eitherToResult<RequestPayload, io.Errors>(decoded).mapErr(() => {
        const decodedErrorReport = errorReporter.report(decoded)

        return {
          type: 'BadRequestError',
          isHttpAsyncResultError: true,
          content: decodedErrorReport
        }
      })
    )
  }

  respond(
    data: ResponseOkPayload,
    senderFn: (responseResult: ResponseAsOkResult) => void
  ) {
    // TODO: Should we serialize/encode the data before sending?
    senderFn({
      ok: true,
      data
    })
  }

  fail(
    error: ResponseErrPayload | CommonResponseErrors,
    senderFn: (errPayload: ResponseAsErrResult) => void
  ): AsyncErr<
    ResourceFailureHandledError | ResponseErrPayload | CommonResponseErrors
  > {
    try {
      // TODO: Should we serialize/encode the data before sending?
      senderFn({
        ok: false,
        error
      })

      return new AsyncErr({
        type: 'ResourceFailureHandled',
        content: undefined
      })
    } catch (e) {
      return new AsyncErr(error)
    }
  }

  // TODO: This for now doesn't return the correct one when no errResponse given!
  isResponseError = (e: unknown): e is ResponseErrPayload =>
    isPayloadOfCodec(this.responseErrPayloadCodec, e)

  isBadEncodingError = isBadEncodingError
  isResourceFailureHandledError = isResourceFailureHandledError
  isBadRequestError = isBadRequestError

  // isErrorType(t, e) – a method that limits the possible types to the ones available by the resource instance
  //  this is better than the aboce (static) methods as they will be limited to only the ones available to the given instance
  //  be it given or common
}
