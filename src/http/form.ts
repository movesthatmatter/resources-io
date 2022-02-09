import * as io from 'io-ts'

// Add More Possible Input Types here as needed
export const formModel = <
  M extends { [key: string]: io.StringC | io.NumberC | io.Mixed }
>(
  m: M
) => m

export type FormModelCodec = ReturnType<typeof formModel>
export type FormModel = { [k: string]: string | number }
export type FormModelKeysMap = { [k: string]: unknown }

const getInvalidInputTypeFromModel = <M extends FormModelCodec>(model: M) =>
  io.record(io.keyof(model), io.union([io.string, io.undefined]))

export const httpInputValidationError = <M extends FormModelCodec>(model: M) =>
  io.type(
    {
      type: io.literal('HttpInputValidationError'),
      invalidInput: getInvalidInputTypeFromModel(model)
    },
    'HttpInputValidationError'
  )

export const inputValidationError = <M extends FormModelCodec>(model: M) =>
  io.type(
    {
      type: io.literal('InputValidationError'),
      content: io.type({
        fields: getInvalidInputTypeFromModel(model)
      })
    },
    'InputValidationError'
  )

export type HttpInputValidationErrorCodec = ReturnType<
  typeof httpInputValidationError
>
export type HttpInputValidationError = io.TypeOf<HttpInputValidationErrorCodec>
